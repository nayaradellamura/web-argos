import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// GET /api/sinistros/[id]/vistorias
// Retorna o histórico completo de vistorias de um sinistro, da mais recente à mais antiga.

function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return new Date(value as string).getTime();
}

function serializeTs(value: unknown): string | null {
  if (!value) return null;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : null;
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    // Sem orderBy para evitar índice composto — ordenação in-memory
    const vistoriasSnap = await db
      .collection("vistorias")
      .where("sinistroId", "==", ref.id)
      .get();

    const vistorias = vistoriasSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sinistroId: (data.sinistroId as string | undefined) ?? ref.id,
          status: (data.status as string | undefined) ?? "",
          motivoRejeicao: (data.motivoRejeicao as string | undefined) ?? null,
          createdAt: serializeTs(data.createdAt),
          updatedAt: serializeTs(data.updatedAt),
          _ts: toMs(data.createdAt),
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts: _, ...rest }) => rest);

    return NextResponse.json({
      sinistroId: ref.id,
      vistorias,
      total: vistorias.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao buscar histórico de vistorias.", details: message },
      { status: 500 },
    );
  }
}
