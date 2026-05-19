import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { VistoriaStatus } from "@/lib/types/firestore";

export const runtime = "nodejs";

// ── Serialização recursiva de Timestamps do Firestore ─────────────────────────
// Converte qualquer valor que possua .toDate() em ISO string para não quebrar
// o JSON.stringify (Timestamps não são serializáveis nativamente).
function serializeFirestore(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // Firestore Timestamp
  if (typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  // Array
  if (Array.isArray(value)) {
    return value.map(serializeFirestore);
  }

  // Objeto plain
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeFirestore(v);
    }
    return out;
  }

  return value;
}

// ── GET /api/vistorias/[id] ───────────────────────────────────────────────────
// Retorna a vistoria completa com dados do sinistro pai (snapshots de cliente,
// veículo e credenciado) embutidos para evitar round-trips no frontend.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID da vistoria é obrigatório." }, { status: 400 });
    }

    const db = getAdminDb();
    const vistoriaSnap = await db.collection("vistorias").doc(id).get();

    if (!vistoriaSnap.exists) {
      return NextResponse.json({ error: "Vistoria não encontrada." }, { status: 404 });
    }

    const vData = vistoriaSnap.data()!;
    const sinistroId = vData.sinistroId as string | undefined;

    // Busca dados do sinistro pai em paralelo (para snapshots de cliente/veículo/credenciado)
    const sinistroSnap = sinistroId
      ? await db.collection("sinistro").doc(sinistroId).get()
      : null;

    const sData = sinistroSnap?.data() ?? {};

    // Campos de mídia: images e audios são objetos com chaves dinâmicas (vistoria_1, audio_1…)
    // chatmessages é um array de { role, text, createdAt }
    const images = (vData.images as Record<string, string> | undefined) ?? {};
    const audios = (vData.audios as Record<string, string> | string[] | undefined) ?? {};
    const chatmessages = Array.isArray(vData.chatmessages) ? vData.chatmessages : [];

    const veiculoSnap = sData.veiculoSnapshot as Record<string, unknown> | undefined;
    const clienteSnap = sData.clienteSnapshot as Record<string, unknown> | undefined;
    const credSnap    = sData.credenciadoSnapshot as Record<string, unknown> | undefined;

    const payload = {
      id: vistoriaSnap.id,
      sinistroId: sinistroId ?? null,
      status:           String(vData.status ?? "").toUpperCase(),
      motivoRejeicao:   vData.motivoRejeicao ? String(vData.motivoRejeicao) : null,
      laudo:            vData.laudo ? String(vData.laudo) : null,
      pdfLaudoUrl:      vData.pdfLaudoUrl ? String(vData.pdfLaudoUrl) : null,
      alertas:          vData.alertas ?? null,
      createdAt:        serializeFirestore(vData.createdAt) as string | null,
      updatedAt:        serializeFirestore(vData.updatedAt) as string | null,

      // Campos derivados do sinistro pai
      placa:       String(veiculoSnap?.placa ?? sData.placa ?? ""),
      veiculo:     [veiculoSnap?.marca, veiculoSnap?.modelo].filter(Boolean).join(" ") || null,
      cliente:     String(clienteSnap?.nomeCompleto ?? clienteSnap?.nome ?? ""),
      credenciado: String(credSnap?.name ?? ""),
      local:       [credSnap?.city, credSnap?.uf].filter(Boolean).join(" - ") || null,

      // Data/hora da vistoria (entryDate do sinistro, ou createdAt da vistoria)
      data: serializeFirestore(sData.entryDate ?? vData.createdAt) as string | null,

      // Mídia — retornada como estrutura original para o frontend iterar
      images:      serializeFirestore(images) as Record<string, string>,
      audios:      serializeFirestore(audios),
      chatmessages: serializeFirestore(chatmessages),
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao buscar vistoria.", details: message },
      { status: 500 },
    );
  }
}

const VALID_STATUSES: VistoriaStatus[] = [
  "EM_ANDAMENTO",
  "EM_ANALISE_IA",
  "EM_ANALISE_OPERACIONAL",
  "FINALIZADA",
  "REJEITADA",
];

function isValidStatus(value: string): value is VistoriaStatus {
  return (VALID_STATUSES as string[]).includes(value);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID da vistoria é obrigatório." }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const newStatus = body.status as string | undefined;

    if (!newStatus || !isValidStatus(newStatus)) {
      return NextResponse.json(
        {
          error: "Status inválido.",
          validos: VALID_STATUSES,
        },
        { status: 400 },
      );
    }

    // Validação: motivoRejeicao obrigatório ao rejeitar
    if (newStatus === "REJEITADA") {
      const motivo = body.motivoRejeicao;
      if (!motivo || String(motivo).trim() === "") {
        return NextResponse.json(
          { error: "motivoRejeicao é obrigatório ao rejeitar uma vistoria." },
          { status: 400 },
        );
      }
    }

    const db = getAdminDb();
    const vistoriaRef = db.collection("vistorias").doc(id);
    const vistoriaSnap = await vistoriaRef.get();

    if (!vistoriaSnap.exists) {
      return NextResponse.json({ error: "Vistoria não encontrada." }, { status: 404 });
    }

    const vistoriaData = vistoriaSnap.data()!;
    const sinistroId = vistoriaData.sinistroId as string | undefined;

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === "REJEITADA" && body.motivoRejeicao) {
      updatePayload.motivoRejeicao = String(body.motivoRejeicao).trim();
    }

    // Regra de transição: FINALIZADA → sinistro pai passa para FINALIZADO
    if (newStatus === "FINALIZADA" && sinistroId) {
      const sinistroRef = db.collection("sinistro").doc(sinistroId);
      await Promise.all([
        vistoriaRef.update(updatePayload),
        sinistroRef.update({
          status: "FINALIZADO",
          updatedAt: new Date().toISOString(),
        }),
      ]);
    } else {
      await vistoriaRef.update(updatePayload);
    }

    const updated = await vistoriaRef.get();
    return NextResponse.json({ id, ...updated.data() });
  } catch (error) {
    console.error("Erro ao atualizar vistoria:", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao atualizar vistoria.", details: message },
      { status: 500 },
    );
  }
}
