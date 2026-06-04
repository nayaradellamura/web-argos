import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, AuthError } from "@/lib/auth-server";

export const runtime = "nodejs";

// GET /api/sinistros/[id]/alertas
// Retorna todos os alertas vinculados ao sinistro.
// Ausência de alertas é sucesso: retorna 200 com array vazio.

function serializeTs(value: unknown): string | null {
  if (!value) return null;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : null;
}

function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return new Date(value as string).getTime();
}

function tipoToType(tipo: unknown): "critical" | "warning" | "info" {
  const val = String(tipo ?? "").toLowerCase();
  if (val === "critico" || val === "critical") return "critical";
  if (val === "sla" || val === "warning") return "warning";
  return "info";
}

async function findSinistroDocRefById(rawId: string) {
  const adminDb = getAdminDb();
  const sinistroCollection = adminDb.collection("sinistro");
  const id = decodeURIComponent(rawId).trim();

  if (!id) {
    return null;
  }

  const directDocRef = sinistroCollection.doc(id);
  const directDocSnap = await directDocRef.get();

  if (directDocSnap.exists) {
    return directDocRef;
  }

  const byIdSnapshot = await sinistroCollection
    .where("id", "==", id)
    .limit(1)
    .get();
  if (!byIdSnapshot.empty) {
    return byIdSnapshot.docs[0].ref;
  }

  const byProtocolSnapshot = await sinistroCollection
    .where("protocol", "==", id)
    .limit(1)
    .get();

  if (!byProtocolSnapshot.empty) {
    return byProtocolSnapshot.docs[0].ref;
  }

  return null;
}

export async function GET(
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
    const db = getAdminDb();
    const ref = await findSinistroDocRefById(id);

    if (!ref) {
      return NextResponse.json(
        { error: "Sinistro não encontrado." },
        { status: 404 },
      );
    }

    // Sem orderBy para evitar necessidade de índice composto.
    // Ordenação feita em memória.
    const alertasSnap = await db
      .collection("alertas")
      .where("sinistroId", "==", ref.id)
      .get();

    const alertas = alertasSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sinistroId: (data.sinistroId as string | undefined) ?? ref.id,
          type: tipoToType(data.tipo),
          title: (data.titulo as string | undefined) ?? "",
          description: (data.descricao as string | undefined) ?? "",
          categoria: (data.categoria as string | undefined) ?? "",
          lido: Boolean(data.lido),
          createdAt: serializeTs(data.dataHora),
          _ts: toMs(data.dataHora),
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts: _, ...rest }) => rest);

    return NextResponse.json({
      sinistroId: ref.id,
      alertas,
      total: alertas.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao buscar alertas.", details: message },
      { status: 500 },
    );
  }
}
