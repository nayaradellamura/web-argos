"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { SeverityChart } from "@/components/dashboard/severity-chart";
import { RecentClaimsTable } from "@/components/dashboard/recent-claims-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type DashboardClaim,
  type DashboardFilter,
  type DashboardKpis,
  type TipoTabela,
} from "@/components/dashboard/types";

const PAGE_SIZE = 5;

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

          const res = await fetch(`/api/dashboard?${params.toString()}`);
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
        params.set("limit", String(PAGE_SIZE));
        if (normalizedSearch) {
          params.set("search", normalizedSearch);
        }

        const res = await fetch(`/api/sinistros?${params.toString()}`);
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
  }, [tipo, page, search, activeFilter]);

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
  const [secondaryTab, setSecondaryTab] = useState<"rejeitadas" | "alertasIA">(
    "rejeitadas",
  );
  const [chartData, setChartData] = useState<
    Array<{ name: string; Leve: number; Media: number; GrandeMonta: number }>
  >([]);

  useEffect(() => {
    let isMounted = true;
    const fetchKpis = async () => {
      try {
        const res = await fetch("/api/dashboard?page=1&limit=1");
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
  const rejeitadas = useSinistrosTable("rejeitadas");
  const alertasIA = useSinistrosTable("alertasIA");

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

        {/* 3 Tabelas Independentes (separadas) */}
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

          <div className="space-y-4">
            <Tabs
              value={secondaryTab}
              onValueChange={(value) =>
                setSecondaryTab(value as "rejeitadas" | "alertasIA")
              }
              className="w-full"
            >
              <TabsList className="h-auto w-full justify-start gap-2 rounded-md bg-transparent p-0">
                <TabsTrigger
                  value="rejeitadas"
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
                >
                  <span>Vistorias Rejeitadas</span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                    {rejeitadas.totalFiltered}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="alertasIA"
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-primary/5"
                >
                  <span>Vistorias com Inconformidade</span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[11px] font-medium text-muted-foreground">
                    {alertasIA.totalFiltered}
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {secondaryTab === "rejeitadas" ? (
              <RecentClaimsTable
                title="Vistorias Rejeitadas"
                description="Sinistros em andamento com vistoria reprovada — requer nova inspeção"
                claims={rejeitadas.claims}
                searchQuery={rejeitadas.search}
                onSearchChange={rejeitadas.handleSearchChange}
                currentPage={rejeitadas.page}
                onPageChange={rejeitadas.setPage}
                totalFiltered={rejeitadas.totalFiltered}
                pageSize={PAGE_SIZE}
                isTableLoading={rejeitadas.isLoading}
                showMotivoRejeicao
                emptyStateMessage="Nenhuma vistoria no momento."
                emptyStateIcon="check"
              />
            ) : (
              <RecentClaimsTable
                title="Alertas de Inconformidade da IA"
                description="Casos em análise operacional com alertas gerados pelo motor de IA"
                claims={alertasIA.claims}
                searchQuery={alertasIA.search}
                onSearchChange={alertasIA.handleSearchChange}
                currentPage={alertasIA.page}
                onPageChange={alertasIA.setPage}
                totalFiltered={alertasIA.totalFiltered}
                pageSize={PAGE_SIZE}
                isTableLoading={alertasIA.isLoading}
                emptyStateMessage="Nenhum alerta no momento."
                emptyStateIcon="shield"
              />
            )}
          </div>
        </div>

        {/* Gráfico de Severidade */}
        <div className="w-full">
          <SeverityChart chartData={chartData} />
        </div>
      </div>
    </AppLayout>
  );
}
