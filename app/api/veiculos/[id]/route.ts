import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, AuthError } from "@/lib/auth-server";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function buildUpdatePayload(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") return {};

  // Remove campos que não devem ser sobrescritos via PATCH/PUT
  const { id: _id, criadoEm: _criadoEm, ...rest } = input as Record<string, unknown>;

  const payload: Record<string, unknown> = { ...rest };

  // Normaliza placa para maiúsculas (padrão do Firestore e da busca do dashboard)
  if (typeof payload.placa === "string") {
    payload.placa = payload.placa.trim().toUpperCase();
  }

  // Frontend pode enviar "ano" mas o campo canônico no Firestore é "anoFabricacao"
  if ("ano" in payload) {
    payload.anoFabricacao = Number(payload.ano);
    delete payload.ano;
  }

  payload.atualizadoEm = FieldValue.serverTimestamp();

  return payload;
}

async function updateVeiculo(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const veiculoId = decodeURIComponent(id ?? "").trim();

    if (!veiculoId) {
      return NextResponse.json(
        { error: "ID do veículo é obrigatório." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const payload = buildUpdatePayload(body);

    const docRef = getAdminDb().collection("veiculos").doc(veiculoId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Veículo não encontrado." },
        { status: 404 },
      );
    }

    await docRef.set(payload, { merge: true });

    return NextResponse.json({ success: true, id: veiculoId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar veículo.";

    return NextResponse.json(
      { error: "Falha ao atualizar veículo.", details: message },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return updateVeiculo(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return updateVeiculo(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAuth(request);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: (e as Error).message }, { status: 401 });
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }
  try {

    const { id } = await context.params;
    const veiculoId = decodeURIComponent(id ?? "").trim();

    if (!veiculoId) {
      return NextResponse.json(
        { error: "ID do veículo é obrigatório." },
        { status: 400 },
      );
    }

    const docRef = getAdminDb().collection("veiculos").doc(veiculoId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Veículo não encontrado." },
        { status: 404 },
      );
    }

    await docRef.delete();

    return NextResponse.json({ success: true, id: veiculoId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir veículo.";

    return NextResponse.json(
      { error: "Falha ao excluir veículo.", details: message },
      { status: 500 },
    );
  }
}
