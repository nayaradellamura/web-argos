import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function buildUpdatePayload(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") return {};
  const { id: _id, criadoEm: _criadoEm, ...rest } = input as Record<string, unknown>;
  return { ...rest, atualizadoEm: FieldValue.serverTimestamp() };
}

async function updateCliente(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const clienteId = decodeURIComponent(id ?? "").trim();

    if (!clienteId) {
      return NextResponse.json(
        { error: "ID do cliente é obrigatório." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const payload = buildUpdatePayload(body);

    const docRef = getAdminDb().collection("clientes").doc(clienteId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    await docRef.set(payload, { merge: true });

    return NextResponse.json({ success: true, id: clienteId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar cliente.";

    return NextResponse.json(
      { error: "Falha ao atualizar cliente.", details: message },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return updateCliente(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return updateCliente(request, context);
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const clienteId = decodeURIComponent(id ?? "").trim();

    if (!clienteId) {
      return NextResponse.json(
        { error: "ID do cliente é obrigatório." },
        { status: 400 },
      );
    }

    const docRef = getAdminDb().collection("clientes").doc(clienteId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }

    await docRef.delete();

    return NextResponse.json({ success: true, id: clienteId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir cliente.";

    return NextResponse.json(
      { error: "Falha ao excluir cliente.", details: message },
      { status: 500 },
    );
  }
}
