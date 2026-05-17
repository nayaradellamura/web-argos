"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { SeverityChart } from "@/components/dashboard/severity-chart";
import { RecentClaimsTable } from "@/components/dashboard/recent-claims-table";
import {
  type DashboardClaim,
  type DashboardFilter,
  type DashboardKpis,
} from "@/components/dashboard/types";

const PAGE_SIZE = 5;

export default function DashboardPage() {
  // Estados de Controle
  const [activeFilter, setActiveFilter] = useState<DashboardFilter | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [kpis, setKpis] = useState<DashboardKpis>({
    total: 0,
    semVinculo: 0,
    aguardandoCheckin: 0,
    andamento: 0,
    inconformidades: 0,
  });
  const [recentClaims, setRecentClaims] = useState<DashboardClaim[]>([]);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [chartData, setChartData] = useState<
    Array<{
      name: string;
      Leve: number;
      Media: number;
      GrandeMonta: number;
    }>
  >([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);

  // Função para normalizar sinistro
  const normalizeClaim = (
    rawClaim: Record<string, unknown>,
  ): DashboardClaim => {
    const status = String(
      rawClaim.status ?? "Pendente",
    ) as DashboardClaim["status"];
    const statusNormalized = status.toLowerCase();

    const derivedHealth: DashboardClaim["slaHealth"] =
      statusNormalized === "concluído" || statusNormalized === "liquidado"
        ? "healthy"
        : statusNormalized === "em andamento"
          ? "warning"
          : statusNormalized === "pendente"
            ? "warning"
            : "critical";

    const normalizedSeverity = String(rawClaim.severidade ?? "Media");
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

    const severityKey = normalizedSeverity.toLowerCase();

    return {
      id: String(rawClaim.id ?? "-"),
      placa: String(rawClaim.placa ?? "-"),
      oficina: String(rawClaim.oficina ?? "-"),
      credenciadoId:
        rawClaim.credenciadoId === undefined
          ? undefined
          : rawClaim.credenciadoId === null
            ? null
            : String(rawClaim.credenciadoId),
      severidade: severityMap[severityKey] ?? "Media",
      status,
      dataHora:
        typeof rawClaim.dataHora === "string" && rawClaim.dataHora.trim()
          ? rawClaim.dataHora
          : "-",
      vistoriaStatus:
        typeof rawClaim.vistoriaStatus === "string"
          ? (rawClaim.vistoriaStatus as DashboardClaim["vistoriaStatus"])
          : undefined,
      transcriptionStatus:
        rawClaim.transcriptionStatus === "done" ? "done" : "pending",
      hasCriticalIaAlert: Boolean(rawClaim.hasCriticalIaAlert),
      daysInStage:
        typeof rawClaim.daysInStage === "number" ? rawClaim.daysInStage : 0,
      slaLimitDays:
        typeof rawClaim.slaLimitDays === "number" ? rawClaim.slaLimitDays : 5,
      slaHealth:
        rawClaim.slaHealth === "healthy" ||
        rawClaim.slaHealth === "warning" ||
        rawClaim.slaHealth === "critical"
          ? rawClaim.slaHealth
          : derivedHealth,
    };
  };

  // useEffect para sincronizar com a API quando mudam página, filtro ou busca
  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const fetchDashboardData = async () => {
      const isFirstLoad = isInitialLoading;

      try {
        if (isFirstLoad) {
          setIsInitialLoading(true);
        } else {
          setIsTableLoading(true);
        }

        // Construir URL com query params
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(PAGE_SIZE));
        if (activeFilter && activeFilter !== "total") {
          params.set("filter", activeFilter);
        }
        const normalizedSearch = searchQuery.toUpperCase().trim();
        if (normalizedSearch) {
          params.set("search", normalizedSearch);
        }

        const url = `/api/dashboard?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          console.error("Falha ao carregar dados do dashboard", {
            status: response.status,
            statusText: response.statusText,
            details: errorBody,
            page: currentPage,
            filter: activeFilter,
            search: normalizedSearch,
          });

          if (!isMounted) {
            return;
          }

          setRecentClaims([]);
          setTotalFiltered(0);
          return;
        }

        const data = await response.json();
        const apiKpis = data?.kpis ?? {};
        const apiRecentClaimsRaw = data?.recentClaims;
        const apiTotalFiltered = data?.totalFiltered ?? 0;
        const apiChartDataRaw = data?.chartData;

        const normalizedClaims = Array.isArray(apiRecentClaimsRaw)
          ? apiRecentClaimsRaw.map((claim) =>
              normalizeClaim(claim as Record<string, unknown>),
            )
          : [];

        const pendingFallback = normalizedClaims.filter((claim) => {
          const statusNormalized = claim.status.toLowerCase();
          const vistoriaStatusNormalized = (
            claim.vistoriaStatus ?? ""
          ).toLowerCase();
          return (
            statusNormalized === "pendente" ||
            vistoriaStatusNormalized === "pendente" ||
            vistoriaStatusNormalized === "aguardando check-in"
          );
        }).length;

        const normalizedChartData = Array.isArray(apiChartDataRaw)
          ? (apiChartDataRaw as Array<{
              name: string;
              Leve: number;
              Media: number;
              GrandeMonta: number;
            }>)
          : [];

        if (!isMounted) {
          return;
        }

        setKpis({
          total: Number(apiKpis?.total ?? normalizedClaims.length),
          semVinculo: Number(
            apiKpis?.semVinculo ?? apiKpis?.pendentes ?? pendingFallback,
          ),
          aguardandoCheckin: Number(
            apiKpis?.aguardandoCheckin ??
              apiKpis?.pendentesCheckin ??
              pendingFallback,
          ),
          andamento: Number(
            apiKpis?.andamento ??
              normalizedClaims.filter(
                (claim) => claim.status.toLowerCase() === "em andamento",
              ).length,
          ),
          inconformidades: Number(apiKpis?.inconformidades ?? 0),
        });

        setRecentClaims(normalizedClaims);
        setTotalFiltered(apiTotalFiltered);
        setChartData(normalizedChartData);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Erro ao buscar dados do dashboard", {
          error,
          page: currentPage,
          filter: activeFilter,
          search: searchQuery.toUpperCase().trim(),
        });

        setRecentClaims([]);
        setTotalFiltered(0);
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
          setIsTableLoading(false);
        }
      }
    };

    timeoutId = setTimeout(() => {
      void fetchDashboardData();
    }, 500);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      isMounted = false;
    };
  }, [currentPage, activeFilter, searchQuery]);

  // Reset de página quando filtro ou busca mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // Handler para mudança de filtro
  const handleFilterChange = (filter: DashboardFilter) => {
    setActiveFilter((currentFilter) =>
      currentFilter === filter ? null : filter,
    );
  };

  // Handler para busca
  const handleSearchChange = (query: string) => {
    setCurrentPage(1);
    setSearchQuery(query);
  };


  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Painel de controle e monitoramento de sinistros"
        />

        <KpiCards
          kpis={kpis}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          isLoading={isInitialLoading}
        />

        <div className="w-full">
          <RecentClaimsTable
            claims={recentClaims}
            activeFilter={activeFilter}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            totalFiltered={totalFiltered}
            pageSize={PAGE_SIZE}
            isTableLoading={isInitialLoading || isTableLoading}
            onResetFilters={() => setActiveFilter(null)}
          />
        </div>

        <div className="w-full">
          <SeverityChart chartData={chartData} />
        </div>
      </div>
    </AppLayout>
  );
}
