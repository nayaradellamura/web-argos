import { NextResponse } from "next/server";
import { getAdminDb, getAdminMessaging } from "@/lib/firebase-admin";
import { requireAuth, AuthError } from "@/lib/auth-server";
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

    // Subcoleção de áudios com transcrições (nova estrutura)
    const audiosSubSnap = await db
      .collection("vistorias")
      .doc(id)
      .collection("audios")
      .get();
    const audiosSubcollection = audiosSubSnap.docs.map((doc) => ({
      id: doc.id,
      ...serializeFirestore(doc.data()) as Record<string, unknown>,
    }));

    const veiculoSnap = sData.veiculoSnapshot as Record<string, unknown> | undefined;
    const clienteSnap = sData.clienteSnapshot as Record<string, unknown> | undefined;
    const credSnap    = sData.credenciadoSnapshot as Record<string, unknown> | undefined;

    const payload = {
      id: vistoriaSnap.id,
      sinistroId: sinistroId ?? null,
      status:              String(vData.status ?? "").toUpperCase(),
      tipoVistoria:        vData.tipoVistoria ? String(vData.tipoVistoria) : null,
      retificacaoAtualId:  vData.retificacaoAtualId ? String(vData.retificacaoAtualId) : null,
      vistoriaOrigemId:    vData.vistoriaOrigemId ? String(vData.vistoriaOrigemId) : null,
      motivoRejeicao:      vData.motivoRejeicao ? String(vData.motivoRejeicao) : null,
      ajustesNecessarios:  vData.ajustesNecessarios ? String(vData.ajustesNecessarios) : null,
      motivoCancelamento:  vData.motivoCancelamento ? String(vData.motivoCancelamento) : null,
      laudo:               vData.laudo ? String(vData.laudo) : null,
      pdfLaudoUrl:         vData.pdfLaudoUrl ? String(vData.pdfLaudoUrl) : null,
      alertas:             vData.alertas ?? null,
      createdAt:           serializeFirestore(vData.createdAt) as string | null,
      updatedAt:           serializeFirestore(vData.updatedAt) as string | null,

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

      // Subcoleção de áudios com transcrições
      audiosSubcollection,
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
  "EM_ANALISE_OPERACIONAL",
  "FINALIZADA",
  "REJEITADA",
  "CANCELADA",
];

const FCM_NOTIFY_STATUSES = new Set<string>([
  "EM_ANALISE_OPERACIONAL",
  "FINALIZADA",
  "REJEITADA",
  "CANCELADA",
]);

function isValidStatus(value: string): value is VistoriaStatus {
  return (VALID_STATUSES as string[]).includes(value);
}

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

    // Validação: motivoRejeicao + ajustesNecessarios obrigatórios ao rejeitar
    if (newStatus === "REJEITADA") {
      const motivo = body.motivoRejeicao;
      if (!motivo || String(motivo).trim() === "") {
        return NextResponse.json(
          { error: "motivoRejeicao é obrigatório ao rejeitar uma vistoria." },
          { status: 400 },
        );
      }
      const ajustes = body.ajustesNecessarios;
      if (!ajustes || String(ajustes).trim() === "") {
        return NextResponse.json(
          { error: "ajustesNecessarios é obrigatório ao rejeitar uma vistoria." },
          { status: 400 },
        );
      }
    }

    // Validação: motivoCancelamento obrigatório ao cancelar
    if (newStatus === "CANCELADA") {
      const motivo = body.motivoCancelamento;
      if (!motivo || String(motivo).trim() === "") {
        return NextResponse.json(
          { error: "motivoCancelamento é obrigatório ao cancelar uma vistoria." },
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

    // Bloqueia edições em status terminais
    const currentStatus = String(vistoriaData.status ?? "").toUpperCase();
    if (currentStatus === "FINALIZADA" || currentStatus === "CANCELADA") {
      return NextResponse.json(
        { error: `Não é possível editar uma vistoria com status ${currentStatus}.` },
        { status: 409 },
      );
    }

    const sinistroId = vistoriaData.sinistroId as string | undefined;

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newStatus === "REJEITADA") {
      updatePayload.motivoRejeicao = String(body.motivoRejeicao).trim();
      updatePayload.ajustesNecessarios = String(body.ajustesNecessarios).trim();
    }

    if (newStatus === "CANCELADA") {
      updatePayload.motivoCancelamento = String(body.motivoCancelamento).trim();
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

    // Notificação FCM (não-fatal: erro não interrompe a resposta)
    if (FCM_NOTIFY_STATUSES.has(newStatus)) {
      try {
        await getAdminMessaging().send({
          topic: `vistoria_${id}`,
          notification: {
            title: `Vistoria ${id}`,
            body: `Status atualizado para ${newStatus}`,
          },
          data: { vistoriaId: id, status: newStatus },
        });
      } catch (fcmError) {
        console.error("FCM dispatch falhou (não-fatal):", fcmError);
      }
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
