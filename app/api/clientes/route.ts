import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  try {
    const snap = await getAdminDb().collection("clientes").limit(200).get();
    const clientes = snap.docs
      .map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const nome = toText(data.nomeCompleto) || toText(data.nome) || doc.id;
        const cpfCnpj = toText(data.cpfCnpj);
        return {
          id: doc.id,
          label: cpfCnpj ? `${nome} • ${cpfCnpj}` : nome,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    return NextResponse.json({ clientes });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar clientes.";

    return NextResponse.json(
      { error: "Falha ao listar clientes.", details: message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const nomeCompleto = toText(body.nomeCompleto);
    const cpfCnpj = toText(body.cpfCnpj);
    const telefone = toText(body.telefone);
    const email = toText(body.email);

    if (!nomeCompleto || !cpfCnpj || !telefone || !email) {
      return NextResponse.json(
        { error: "Preencha Nome Completo, CPF/CNPJ, Telefone e E-mail." },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    const payload = {
      nomeCompleto,
      cpfCnpj,
      telefone,
      email,
      status: "Ativo",
      riscoHistorico: "Baixo",
      tipoPessoa:
        cpfCnpj.replace(/\D/g, "").length > 11 ? "Juridica" : "Fisica",
      criadoEm: FieldValue.serverTimestamp(),
      atualizadoEm: FieldValue.serverTimestamp(),
    };

    const docRef = await getAdminDb().collection("clientes").add(payload);

    return NextResponse.json(
      {
        success: true,
        cliente: {
          id: docRef.id,
          ...payload,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar cliente.";

    return NextResponse.json(
      { error: "Falha ao criar cliente.", details: message },
      { status: 500 },
    );
  }
}
