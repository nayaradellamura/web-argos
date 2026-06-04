import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, AuthError } from "@/lib/auth-server";

export const runtime = "nodejs";

// PATCH /api/sinistros/[id]/vincular
// Vincula um credenciado ao sinistro → transição para EM_ANDAMENTO

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
    const credenciadoId = body.credenciadoId ? String(body.credenciadoId).trim() : "";

    if (!credenciadoId) {
      return NextResponse.json(
        { error: "credenciadoId é obrigatório." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const [sinistroSnap, credenciadoSnap] = await Promise.all([
      db.collection("sinistro").doc(id).get(),
      db.collection("credenciados").doc(credenciadoId).get(),
    ]);

    if (!sinistroSnap.exists) {
      return NextResponse.json({ error: "Sinistro não encontrado." }, { status: 404 });
    }
    if (!credenciadoSnap.exists) {
      return NextResponse.json({ error: "Credenciado não encontrado." }, { status: 404 });
    }

    const credData = credenciadoSnap.data()!;
    const credenciadoSnapshot = {
      name: String(credData.name ?? ""),
      address: String(credData.address ?? ""),
      city: String(credData.city ?? ""),
      email: String(credData.email ?? ""),
      phone: String(credData.phone ?? ""),
      uf: String(credData.uf ?? ""),
    };

    const now = new Date().toISOString();
    await db.collection("sinistro").doc(id).update({
      status: "EM_ANDAMENTO",
      credenciadoId,
      credenciadoSnapshot,
      checkInAt: null,
      updatedAt: now,
    });

    return NextResponse.json({
      id,
      credenciadoId,
      credenciadoSnapshot,
      status: "EM_ANDAMENTO",
      checkInAt: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao vincular credenciado.", details: message },
      { status: 500 },
    );
  }
}
