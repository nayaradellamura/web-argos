import { NextResponse } from "next/server";
import { FieldPath } from "firebase-admin/firestore";
import type {
  CollectionReference,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, AuthError } from "@/lib/auth-server";

export const runtime = "nodejs";

const VALID_TIPOS = ["geral", "rejeitadas", "alertasIA", "kanban"] as const;
type TipoTabela = (typeof VALID_TIPOS)[number];

function isValidTipo(value: string): value is TipoTabela {
  return (VALID_TIPOS as readonly string[]).includes(value);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function hasCredenciado(data: DocumentData): boolean {
  const cid = data.credenciadoId;
  return cid !== null && cid !== undefined && String(cid).trim() !== "";
}

function hasCheckIn(data: DocumentData): boolean {
  const ci = data.checkInAt;
  return ci !== null && ci !== undefined;
}

function mapSinistroDoc(
  doc: QueryDocumentSnapshot<DocumentData>,
  motivoRejeicao?: string,
) {
  const data = doc.data();
  return {
    id: (data.protocol as string | undefined) ?? doc.id,
    docId: doc.id,
    placa:
      (data.veiculoSnapshot as Record<string, string> | undefined)?.placa ?? "",
    oficina:
      (data.credenciadoSnapshot as Record<string, string> | undefined)?.name ??
      "",
    status: String(data.status ?? "").toUpperCase(),
    severidade: (data.priority as string | undefined) ?? "",
    credenciadoId: (data.credenciadoId as string | undefined) ?? null,
    checkInAt: serializeTs(data.checkInAt),
    entryDate:
      serializeTs(data.entryDate) ??
      (data.entryDate as string | undefined) ??
      null,
    ...(motivoRejeicao !== undefined ? { motivoRejeicao } : {}),
  };
}

async function getDocsByIds(
  col: CollectionReference<DocumentData>,
  ids: string[],
) {
  if (ids.length === 0) return [] as QueryDocumentSnapshot<DocumentData>[];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
  const snaps = await Promise.all(
    chunks.map((chunk) => col.where(FieldPath.documentId(), "in", chunk).get()),
  );
  return snaps.flatMap((s) => s.docs);
}

async function findSinistroDocByIdentifier(
  col: CollectionReference<DocumentData>,
  rawIdentifier: string,
) {
  const identifier = decodeURIComponent(rawIdentifier).trim();

  if (!identifier) return null;

  const directDocs = await getDocsByIds(col, [identifier]);
  if (directDocs.length > 0) {
    return directDocs[0];
  }

  const [byIdSnapshot, byProtocolSnapshot] = await Promise.all([
    col.where("id", "==", identifier).limit(1).get(),
    col.where("protocol", "==", identifier).limit(1).get(),
  ]);

  if (!byIdSnapshot.empty) {
    return byIdSnapshot.docs[0];
  }

  if (!byProtocolSnapshot.empty) {
    return byProtocolSnapshot.docs[0];
  }

  return null;
}

// ── Kanban ────────────────────────────────────────────────────────────────────

type KanbanColumn =
  | "triagem"
  | "aguardandoCheckin"
  | "checkinRealizado"
  | "emVistoria"
  | "analiseOperacional"
  | "finalizados";

function classifyKanbanColumn(
  data: DocumentData,
  latestVistoriaStatus: string | null,
): KanbanColumn {
  // Normaliza ambos os status para maiúsculo (dados legados podem estar em minúsculo)
  const sinistroStatus = String(data.status ?? "").toUpperCase();
  const vStatus = latestVistoriaStatus ? latestVistoriaStatus.toUpperCase() : null;

  if (sinistroStatus === "FINALIZADO") return "finalizados";
  if (!hasCredenciado(data)) return "triagem";
  if (!hasCheckIn(data)) return "aguardandoCheckin";
  if (vStatus === null) return "checkinRealizado";
  if (vStatus === "EM_ANALISE_OPERACIONAL") return "analiseOperacional";
  if (vStatus === "CANCELADA") return "finalizados";
  if (vStatus === "EM_ANDAMENTO") return "emVistoria";
  // REJEITADA ou FINALIZADA com sinistro ainda em andamento → emVistoria
  return "emVistoria";
}

function mapKanbanCard(
  doc: QueryDocumentSnapshot<DocumentData>,
  latestVistoriaStatus: string | null,
  isRejected: boolean,
  hasHistoricoRejeicao: boolean,
  kanbanColumn: KanbanColumn,
  latestVistoriaTipoVistoria: string | null = null,
) {
  const data = doc.data();
  const clienteSnap = data.clienteSnapshot as
    | Record<string, unknown>
    | undefined;
  const veiculoSnap = data.veiculoSnapshot as
    | Record<string, unknown>
    | undefined;
  const credSnap = data.credenciadoSnapshot as
    | Record<string, unknown>
    | null
    | undefined;

  return {
    id: doc.id,
    protocol: (data.protocol as string | undefined) ?? doc.id,
    status: String(data.status ?? "").toUpperCase(),
    priority: (data.priority as string | undefined) ?? "",
    claimType: (data.claimType as string | undefined) ?? "",
    damageDescription: (data.damageDescription as string | undefined) ?? "",
    observations: (data.observations as string | undefined) ?? "",
    credenciadoId: (data.credenciadoId as string | undefined | null) ?? null,
    checkInAt: serializeTs(data.checkInAt),
    entryDate:
      serializeTs(data.entryDate) ??
      (data.entryDate as string | undefined) ??
      null,
    latestVistoriaStatus,
    tipoVistoria: latestVistoriaTipoVistoria,
    isRejected,
    hasHistoricoRejeicao,
    kanbanColumn,
    // Snapshots completos para o frontend ler campos aninhados livremente
    clienteSnapshot: clienteSnap ?? null,
    veiculoSnapshot: veiculoSnap ?? null,
    seguradorasSnapshot:
      (data.seguradorasSnapshot as Record<string, unknown> | undefined) ?? null,
    credenciadoSnapshot: credSnap ?? null,
    // Atalhos de leitura rápida para UI
    clienteNome: String(clienteSnap?.nomeCompleto ?? clienteSnap?.nome ?? ""),
    clienteTelefone: String(clienteSnap?.telefone ?? clienteSnap?.phone ?? ""),
    placa: String(veiculoSnap?.placa ?? ""),
    veiculoMarca: String(veiculoSnap?.marca ?? ""),
    veiculoModelo: String(veiculoSnap?.modelo ?? ""),
    veiculoAno: veiculoSnap?.ano ?? null,
    oficinaNome: credSnap ? String(credSnap.name ?? "") : null,
    oficinaCidade: credSnap ? String(credSnap.cidade ?? "") : null,
  };
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    await requireAuth(request);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: (e as Error).message }, { status: 401 });
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }
  try {

    const { searchParams } = new URL(request.url);

    const rawTipo = searchParams.get("tipo") ?? "geral";
    const tipo: TipoTabela = isValidTipo(rawTipo) ? rawTipo : "geral";
    const protocolo = searchParams.get("protocolo")?.trim() ?? "";
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") ?? "1", 10) || 1,
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10),
    );
    const offset = (page - 1) * limit;

    const db = getAdminDb();
    const sinistros = db.collection("sinistro");
    const vistorias = db.collection("vistorias");
    const alertas = db.collection("alertas");

    // ── KANBAN ────────────────────────────────────────────────────────────────
    if (tipo === "kanban") {
      if (protocolo) {
        const targetDoc = await findSinistroDocByIdentifier(
          sinistros,
          protocolo,
        );

        const columns: Record<
          KanbanColumn,
          ReturnType<typeof mapKanbanCard>[]
        > = {
          triagem: [],
          aguardandoCheckin: [],
          checkinRealizado: [],
          emVistoria: [],
          analiseOperacional: [],
          finalizados: [],
        };

        if (!targetDoc) {
          return NextResponse.json({ columns });
        }

        const vistoriasSnap = await vistorias
          .where("sinistroId", "==", targetDoc.id)
          .get();

        let latestStatus: string | null = null;
        let latestTipoVistoria: string | null = null;
        let latestTs = 0;
        let everRejected = false;

        for (const v of vistoriasSnap.docs) {
          const data = v.data();
          const ts = toMs(data.createdAt);
          if (ts > latestTs) {
            latestTs = ts;
            latestStatus = String(data.status ?? "").toUpperCase();
            latestTipoVistoria = (data.tipoVistoria as string | undefined) ?? null;
          }
          if (String(data.status ?? "").toUpperCase() === "REJEITADA") {
            everRejected = true;
          }
        }

        const column = classifyKanbanColumn(targetDoc.data(), latestStatus);
        const isRejected = latestStatus === "REJEITADA";
        columns[column].push(
          mapKanbanCard(
            targetDoc,
            latestStatus,
            isRejected,
            everRejected,
            column,
            latestTipoVistoria,
          ),
        );

        return NextResponse.json({ columns });
      }

      const [allSinistrosSnap, allVistoriasSnap] = await Promise.all([
        sinistros.get(),
        vistorias.get(),
      ]);

      // Vistoria mais recente e flag de rejeição por sinistro
      const latestStatus = new Map<string, string>();
      const latestTipoVistoria = new Map<string, string | null>();
      const latestTs = new Map<string, number>();
      const everRejected = new Map<string, boolean>();

      for (const v of allVistoriasSnap.docs) {
        const data = v.data();
        const sid = data.sinistroId as string | undefined;
        if (!sid) continue;
        const ts = toMs(data.createdAt);
        if (ts > (latestTs.get(sid) ?? 0)) {
          latestTs.set(sid, ts);
          latestStatus.set(sid, String(data.status ?? "").toUpperCase());
          latestTipoVistoria.set(sid, (data.tipoVistoria as string | undefined) ?? null);
        }
        if (String(data.status ?? "").toUpperCase() === "REJEITADA") everRejected.set(sid, true);
      }

      const columns: Record<KanbanColumn, ReturnType<typeof mapKanbanCard>[]> =
        {
          triagem: [],
          aguardandoCheckin: [],
          checkinRealizado: [],
          emVistoria: [],
          analiseOperacional: [],
          finalizados: [],
        };

      for (const doc of allSinistrosSnap.docs) {
        const vStatus = latestStatus.get(doc.id) ?? null;
        const vTipo = latestTipoVistoria.get(doc.id) ?? null;
        const col = classifyKanbanColumn(doc.data(), vStatus);
        const isRej = vStatus === "REJEITADA";
        const hasHistorico = everRejected.get(doc.id) ?? false;
        columns[col].push(
          mapKanbanCard(doc, vStatus, isRej, hasHistorico, col, vTipo),
        );
      }

      // Ordenar cada coluna por entryDate desc
      for (const col of Object.values(columns)) {
        col.sort((a, b) => toMs(b.entryDate) - toMs(a.entryDate));
      }

      return NextResponse.json({ columns });
    }

    // ── GERAL ─────────────────────────────────────────────────────────────────
    let docs: QueryDocumentSnapshot<DocumentData>[];
    let totalFiltered: number;

    if (tipo === "geral") {
      const [countSnap, docsSnap] = await Promise.all([
        sinistros.count().get(),
        sinistros.offset(offset).limit(limit).get(),
      ]);
      totalFiltered = countSnap.data().count;
      docs = docsSnap.docs.sort(
        (a, b) => toMs(b.data().entryDate) - toMs(a.data().entryDate),
      );
      return NextResponse.json({
        sinistros: docs.map((d) => mapSinistroDoc(d)),
        totalFiltered,
        page,
        limit,
      });
    }

    // ── REJEITADAS ────────────────────────────────────────────────────────────
    if (tipo === "rejeitadas") {
      // Etapa 1: candidatos — sinistros com ao menos uma vistoria REJEITADA (ambos os cases)
      const vistoriasRejSnap = await vistorias
        .where("status", "in", ["REJEITADA", "rejeitada"])
        .get();

      const candidateIds = [
        ...new Set(
          vistoriasRejSnap.docs
            .map((d) => d.data().sinistroId as string)
            .filter(Boolean),
        ),
      ];

      if (candidateIds.length === 0) {
        return NextResponse.json({ sinistros: [], totalFiltered: 0 });
      }

      // Etapa 2: todas as vistorias desses sinistros
      const chunks: string[][] = [];
      for (let i = 0; i < candidateIds.length; i += 30)
        chunks.push(candidateIds.slice(i, i + 30));
      const allVistoriasSnaps = await Promise.all(
        chunks.map((chunk) => vistorias.where("sinistroId", "in", chunk).get()),
      );
      const allVistoriasDocs = allVistoriasSnaps.flatMap((s) => s.docs);

      // Etapa 3: vistoria mais recente por sinistro
      const latestVistoria = new Map<
        string,
        { status: string; createdAt: unknown; motivoRejeicao: string }
      >();
      for (const v of allVistoriasDocs) {
        const data = v.data();
        const sid = data.sinistroId as string | undefined;
        if (!sid) continue;
        const existing = latestVistoria.get(sid);
        if (!existing || toMs(data.createdAt) > toMs(existing.createdAt)) {
          latestVistoria.set(sid, {
            status: String(data.status ?? "").toUpperCase(),
            createdAt: data.createdAt,
            motivoRejeicao: String(data.motivoRejeicao ?? ""),
          });
        }
      }

      // Etapa 4: apenas sinistros cuja vistoria MAIS RECENTE é REJEITADA
      const motivoMap = new Map<string, string>();
      const finalIds: string[] = [];
      for (const [sid, latest] of latestVistoria) {
        if (latest.status === "REJEITADA") {
          finalIds.push(sid);
          motivoMap.set(sid, latest.motivoRejeicao);
        }
      }

      if (finalIds.length === 0) {
        return NextResponse.json({ sinistros: [], totalFiltered: 0 });
      }

      const allDocs = await getDocsByIds(sinistros, finalIds);
      const sorted = allDocs.sort(
        (a, b) => toMs(b.data().entryDate) - toMs(a.data().entryDate),
      );

      totalFiltered = sorted.length;
      docs = sorted.slice(offset, offset + limit);

      return NextResponse.json({
        sinistros: docs.map((d) => mapSinistroDoc(d, motivoMap.get(d.id))),
        totalFiltered,
        page,
        limit,
      });
    }

    // ── ALERTAS IA ────────────────────────────────────────────────────────────
    // tipo === "alertasIA": vistoria EM_ANALISE_OPERACIONAL + alerta ativo
    const [vistoriasOpSnap, alertasSnap] = await Promise.all([
      vistorias.where("status", "in", ["EM_ANALISE_OPERACIONAL", "em_analise_operacional"]).get(),
      alertas.select("sinistroId").get(),
    ]);

    const comVistoriaOp = new Set(
      vistoriasOpSnap.docs
        .map((d) => d.data().sinistroId as string)
        .filter(Boolean),
    );
    const comAlerta = new Set(
      alertasSnap.docs
        .map((d) => d.data().sinistroId as string)
        .filter(Boolean),
    );
    const candidateIds = [...comVistoriaOp].filter((id) => comAlerta.has(id));

    if (candidateIds.length === 0) {
      return NextResponse.json({ sinistros: [], totalFiltered: 0 });
    }

    const allDocs = await getDocsByIds(sinistros, candidateIds);
    const sorted = allDocs.sort(
      (a, b) => toMs(b.data().entryDate) - toMs(a.data().entryDate),
    );

    totalFiltered = sorted.length;
    docs = sorted.slice(offset, offset + limit);

    return NextResponse.json({
      sinistros: docs.map((d) => mapSinistroDoc(d)),
      totalFiltered,
      page,
      limit,
    });
  } catch (error) {
    console.error("Erro ao buscar sinistros:", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao buscar sinistros.", details: message },
      { status: 500 },
    );
  }
}

// ── POST — Criar Sinistro ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    await requireAuth(request);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: (e as Error).message }, { status: 401 });
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }
  try {

    const body = (await request.json()) as Record<string, unknown>;
    const {
      clienteId,
      veiculoId,
      seguradoraId,
      claimType,
      priority,
      damageDescription,
    } = body;

    if (!clienteId || !veiculoId || !seguradoraId || !claimType || !priority) {
      return NextResponse.json(
        {
          error:
            "Campos obrigatórios: clienteId, veiculoId, seguradoraId, claimType, priority.",
        },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const sinistros = db.collection("sinistro");

    const [clienteSnap, veiculoSnap, seguradoraSnap, countSnap] =
      await Promise.all([
        db.collection("clientes").doc(String(clienteId)).get(),
        db.collection("veiculos").doc(String(veiculoId)).get(),
        db.collection("seguradoras").doc(String(seguradoraId)).get(),
        sinistros.count().get(),
      ]);

    if (!clienteSnap.exists) {
      return NextResponse.json(
        { error: "Cliente não encontrado." },
        { status: 404 },
      );
    }
    if (!veiculoSnap.exists) {
      return NextResponse.json(
        { error: "Veículo não encontrado." },
        { status: 404 },
      );
    }
    if (!seguradoraSnap.exists) {
      return NextResponse.json(
        { error: "Seguradora não encontrada." },
        { status: 404 },
      );
    }

    const year = new Date().getFullYear();
    const seq = String(countSnap.data().count + 1).padStart(4, "0");
    const protocol = `ARG-${year}-${seq}`;
    const now = new Date().toISOString();

    const newDoc = {
      protocol,
      status: "PENDENTE",
      priority: String(priority),
      claimType: String(claimType),
      damageDescription: String(damageDescription ?? ""),
      observations: "",
      chatEnabled: true,
      chatStatus: "Aberto",
      clienteId: String(clienteId),
      veiculoId: String(veiculoId),
      seguradoraId: String(seguradoraId),
      credenciadoId: null,
      checkInAt: null,
      entryDate: now,
      clienteSnapshot: clienteSnap.data() ?? {},
      veiculoSnapshot: veiculoSnap.data() ?? {},
      seguradorasSnapshot: seguradoraSnap.data() ?? {},
      credenciadoSnapshot: null,
      createdAt: now,
      updatedAt: now,
    };

    await sinistros.doc(protocol).set(newDoc);
    return NextResponse.json({ id: protocol, ...newDoc }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar sinistro:", error);
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao criar sinistro.", details: message },
      { status: 500 },
    );
  }
}
