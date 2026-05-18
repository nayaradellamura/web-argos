import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// PATCH /api/sinistros/[id]/finalizar
// Finaliza o sinistro: atualiza a vistoria mais recente para FINALIZADA
// e o sinistro pai para FINALIZADO.

function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return new Date(value as string).getTime();
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getAdminDb();

    const [sinistroSnap, vistoriasSnap] = await Promise.all([
      db.collection("sinistro").doc(id).get(),
      db.collection("vistorias").where("sinistroId", "==", id).get(),
    ]);

    if (!sinistroSnap.exists) {
      return NextResponse.json({ error: "Sinistro não encontrado." }, { status: 404 });
    }

    if (vistoriasSnap.empty) {
      return NextResponse.json(
        { error: "Nenhuma vistoria encontrada para este sinistro." },
        { status: 400 },
      );
    }

    // Determina a vistoria mais recente
    let latestDoc = vistoriasSnap.docs[0]!;
    for (const v of vistoriasSnap.docs.slice(1)) {
      if (toMs(v.data().createdAt) > toMs(latestDoc.data().createdAt)) {
        latestDoc = v;
      }
    }

    const now = new Date().toISOString();

    await Promise.all([
      latestDoc.ref.update({ status: "FINALIZADA", updatedAt: now }),
      db.collection("sinistro").doc(id).update({ status: "FINALIZADO", updatedAt: now }),
    ]);

    return NextResponse.json({
      id,
      status: "FINALIZADO",
      vistoriaId: latestDoc.id,
      vistoriaStatus: "FINALIZADA",
      updatedAt: now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao finalizar sinistro.", details: message },
      { status: 500 },
    );
  }
}
