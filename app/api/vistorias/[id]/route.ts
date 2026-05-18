import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { VistoriaStatus } from "@/lib/types/firestore";

export const runtime = "nodejs";

const VALID_STATUSES: VistoriaStatus[] = [
  "EM_ANDAMENTO",
  "EM_ANALISE_IA",
  "EM_ANALISE_OPERACIONAL",
  "FINALIZADA",
  "REJEITADA",
];

function isValidStatus(value: string): value is VistoriaStatus {
  return (VALID_STATUSES as string[]).includes(value);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID da vistoria é obrigatório." }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const newStatus = body.status as string | undefined;

    if (!newStatus || !isValidStatus(newStatus)) {
      return NextResponse.json(
        {
          error: "Status inválido.",
          validos: VALID_STATUSES,
        },
        { status: 400 },
      );
    }

    // Validação: motivoRejeicao obrigatório ao rejeitar
    if (newStatus === "REJEITADA") {
      const motivo = body.motivoRejeicao;
      if (!motivo || String(motivo).trim() === "") {
        return NextResponse.json(
          { error: "motivoRejeicao é obrigatório ao rejeitar uma vistoria." },
          { status: 400 },
        );
      }
    }

    const db = getAdminDb();
    const vistoriaRef = db.collection("vistorias").doc(id);
    const vistoriaSnap = await vistoriaRef.get();

    if (!vistoriaSnap.exists) {
      return NextResponse.json({ error: "Vistoria não encontrada." }, { status: 404 });
    }

    const vistoriaData = vistoriaSnap.data()!;
    const sinistroId = vistoriaData.sinistroId as string | undefined;

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === "REJEITADA" && body.motivoRejeicao) {
      updatePayload.motivoRejeicao = String(body.motivoRejeicao).trim();
    }

    // Regra de transição: FINALIZADA → sinistro pai passa para FINALIZADO
    if (newStatus === "FINALIZADA" && sinistroId) {
      const sinistroRef = db.collection("sinistro").doc(sinistroId);
      await Promise.all([
        vistoriaRef.update(updatePayload),
        sinistroRef.update({
          status: "FINALIZADO",
          updatedAt: new Date().toISOString(),
        }),
      ]);
    } else {
      await vistoriaRef.update(updatePayload);
    }

    const updated = await vistoriaRef.get();
    return NextResponse.json({ id, ...updated.data() });
  } catch (error) {
    console.error("Erro ao atualizar vistoria:", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao atualizar vistoria.", details: message },
      { status: 500 },
    );
  }
}
