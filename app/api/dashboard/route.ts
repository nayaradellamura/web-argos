import { NextResponse } from "next/server";
import type {
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, AuthError } from "@/lib/auth-server";

export const runtime = "nodejs";

const VALID_FILTERS = [
  "aguardandoVinculo",
  "aguardandoCheckin",
  "checkinRealizado",
  "emVistoria",
  "aguardandoAceite",
] as const;

type FilterKey = (typeof VALID_FILTERS)[number];

// Inclui ambos os cases: dados legados em minúsculo e novos dados em MAIÚSCULO
const VISTORIA_RELEVANT_STATUSES = [
  "EM_ANDAMENTO",           "em_andamento",
  "EM_ANALISE_OPERACIONAL", "em_analise_operacional",
  "REJEITADA",              "rejeitada",
  "CANCELADA",              "cancelada",
] as const;

function isValidFilter(value: string): value is FilterKey {
  return (VALID_FILTERS as readonly string[]).includes(value);
}

// ── Helpers de campo ──────────────────────────────────────────────────────────

function hasCredenciado(data: DocumentData): boolean {
  const cid = data.credenciadoId;
  return cid !== null && cid !== undefined && String(cid).trim() !== "";
}

function hasCheckIn(data: DocumentData): boolean {
  const ci = data.checkInAt;
  return ci !== null && ci !== undefined;
}

function matchesSearch(data: DocumentData, search: string): boolean {
  const protocol = String(data.protocol ?? "").toUpperCase();
  const placa = String(
    (data.veiculoSnapshot as Record<string, string> | undefined)?.placa ?? "",
  ).toUpperCase();
  return protocol.includes(search) || placa.includes(search);
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

function mapSinistroDoc(doc: QueryDocumentSnapshot<DocumentData>) {
  const data = doc.data();
  return {
    id: (data.protocol as string | undefined) ?? doc.id,
    placa:
      (data.veiculoSnapshot as Record<string, string> | undefined)?.placa ?? "",
    oficina:
      (data.credenciadoSnapshot as Record<string, string> | undefined)?.name ??
      "",
    status: String(data.status ?? "").toUpperCase(),
    severidade: (data.priority as string | undefined) ?? "",
  };
}

// ── Filtro in-memory ──────────────────────────────────────────────────────────

function applyFilter(
  docs: QueryDocumentSnapshot<DocumentData>[],
  filter: FilterKey | null,
  emVistoriaIds: Set<string>,
  aguardandoAceiteIds: Set<string>,
  allVistoriaIds: Set<string>,
): QueryDocumentSnapshot<DocumentData>[] {
  if (filter === "aguardandoVinculo")
    return docs.filter((d) => !hasCredenciado(d.data()));

  if (filter === "aguardandoCheckin")
    return docs.filter((d) => hasCredenciado(d.data()) && !hasCheckIn(d.data()));

  if (filter === "checkinRealizado")
    return docs.filter(
      (d) =>
        hasCredenciado(d.data()) &&
        hasCheckIn(d.data()) &&
        !allVistoriaIds.has(d.id),
    );

  if (filter === "emVistoria")
    return docs.filter((d) => emVistoriaIds.has(d.id));

  if (filter === "aguardandoAceite")
    return docs.filter((d) => aguardandoAceiteIds.has(d.id));

  return docs; // null = sem filtro → todos
}

// ── chartData ─────────────────────────────────────────────────────────────────

type ChartPoint = { name: string; Leve: number; Media: number; GrandeMonta: number };

function normalizeSeveridade(raw: unknown): keyof Omit<ChartPoint, "name"> | null {
  const val = String(raw ?? "").trim().toLowerCase();
  if (val === "leve" || val === "baixa") return "Leve";
  if (val === "media" || val === "média" || val === "alta") return "Media";
  if (val === "grande monta" || val === "crítica" || val === "critica") return "GrandeMonta";
  return null;
}

function extractDay(value: unknown): string | null {
  const str = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-(\d{2})/.test(str)) return str.substring(8, 10);
  const ms = toMs(value);
  return ms ? String(new Date(ms).getDate()).padStart(2, "0") : null;
}

function buildChartData(docs: QueryDocumentSnapshot<DocumentData>[]): ChartPoint[] {
  const map = new Map<string, ChartPoint>();
  for (const doc of docs) {
    const data = doc.data();
    const day = extractDay(data.entryDate);
    if (!day) continue;
    if (!map.has(day)) map.set(day, { name: day, Leve: 0, Media: 0, GrandeMonta: 0 });
    const sev = normalizeSeveridade(data.priority ?? data.severidade);
    if (sev) map.get(day)![sev] += 1;
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// ── recentAlerts ──────────────────────────────────────────────────────────────

function serializeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : null;
}

function tipoToType(tipo: unknown): "critical" | "warning" | "info" {
  const val = String(tipo ?? "").toLowerCase();
  if (val === "critico" || val === "critical") return "critical";
  if (val === "sla" || val === "warning") return "warning";
  return "info";
}

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

// ── Handler principal ─────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    await requireAuth(request);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: (e as Error).message }, { status: 401 });
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }
  try {

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "5", 10) || 5));
    const rawFilter = searchParams.get("filter") ?? "";
    const filter: FilterKey | null = isValidFilter(rawFilter) ? rawFilter : null;
    const search = (searchParams.get("search") ?? "").trim().toUpperCase();
    const offset = (page - 1) * limit;

    const db = getAdminDb();
    const sinistros = db.collection("sinistro");
    const vistorias = db.collection("vistorias");
    const alertas = db.collection("alertas");

    // ── Fetch paralelo ────────────────────────────────────────────────────────
    // Todos os sinistros em memória → elimina necessidade de múltiplas queries
    // e permite classificar pelos campos reais (credenciadoId, checkInAt)
    const [allSinistrosSnap, vistoriasSnap, recentAlertsSnap] =
      await Promise.all([
        sinistros.get(),
        vistorias.where("status", "in", [...VISTORIA_RELEVANT_STATUSES]).get(),
        alertas.orderBy("dataHora", "desc").limit(4).get(),
      ]);

    const allDocs = allSinistrosSnap.docs;

    // Encontra o status da vistoria mais recente por sinistro (in-memory)
    const latestVistoria = new Map<string, { status: string; ts: number }>();
    for (const v of vistoriasSnap.docs) {
      const data = v.data();
      const sid = data.sinistroId as string | undefined;
      if (!sid) continue;
      const ts = toMs(data.createdAt);
      const current = latestVistoria.get(sid);
      if (!current || ts > current.ts) {
        // Normaliza para MAIÚSCULO para comparações consistentes (dados legados em minúsculo)
        latestVistoria.set(sid, { status: String(data.status ?? "").toUpperCase(), ts });
      }
    }

    // Sets exclusivos (espelha classifyKanbanColumn): um sinistro só cai em um set
    const emVistoriaIds = new Set<string>();
    const aguardandoAceiteIds = new Set<string>();
    for (const [sid, { status }] of latestVistoria.entries()) {
      if (status === "EM_ANALISE_OPERACIONAL") {
        aguardandoAceiteIds.add(sid);
      } else if (status !== "CANCELADA" && status !== "FINALIZADA") {
        // EM_ANDAMENTO | REJEITADA
        emVistoriaIds.add(sid);
      }
      // CANCELADA / FINALIZADA não pertencem a nenhum conjunto ativo
    }
    const allVistoriaIds = new Set([...emVistoriaIds, ...aguardandoAceiteIds]);

    // ── KPIs (classificação in-memory por credenciadoId / checkInAt) ──────────
    let aguardandoVinculo = 0;
    let aguardandoCheckin = 0;
    let checkinRealizado = 0;

    for (const doc of allDocs) {
      const data = doc.data();
      if (!hasCredenciado(data)) {
        aguardandoVinculo++;
      } else if (!hasCheckIn(data)) {
        aguardandoCheckin++;
      } else if (!allVistoriaIds.has(doc.id)) {
        checkinRealizado++;
      }
      // se tem credenciado + checkIn + vistoria → pertence ao card emVistoria ou aguardandoAceite
    }

    const kpis = {
      aguardandoVinculo,
      aguardandoCheckin,
      checkinRealizado,
      emVistoria: emVistoriaIds.size,
      aguardandoAceite: aguardandoAceiteIds.size,
    };

    const chartData = buildChartData(allDocs);
    const recentAlerts = recentAlertsSnap.docs.map(mapAlertaDoc);

    // ── recentClaims paginado (100% in-memory) ────────────────────────────────

    const preFiltered = applyFilter(allDocs, filter, emVistoriaIds, aguardandoAceiteIds, allVistoriaIds);

    const postSearch = search
      ? preFiltered.filter((d) => matchesSearch(d.data(), search))
      : preFiltered;

    const sorted = [...postSearch].sort(compareByEntryDateDesc);
    const totalFiltered = sorted.length;
    const recentClaims = sorted.slice(offset, offset + limit).map(mapSinistroDoc);

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
      error instanceof Error ? error.message : "Erro desconhecido ao buscar dados do dashboard.";
    return NextResponse.json(
      {
        error: "Falha ao carregar dados do dashboard.",
        details: message,
        kpis: {
          aguardandoVinculo: 0,
          aguardandoCheckin: 0,
          checkinRealizado: 0,
          emVistoria: 0,
          aguardandoAceite: 0,
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
