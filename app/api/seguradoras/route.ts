import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
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
