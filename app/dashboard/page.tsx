"use client";
import { apiFetch } from "@/lib/api-client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { SeverityChart } from "@/components/dashboard/severity-chart";
import { RecentClaimsTable } from "@/components/dashboard/recent-claims-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  type DashboardClaim,
  type DashboardFilter,
  type DashboardKpis,
  type TipoTabela,
} from "@/components/dashboard/types";

const PAGE_SIZE = 5;
const AUDIT_PAGE_SIZE = 10;

// ─── Normalização de sinistro vindo de /api/sinistros ────────────────────────

function normalizeSinistro(raw: Record<string, unknown>): DashboardClaim {
  const severityMap: Record<string, DashboardClaim["severidade"]> = {
    baixa: "Baixa",
    leve: "Leve",
    media: "Media",
    média: "Média",
    alta: "Alta",
    crítica: "Crítica",
    critica: "Crítica",
    "grande monta": "Grande Monta",
  };
  return {
    id: String(raw.id ?? "-"),
    placa: String(raw.placa ?? "-"),
    oficina: String(raw.oficina ?? "-"),
    status: String(raw.status ?? "PENDENTE"),
    severidade:
      severityMap[String(raw.severidade ?? "").toLowerCase()] ?? "Media",
    motivoRejeicao:
      typeof raw.motivoRejeicao === "string" ? raw.motivoRejeicao : undefined,
  };
}

// ─── Hook genérico para uma tabela de sinistros independente ─────────────────

function useSinistrosTable(
  tipo: TipoTabela,
  activeFilter?: DashboardFilter | null,
  pageSize = PAGE_SIZE,
) {
  const [claims, setClaims] = useState<DashboardClaim[]>([]);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        const normalizedSearch = search.trim().toUpperCase();

        if (tipo === "geral" && activeFilter) {
          params.set("page", String(page));
          params.set("limit", String(PAGE_SIZE));
          params.set("filter", activeFilter);
          if (normalizedSearch) {
            params.set("search", normalizedSearch);
          }

          const res = await apiFetch(`/api/dashboard?${params.toString()}`);
          if (!res.ok) throw new Error(`dashboard fetch failed: ${res.status}`);

          const data = (await res.json()) as {
            recentClaims?: unknown[];
            totalFiltered?: number;
          };
          if (!isMounted) return;
          const raw = Array.isArray(data.recentClaims) ? data.recentClaims : [];
          setClaims(
            raw.map((r) => normalizeSinistro(r as Record<string, unknown>)),
          );
          setTotalFiltered(data.totalFiltered ?? 0);
          return;
        }

        params.set("tipo", tipo);
        params.set("page", String(page));
        params.set("limit", String(pageSize));
        if (normalizedSearch) {
          params.set("search", normalizedSearch);
        }

        const res = await apiFetch(`/api/sinistros?${params.toString()}`);
        if (!res.ok) throw new Error(`sinistros fetch failed: ${res.status}`);
        const data = (await res.json()) as {
          sinistros?: unknown[];
          totalFiltered?: number;
        };
        if (!isMounted) return;
        const raw = Array.isArray(data.sinistros) ? data.sinistros : [];
        setClaims(
          raw.map((r) => normalizeSinistro(r as Record<string, unknown>)),
        );
        setTotalFiltered(data.totalFiltered ?? 0);
      } catch (err) {
        console.error(`[useSinistrosTable:${tipo}]`, err);
        if (isMounted) {
          setClaims([]);
          setTotalFiltered(0);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      isMounted = false;
    };
  }, [tipo, page, search, activeFilter, pageSize]);

  const handleSearchChange = useCallback((q: string) => {
    setPage(1);
    setSearch(q);
  }, []);

  return {
    claims,
    totalFiltered,
    page,
    setPage,
    search,
    handleSearchChange,
    isLoading,
  };
}

// ─── Página Principal do Dashboard ──────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  // KPI cards — consumem /api/dashboard para contadores
  const [kpis, setKpis] = useState<DashboardKpis>({
    aguardandoVinculo: 0,
    aguardandoCheckin: 0,
    checkinRealizado: 0,
    emVistoria: 0,
    aguardandoAceite: 0,
  });
  const [isKpiLoading, setIsKpiLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DashboardFilter | null>(
    null,
  );
  const [auditModal, setAuditModal] = useState<
    "rejeitadas" | "alertasIA" | null
  >(null);
  const [auditShowAll, setAuditShowAll] = useState(false);
  const [navigatingAuditClaimId, setNavigatingAuditClaimId] = useState<
    string | null
  >(null);
  const [chartData, setChartData] = useState<
    Array<{ name: string; Leve: number; Media: number; GrandeMonta: number }>
  >([]);

  useEffect(() => {
    router.prefetch("/orquestracao");

    void apiFetch("/api/sinistros?tipo=kanban").catch(() => null);
  }, [router]);

  useEffect(() => {
    let isMounted = true;
    const fetchKpis = async () => {
      try {
        const res = await apiFetch("/api/dashboard?page=1&limit=1");
        if (!res.ok) return;
        const data = (await res.json()) as {
          kpis?: Partial<
            DashboardKpis & { total?: number; totalInconformidades?: number }
          >;
          chartData?: unknown[];
        };
        if (!isMounted) return;
        const k = data.kpis ?? {};
        setKpis({
          aguardandoVinculo: Number(k.aguardandoVinculo ?? 0),
          aguardandoCheckin: Number(k.aguardandoCheckin ?? 0),
          checkinRealizado: Number(k.checkinRealizado ?? 0),
          emVistoria: Number(k.emVistoria ?? 0),
          aguardandoAceite: Number(k.aguardandoAceite ?? 0),
        });
        if (Array.isArray(data.chartData)) {
          setChartData(
            data.chartData as Array<{
              name: string;
              Leve: number;
              Media: number;
              GrandeMonta: number;
            }>,
          );
        }
      } catch (err) {
        console.error("[DashboardPage] kpi fetch error", err);
      } finally {
        if (isMounted) setIsKpiLoading(false);
      }
    };
    void fetchKpis();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFilterChange = useCallback((filter: DashboardFilter) => {
    setActiveFilter((current) => (current === filter ? null : filter));
  }, []);

  // Tabelas independentes — cada uma gerencia seu próprio estado
  const geral = useSinistrosTable("geral", activeFilter);
  const rejeitadas = useSinistrosTable(
    "rejeitadas",
    undefined,
    AUDIT_PAGE_SIZE,
  );
  const alertasIA = useSinistrosTable("alertasIA", undefined, AUDIT_PAGE_SIZE);

  const auditClaims =
    auditModal === "rejeitadas" ? rejeitadas.claims : alertasIA.claims;
  const auditLoading =
    auditModal === "rejeitadas" ? rejeitadas.isLoading : alertasIA.isLoading;
  const auditTotalFiltered =
    auditModal === "rejeitadas"
      ? rejeitadas.totalFiltered
      : alertasIA.totalFiltered;
  const auditPage =
    auditModal === "rejeitadas" ? rejeitadas.page : alertasIA.page;
  const auditTitle =
    auditModal === "rejeitadas"
      ? "Vistorias Rejeitadas"
      : "Vistorias com Inconformidade";
  const auditDescription =
    auditModal === "rejeitadas"
      ? "Auditoria rápida de casos reprovados que exigem nova análise"
      : "Auditoria rápida de casos sinalizados pelo motor de IA";

  const hasRejeitadas = rejeitadas.totalFiltered > 0;
  const hasInconformidades = alertasIA.totalFiltered > 0;
  const auditTotalPages = Math.max(
    1,
    Math.ceil(auditTotalFiltered / AUDIT_PAGE_SIZE),
  );

  const openAuditModal = useCallback(
    (type: "rejeitadas" | "alertasIA") => {
      setNavigatingAuditClaimId(null);
      setAuditShowAll(false);
      setAuditModal(type);
      if (type === "rejeitadas") {
        rejeitadas.setPage(1);
      } else {
        alertasIA.setPage(1);
      }
    },
    [alertasIA, rejeitadas],
  );

  const closeAuditModal = useCallback(() => {
    setAuditModal(null);
    setAuditShowAll(false);
    setNavigatingAuditClaimId(null);
  }, []);

  const handleAuditPageChange = useCallback(
    (nextPage: number) => {
      if (auditModal === "rejeitadas") {
        rejeitadas.setPage(nextPage);
        return;
      }
      if (auditModal === "alertasIA") {
        alertasIA.setPage(nextPage);
      }
    },
    [alertasIA, auditModal, rejeitadas],
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Painel de controle e monitoramento de sinistros"
        />

        {/* KPI Cards — 5 colunas, card de aceite com destaque laranja */}
        <KpiCards
          kpis={kpis}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          isLoading={isKpiLoading}
        />

        {/* Tabela Principal */}
        <div className="space-y-6">
          <RecentClaimsTable
            title="Visão Geral de Sinistros"
            description="Todos os sinistros registrados no sistema"
            claims={geral.claims}
            searchQuery={geral.search}
            onSearchChange={geral.handleSearchChange}
            currentPage={geral.page}
            onPageChange={geral.setPage}
            totalFiltered={geral.totalFiltered}
            pageSize={PAGE_SIZE}
            isTableLoading={geral.isLoading}
          />

          {/* Gráfico de Severidade */}
          <div className="w-full">
            <SeverityChart chartData={chartData} />
          </div>

          {(hasRejeitadas || hasInconformidades) && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-bold text-foreground">
                Ações Requeridas
              </h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {hasRejeitadas && (
                  <button
                    type="button"
                    onClick={() => openAuditModal("rejeitadas")}
                    className="cursor-pointer rounded-xl border border-red-200/60 bg-red-50/35 p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300/70 hover:shadow-md dark:border-red-900/40 dark:bg-red-950/20 dark:hover:border-red-800/60 dark:hover:bg-red-950/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Vistorias rejeitadas
                          </p>
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/35 dark:text-red-300">
                            Regulação
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-foreground">
                            {rejeitadas.totalFiltered}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            casos
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Sinistros que retornaram para a oficina para
                          retificação.
                        </p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/35 dark:text-red-300">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                    </div>
                  </button>
                )}

                {hasInconformidades && (
                  <button
                    type="button"
                    onClick={() => openAuditModal("alertasIA")}
                    className="cursor-pointer rounded-xl border border-amber-200/60 bg-amber-50/35 p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/70 hover:shadow-md dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:border-amber-800/60 dark:hover:bg-amber-950/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Alertas da IA
                          </p>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/35 dark:text-amber-300">
                            Revisão
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-foreground">
                            {alertasIA.totalFiltered}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            casos
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Divergências detetadas pelo motor de IA pendentes de
                          revisão.
                        </p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/35 dark:text-amber-300">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <Dialog
          open={Boolean(auditModal)}
          onOpenChange={(open) => {
            if (!open) {
              closeAuditModal();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{auditTitle}</DialogTitle>
              <DialogDescription>{auditDescription}</DialogDescription>
            </DialogHeader>

            {auditLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : auditClaims.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum registro encontrado.
              </p>
            ) : (
              <>
                <div className="max-h-[55vh] space-y-1.5 overflow-y-auto pr-1">
                  {auditClaims.map((claim) => (
                    <Link
                      key={`${auditModal}-${claim.id}`}
                      href={`/orquestracao?protocolo=${encodeURIComponent(claim.id.replace("#", ""))}`}
                      prefetch
                      className="block rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-muted/40"
                      onClick={() => setNavigatingAuditClaimId(claim.id)}
                      aria-busy={navigatingAuditClaimId === claim.id}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
                          {claim.id}
                        </span>
                        {navigatingAuditClaimId === claim.id && (
                          <Spinner className="h-3.5 w-3.5 text-primary/80" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Placa: {claim.placa}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Oficina: {claim.oficina}
                      </p>
                      {auditModal === "rejeitadas" && claim.motivoRejeicao && (
                        <p className="text-xs text-muted-foreground">
                          Motivo: {claim.motivoRejeicao}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>

                {!auditShowAll && auditTotalFiltered > AUDIT_PAGE_SIZE && (
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Mostrando top {AUDIT_PAGE_SIZE} de {auditTotalFiltered}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAuditShowAll(true);
                        handleAuditPageChange(1);
                      }}
                    >
                      Ver todos
                    </Button>
                  </div>
                )}

                {auditShowAll && auditTotalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Página {auditPage} de {auditTotalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={auditPage <= 1}
                        onClick={() => handleAuditPageChange(auditPage - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={auditPage >= auditTotalPages}
                        onClick={() => handleAuditPageChange(auditPage + 1)}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
