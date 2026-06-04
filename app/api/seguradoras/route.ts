import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, AuthError } from "@/lib/auth-server";

export const runtime = "nodejs";

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request) {
  try {
    await requireAuth(request);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: (e as Error).message }, { status: 401 });
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }
  try {

    const snap = await getAdminDb().collection("seguradoras").limit(200).get();
    const seguradoras = snap.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const nome =
          toText(data.nome) ||
          toText(data.name) ||
          toText(data.razaoSocial) ||
          doc.id;
        const cnpj = toText(data.cnpj);
        return {
          id: doc.id,
          label: cnpj ? `${nome} • ${cnpj}` : nome,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json({ seguradoras });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar seguradoras.";

    return NextResponse.json(
      { error: "Falha ao listar seguradoras.", details: message },
      { status: 500 },
    );
  }
}
