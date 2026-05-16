import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const VALID_STAGES = [
  "fnol",
  "validacao",
  "vistoria",
  "orcamento",
  "regulacao",
  "liquidacao",
] as const;

type StageId = (typeof VALID_STAGES)[number];

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidStage(stage: string): stage is StageId {
  return VALID_STAGES.includes(stage as StageId);
}

async function findSinistroDocRefById(rawId: string) {
  const adminDb = getAdminDb();
  const sinistroCollection = adminDb.collection("sinistro");

  const directDocRef = sinistroCollection.doc(rawId);
  const directDocSnap = await directDocRef.get();

  if (directDocSnap.exists) {
    return directDocRef;
  }

  const byIdSnapshot = await sinistroCollection
    .where("id", "==", rawId)
    .limit(1)
    .get();

  if (!byIdSnapshot.empty) {
    return byIdSnapshot.docs[0].ref;
  }

  const byProtocolSnapshot = await sinistroCollection
    .where("protocol", "==", rawId)
    .limit(1)
    .get();

  if (!byProtocolSnapshot.empty) {
    return byProtocolSnapshot.docs[0].ref;
  }

  return null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const sinistroId = decodeURIComponent(id);

    if (!sinistroId) {
      return NextResponse.json(
        { error: "ID do sinistro é obrigatório." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));

    const stage = normalizeString(body.stage);

    if (!isValidStage(stage)) {
      return NextResponse.json(
        {
          error:
            "Estágio inválido. Use: fnol, validacao, vistoria, orcamento, regulacao, liquidacao.",
        },
        { status: 400 },
      );
    }

    const credenciado = normalizeString(body.credenciado);
    const localVistoria = normalizeString(body.localVistoria);
    const dataVistoria = normalizeString(body.dataVistoria);
    const horaVistoria = normalizeString(body.horaVistoria);
    const statusVistoria = normalizeString(body.statusVistoria);

    const sinistroRef = await findSinistroDocRefById(sinistroId);

    if (!sinistroRef) {
      return NextResponse.json(
        { error: "Sinistro não encontrado." },
        { status: 404 },
      );
    }

    const updatePayload: Record<string, unknown> = {
      stage,
      status: stage,
      statusUpdatedAt: FieldValue.serverTimestamp(),
      atualizadoEm: FieldValue.serverTimestamp(),
    };

    if (stage === "vistoria") {
      updatePayload.statusVistoria = statusVistoria || "agendada";
      updatePayload["despachoVistoria"] = {
        credenciado,
        local: localVistoria,
        data: dataVistoria,
        hora: horaVistoria,
      };
    }

    await sinistroRef.set(updatePayload, { merge: true });

    return NextResponse.json({
      success: true,
      id: sinistroId,
      stage,
      message: "Estágio atualizado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao atualizar estágio do sinistro:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao atualizar estágio do sinistro.";

    return NextResponse.json(
      {
        error: "Falha ao atualizar estágio do sinistro.",
        details: message,
      },
      { status: 500 },
    );
  }
}
