import { NextResponse } from "next/server";
import { FieldPath, Filter } from "firebase-admin/firestore";
import type {
  CollectionReference,
  DocumentData,
  Query,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const VALID_FILTERS = [
  "total",
  "semVinculo",
  "aguardandoCheckin",
  "andamento",
  "inconformidades",
] as const;

type FilterKey = (typeof VALID_FILTERS)[number];

// Fonte única de verdade para os arrays de status.
// Usados tanto nos contadores de KPI quanto em buildFilterQuery,
// garantindo que o número do card sempre bata com as linhas da tabela.
const STATUS_AGUARDANDO_CHECKIN = [
  "Aguardando check-in",
  "Aguardando agendamento",
  "Aguardando chegada do veículo",
] as const;

const STATUS_ANDAMENTO = [
  "Check-in realizado",
  "Em vistoria",
  "Laudo em análise",
] as const;

const PREFIX_SUFFIX = "\uf8ff";

function isValidFilter(value: string): value is FilterKey {
  return (VALID_FILTERS as readonly string[]).includes(value);
}

function buildFilterQuery(
  sinistros: CollectionReference<DocumentData>,
  filter: FilterKey,
): Query<DocumentData> {
  switch (filter) {
    case "semVinculo":
      // Filter.or() — firebase-admin >= 11.4 (instalado: 13.10.0) ✓
      return sinistros.where(
        Filter.or(
          Filter.where("credenciadoId", "==", null),
          Filter.where("credenciadoId", "==", ""),
        ),
      );
    case "aguardandoCheckin":
      return sinistros.where("statusVistoria", "in", [
        ...STATUS_AGUARDANDO_CHECKIN,
      ]);
    case "andamento":
      return sinistros.where("statusVistoria", "in", [...STATUS_ANDAMENTO]);
    default: // "total"
      return sinistros;
  }
}

function matchesFilter(data: DocumentData, filter: FilterKey): boolean {
  if (filter === "total") return true;

  if (filter === "semVinculo") {
    return data.credenciadoId === null || data.credenciadoId === "";
  }

  if (filter === "aguardandoCheckin") {
    return STATUS_AGUARDANDO_CHECKIN.includes(data.statusVistoria);
  }

  if (filter === "andamento") {
    return STATUS_ANDAMENTO.includes(data.statusVistoria);
  }

  return true;
}

async function getSearchMatchedDocIds(
  sinistros: CollectionReference<DocumentData>,
  search: string,
) {
  const suffix = search + PREFIX_SUFFIX;

  const [protocolSnap, placaSnap] = await Promise.all([
    sinistros
      .where("protocol", ">=", search)
      .where("protocol", "<=", suffix)
      .select("protocol")
      .get(),
    sinistros
      .where("veiculoSnapshot.placa", ">=", search)
      .where("veiculoSnapshot.placa", "<=", suffix)
      .select("veiculoSnapshot.placa")
      .get(),
  ]);

  return [
    ...new Set([
      ...protocolSnap.docs.map((d) => d.id),
      ...placaSnap.docs.map((d) => d.id),
    ]),
  ];
}

async function getDocsByIds(
  sinistros: CollectionReference<DocumentData>,
  ids: string[],
) {
  if (ids.length === 0) return [] as QueryDocumentSnapshot<DocumentData>[];

  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += 30) {
    chunks.push(ids.slice(index, index + 30));
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      sinistros.where(FieldPath.documentId(), "in", chunk).get(),
    ),
  );

  return snapshots.flatMap((snapshot) => snapshot.docs);
}

function mapSinistroDoc(doc: QueryDocumentSnapshot<DocumentData>) {
  const data = doc.data();
  return {
    id: (data.protocol as string | undefined) ?? doc.id,
    placa:
      (data.veiculoSnapshot as Record<string, string> | undefined)?.placa ?? "",
    oficina:
      (data.credenciadoSnapshot as Record<string, string> | undefined)?.name ??
      "",
    status: (data.status as string | undefined) ?? "",
    severidade: (data.priority as string | undefined) ?? "",
  };
}

function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return new Date(value as string).getTime();
}

function compareByEntryDateDesc(
  a: QueryDocumentSnapshot<DocumentData>,
  b: QueryDocumentSnapshot<DocumentData>,
): number {
  return toMs(b.data().entryDate) - toMs(a.data().entryDate);
}

// ── Helpers para chartData ────────────────────────────────────────────────────

type ChartPoint = {
  name: string;
  Leve: number;
  Media: number;
  GrandeMonta: number;
};

function normalizeSeveridade(
  raw: unknown,
): keyof Omit<ChartPoint, "name"> | null {
  // Comparação case-insensitive para absorver variações de capitalização do banco
  const val = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (val === "leve" || val === "baixa") return "Leve";
  if (val === "media" || val === "média" || val === "alta") return "Media";
  if (val === "grande monta" || val === "crítica" || val === "critica")
    return "GrandeMonta";
  return null;
}

function extractDay(value: unknown): string | null {
  const str = String(value ?? "").trim();
  // entryDate é salvo como string "YYYY-MM-DD" no Firestore (não Timestamp)
  if (/^\d{4}-\d{2}-(\d{2})/.test(str)) return str.substring(8, 10);
  // fallback: Firestore Timestamp ou milissegundos
  const ms = toMs(value);
  return ms ? String(new Date(ms).getDate()).padStart(2, "0") : null;
}

function buildChartData(
  docs: QueryDocumentSnapshot<DocumentData>[],
): ChartPoint[] {
  const map = new Map<string, ChartPoint>();

  for (const doc of docs) {
    const data = doc.data();
    const day = extractDay(data.entryDate);
    if (!day) continue;

    if (!map.has(day))
      map.set(day, { name: day, Leve: 0, Media: 0, GrandeMonta: 0 });

    // Lê o mesmo campo que mapSinistroDoc usa para a tabela (priority),
    // com fallback para severidade caso o documento use nomenclatura diferente
    const rawSev = data.priority ?? data.severidade;
    const sev = normalizeSeveridade(rawSev);
    if (sev) map.get(day)![sev] += 1;
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// ── Helpers para recentAlerts ─────────────────────────────────────────────────

function serializeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === "string") return value;
  return null;
}

function tipoToType(tipo: unknown): "critical" | "warning" | "info" {
  const val = String(tipo ?? "").toLowerCase();
  if (val === "critico" || val === "critical") return "critical";
  if (val === "sla" || val === "warning") return "warning";
  return "info";
}

// Campos mapeados conforme DashboardAlert em components/dashboard/types.ts
function mapAlertaDoc(doc: QueryDocumentSnapshot<DocumentData>) {
  const data = doc.data();
  return {
    id: doc.id,
    sinistroId: (data.sinistroId as string | undefined) ?? "",
    type: tipoToType(data.tipo),
    title: (data.titulo as string | undefined) ?? "",
    description: (data.descricao as string | undefined) ?? "",
    createdAt: serializeTimestamp(data.dataHora),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(
      1,
      parseInt(searchParams.get("page") ?? "1", 10) || 1,
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "5", 10) || 5),
    );
    const rawFilter = searchParams.get("filter") ?? "total";
    const filter: FilterKey = isValidFilter(rawFilter) ? rawFilter : "total";
    // Normaliza para maiúsculas: protocolo (ARG-2026-...) e placas são sempre uppercase
    const search = (searchParams.get("search") ?? "").trim().toUpperCase();
    const offset = (page - 1) * limit;

    const db = getAdminDb();
    const sinistros = db.collection("sinistro");
    const alertas = db.collection("alertas");

    // --- KPIs + chartData + recentAlerts (tudo em paralelo) ---
    const [
      totalSnap,
      semVinculoNullSnap,
      semVinculoVazioSnap,
      aguardandoCheckinSnap,
      andamentoSnap,
      inconformidadesSnap,
      sinistrosDoMesSnap,
      recentAlertsSnap,
    ] = await Promise.all([
      sinistros.count().get(),
      sinistros.where("credenciadoId", "==", null).count().get(),
      sinistros.where("credenciadoId", "==", "").count().get(),
      sinistros
        .where("statusVistoria", "in", [...STATUS_AGUARDANDO_CHECKIN])
        .count()
        .get(),
      sinistros
        .where("statusVistoria", "in", [...STATUS_ANDAMENTO])
        .count()
        .get(),
      alertas.where("tipo", "==", "critico").count().get(),
      // chartData: documentos completos — sem .select() para garantir acesso a todos
      // os campos de severidade independente do nome exato usado no documento
      sinistros.limit(100).get(),
      // recentAlerts: orderBy em campo único — não exige índice composto
      alertas.orderBy("dataHora", "desc").limit(4).get(),
    ]);

    const kpis = {
      total: totalSnap.data().count,
      semVinculo:
        semVinculoNullSnap.data().count + semVinculoVazioSnap.data().count,
      aguardandoCheckin: aguardandoCheckinSnap.data().count,
      andamento: andamentoSnap.data().count,
      inconformidades: inconformidadesSnap.data().count,
    };

    const chartData = buildChartData(sinistrosDoMesSnap.docs);
    const recentAlerts = recentAlertsSnap.docs.map(mapAlertaDoc);

    // --- recentClaims paginado + totalFiltered ---
    let totalFiltered: number;
    let recentClaims: ReturnType<typeof mapSinistroDoc>[];

    if (filter === "inconformidades") {
      // Etapa 1: coleta sinistroIds dos alertas críticos.
      // .select() projeta apenas o campo necessário para reduzir largura de banda.
      const alertasSnap = await alertas
        .where("tipo", "==", "critico")
        .select("sinistroId")
        .get();

      const allIds = [
        ...new Set(
          alertasSnap.docs
            .map((d) => d.data().sinistroId as string)
            .filter(Boolean),
        ),
      ];

      // Filtra por search em memória (prefix no protocol/sinistroId)
      const filteredIds = search
        ? allIds.filter((id) => id.toUpperCase().startsWith(search))
        : allIds;

      if (filteredIds.length === 0) {
        totalFiltered = 0;
        recentClaims = [];
      } else {
        // Firestore "in" suporta no máximo 30 valores por query
        const pageIds = filteredIds.slice(0, 30);
        const q = sinistros.where("protocol", "in", pageIds);

        const [countSnap, docsSnap] = await Promise.all([
          q.count().get(),
          q.offset(offset).limit(limit).get(),
        ]);

        // Se houver mais de 30 IDs únicos, usa o tamanho do array como aproximação do total
        totalFiltered =
          filteredIds.length <= 30
            ? countSnap.data().count
            : filteredIds.length;
        recentClaims = docsSnap.docs
          .sort(compareByEntryDateDesc)
          .map(mapSinistroDoc);
      }
    } else if (!search) {
      const q = buildFilterQuery(sinistros, filter);
      const [countSnap, docsSnap] = await Promise.all([
        q.count().get(),
        q.offset(offset).limit(limit).get(),
      ]);
      totalFiltered = countSnap.data().count;
      recentClaims = docsSnap.docs
        .sort(compareByEntryDateDesc)
        .map(mapSinistroDoc);
    } else {
      // Busca server-side por prefixo em protocol + placa, com filtro aplicado em memória.
      // Evita dependência de índice composto para combinações de OR + range.
      const matchedIds = await getSearchMatchedDocIds(sinistros, search);

      if (matchedIds.length === 0) {
        totalFiltered = 0;
        recentClaims = [];
      } else {
        const matchedDocs = await getDocsByIds(sinistros, matchedIds);
        const filteredDocs = matchedDocs.filter((docSnap) =>
          matchesFilter(docSnap.data(), filter),
        );

        const sortedDocs = filteredDocs.sort(compareByEntryDateDesc);
        totalFiltered = sortedDocs.length;
        recentClaims = sortedDocs
          .slice(offset, offset + limit)
          .map(mapSinistroDoc);
      }
    }

    return NextResponse.json({
      kpis,
      recentClaims,
      totalFiltered,
      chartData,
      recentAlerts,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao buscar dados do dashboard.";

    return NextResponse.json(
      {
        error: "Falha ao carregar dados do dashboard.",
        details: message,
        kpis: {
          total: 0,
          semVinculo: 0,
          aguardandoCheckin: 0,
          andamento: 0,
          inconformidades: 0,
        },
        recentClaims: [],
        totalFiltered: 0,
        chartData: [],
        recentAlerts: [],
      },
      { status: 500 },
    );
  }
}
