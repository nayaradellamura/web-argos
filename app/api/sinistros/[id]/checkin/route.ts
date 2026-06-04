import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, AuthError } from "@/lib/auth-server";

export const runtime = "nodejs";

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
    const body = (await request.json()) as { checkInAt?: string };
    const checkInAt =
      typeof body.checkInAt === "string" && body.checkInAt.trim()
        ? body.checkInAt
        : new Date().toISOString();

    const db = getAdminDb();
    const ref = db.collection("sinistro").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Sinistro não encontrado." },
        { status: 404 },
      );
    }

    const updatedAt = new Date().toISOString();

    await ref.update({
      checkInAt,
      updatedAt,
    });

    return NextResponse.json({ id, checkInAt, updatedAt });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao confirmar check-in.", details: message },
      { status: 500 },
    );
  }
}
