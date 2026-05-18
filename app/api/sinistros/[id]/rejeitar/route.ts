import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// PATCH /api/sinistros/[id]/rejeitar
// Rejeita a vistoria mais recente do sinistro.
// O sinistro permanece como EM_ANDAMENTO para que a oficina refaça a inspeção.

function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return new Date(value as string).getTime();
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const motivoRejeicao = body.motivoRejeicao
      ? String(body.motivoRejeicao).trim()
      : "";

    if (!motivoRejeicao) {
      return NextResponse.json(
        { error: "motivoRejeicao é obrigatório para rejeitar uma vistoria." },
        { status: 400 },
      );
    }

    const db = getAdminDb();

    const [sinistroSnap, vistoriasSnap] = await Promise.all([
      db.collection("sinistro").doc(id).get(),
      db.collection("vistorias").where("sinistroId", "==", id).get(),
    ]);

    if (!sinistroSnap.exists) {
      return NextResponse.json(
        { error: "Sinistro não encontrado." },
        { status: 404 },
      );
    }

    if (vistoriasSnap.empty) {
      return NextResponse.json(
        { error: "Nenhuma vistoria encontrada para este sinistro." },
        { status: 400 },
      );
    }

    // Determina a vistoria mais recente pelo createdAt
    let latestDoc = vistoriasSnap.docs[0]!;
    for (const v of vistoriasSnap.docs.slice(1)) {
      if (toMs(v.data().createdAt) > toMs(latestDoc.data().createdAt)) {
        latestDoc = v;
      }
    }

    const now = new Date().toISOString();

    // Apenas a vistoria é atualizada — sinistro permanece EM_ANDAMENTO
    await latestDoc.ref.update({
      status: "REJEITADA",
      motivoRejeicao,
      updatedAt: now,
    });

    return NextResponse.json({
      id,
      sinistroStatus: sinistroSnap.data()!.status,
      vistoriaId: latestDoc.id,
      vistoriaStatus: "REJEITADA",
      motivoRejeicao,
      updatedAt: now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao rejeitar vistoria.", details: message },
      { status: 500 },
    );
  }
}
