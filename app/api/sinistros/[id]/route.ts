import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

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

// ── GET — Detalhe completo com última vistoria ────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const snap = await db.collection("sinistro").doc(id).get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Sinistro não encontrado." },
        { status: 404 },
      );
    }

    // Busca todas as vistorias e determina a mais recente
    const vistoriasSnap = await db
      .collection("vistorias")
      .where("sinistroId", "==", id)
      .get();

    let latestVistoria: Record<string, unknown> | null = null;
    let latestTs = 0;

    for (const v of vistoriasSnap.docs) {
      const ts = toMs(v.data().createdAt);
      if (ts > latestTs) {
        latestTs = ts;
        latestVistoria = {
          id: v.id,
          ...v.data(),
          createdAt: serializeTs(v.data().createdAt),
          updatedAt: serializeTs(v.data().updatedAt),
        };
      }
    }

    const data = snap.data()!;
    return NextResponse.json({
      id,
      ...data,
      checkInAt: serializeTs(data.checkInAt),
      entryDate: serializeTs(data.entryDate) ?? data.entryDate ?? null,
      createdAt: serializeTs(data.createdAt),
      updatedAt: serializeTs(data.updatedAt),
      latestVistoria,
      totalVistorias: vistoriasSnap.size,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao buscar sinistro.", details: message },
      { status: 500 },
    );
  }
}

// ── PATCH — Atualizar campos operacionais ─────────────────────────────────────

const ALLOWED_PATCH_FIELDS = [
  "priority",
  "damageDescription",
  "observations",
  "claimType",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const update: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    for (const field of ALLOWED_PATCH_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    if (Object.keys(update).length === 1) {
      return NextResponse.json(
        { error: "Nenhum campo válido para atualizar." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const ref = db.collection("sinistro").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Sinistro não encontrado." },
        { status: 404 },
      );
    }

    await ref.update(update);
    return NextResponse.json({ id, ...update });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao atualizar sinistro.", details: message },
      { status: 500 },
    );
  }
}

// ── DELETE — Exclusão permanente (hard delete) ────────────────────────────────

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const ref = db.collection("sinistro").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Sinistro não encontrado." },
        { status: 404 },
      );
    }

    await ref.delete();
    return NextResponse.json({ message: "Sinistro excluído com sucesso.", id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao excluir sinistro.", details: message },
      { status: 500 },
    );
  }
}
