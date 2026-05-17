import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const clienteId = toText(body.clienteId);
    const proprietario = toText(body.proprietario);
    const placa = toText(body.placa).toUpperCase();
    const marca = toText(body.marca);
    const modelo = toText(body.modelo);
    const cor = toText(body.cor);
    const tipoCobertura = toText(body.tipoCobertura);
    const ano = Number(body.ano);

    if (
      !clienteId ||
      !placa ||
      !marca ||
      !modelo ||
      !cor ||
      !tipoCobertura ||
      !Number.isFinite(ano)
    ) {
      return NextResponse.json(
        {
          error:
            "Preencha Cliente, Placa, Marca, Modelo, Ano, Cor e Cobertura.",
        },
        { status: 400 },
      );
    }

    if (!Number.isInteger(ano) || ano < 1900 || ano > 2100) {
      return NextResponse.json({ error: "Ano inválido." }, { status: 400 });
    }

    const payload = {
      placa,
      marca,
      modelo,
      anoFabricacao: ano,
      cor,
      proprietario,
      clienteId,
      combustivel: "",
      chassi: "",
      renavam: "",
      tipoCobertura,
      status: "Ativo",
      criadoEm: FieldValue.serverTimestamp(),
      atualizadoEm: FieldValue.serverTimestamp(),
    };

    const docRef = await getAdminDb().collection("veiculos").add(payload);

    return NextResponse.json(
      {
        success: true,
        veiculo: {
          id: docRef.id,
          ...payload,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar veículo.";

    return NextResponse.json(
      { error: "Falha ao criar veículo.", details: message },
      { status: 500 },
    );
  }
}
