import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, AuthError } from "@/lib/auth-server";

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
    await requireAuth(request);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: (e as Error).message }, { status: 401 });
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }
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

    const ajustesNecessarios = body.ajustesNecessarios
      ? String(body.ajustesNecessarios).trim()
      : "";

    if (!ajustesNecessarios) {
      return NextResponse.json(
        { error: "ajustesNecessarios é obrigatório para rejeitar uma vistoria." },
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
    const latestData = latestDoc.data();

    // sinistro.status permanece EM_ANDAMENTO (a oficina ainda vai refazer a
    // inspeção) — mas vistoriaAtualStatus precisa virar REJEITADA, senão o
    // app mobile nunca mostra pro mecânico que precisa refazer (é o campo
    // que isRevisionCategory usa em inspection_case.dart).
    await Promise.all([
      latestDoc.ref.update({
        status: "REJEITADA",
        motivoRejeicao,
        ajustesNecessarios,
        updatedAt: now,
      }),
      db.collection("sinistro").doc(id).update({
        vistoriaAtualId: String(latestData.idvistoria ?? latestDoc.id),
        vistoriaAtualStatus: "REJEITADA",
        vistoriaAtualTipo: latestData.tipoVistoria ?? "ORIGINAL",
        ultimaVistoriaAt: now,
        updatedAt: now,
      }),
    ]);

    return NextResponse.json({
      id,
      sinistroStatus: sinistroSnap.data()!.status,
      vistoriaId: latestDoc.id,
      vistoriaStatus: "REJEITADA",
      motivoRejeicao,
      ajustesNecessarios,
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
