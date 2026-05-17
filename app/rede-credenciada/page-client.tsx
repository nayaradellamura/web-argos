"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { CredenciadosHeader } from "@/components/credenciados/credenciados-header";
import { QualityScoreChart } from "@/components/credenciados/quality-score-chart";
import { OficinasList } from "@/components/credenciados/oficinas-list";

interface ApiOficina {
  id?: string;
  name?: string;
  nome?: string;
  city?: string;
  cidade?: string;
  specialty?: string;
  especialidade?: string;
  phone?: string;
  telefone?: string;
  email?: string;
  status?: string;
  score?: number | string;
  slaAvg?: number | string;
  slaMedia?: number | string;
  uf?: string;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeOficina(oficina: ApiOficina) {
  const city = text(oficina.city) || text(oficina.cidade);
  const uf = text(oficina.uf);
  const cityWithUf = city && uf && !city.includes("-") ? `${city}-${uf}` : city;

  return {
    id: text(oficina.id) || "-",
    name: text(oficina.name) || text(oficina.nome) || "Oficina sem nome",
    city: cityWithUf || "Não informado",
    specialty:
      text(oficina.specialty) || text(oficina.especialidade) || "Não informado",
    phone: text(oficina.phone) || text(oficina.telefone) || "-",
    email: text(oficina.email) || "-",
    status: text(oficina.status) || "Ativo",
    score: numberValue(oficina.score, 0),
    slaAvg: numberValue(oficina.slaAvg ?? oficina.slaMedia, 0),
  };
}

export default function CredenciadosPageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("Todas");
  const [specialtyFilter, setSpecialtyFilter] = useState("Todas");
  const [oficinas, setOficinas] = useState<
    ReturnType<typeof normalizeOficina>[]
  >([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [refreshSeed, setRefreshSeed] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoadingSummary(true);
      try {
        const apiLimit = 50;
        const params = new URLSearchParams({
          page: "1",
          limit: String(apiLimit),
          search: searchQuery,
        });

        const firstResponse = await fetch(
          `/api/oficinas?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!firstResponse.ok) {
          throw new Error("Falha ao buscar oficinas");
        }

        const firstPageRes = await firstResponse.json();
        const totalCount =
          typeof firstPageRes.totalCount === "number"
            ? firstPageRes.totalCount
            : Array.isArray(firstPageRes.oficinas)
              ? firstPageRes.oficinas.length
              : 0;

        const totalApiPages = Math.max(1, Math.ceil(totalCount / apiLimit));
        const additionalPages =
          totalApiPages > 1
            ? await Promise.all(
                Array.from({ length: totalApiPages - 1 }, (_, index) => {
                  const page = index + 2;
                  const extraParams = new URLSearchParams({
                    page: String(page),
                    limit: String(apiLimit),
                    search: searchQuery,
                  });

                  return fetch(`/api/oficinas?${extraParams.toString()}`, {
                    signal: controller.signal,
                  }).then((response) => {
                    if (!response.ok) {
                      throw new Error("Falha ao buscar oficinas");
                    }
                    return response.json();
                  });
                }),
              )
            : [];

        const allRawOficinas = [
          ...(Array.isArray(firstPageRes.oficinas)
            ? (firstPageRes.oficinas as ApiOficina[])
            : []),
          ...additionalPages.flatMap((pageRes) =>
            Array.isArray(pageRes.oficinas)
              ? (pageRes.oficinas as ApiOficina[])
              : [],
          ),
        ];

        const normalized = allRawOficinas.map(normalizeOficina);
        setOficinas(normalized);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Erro ao carregar resumo de credenciados:", error);
          setOficinas([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSummary(false);
        }
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, refreshSeed]);

  const cityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          oficinas
            .map((oficina) => oficina.city)
            .filter((value) => value && value !== "Não informado"),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [oficinas],
  );

  const specialtyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          oficinas
            .map((oficina) => oficina.specialty)
            .filter((value) => value && value !== "Não informado"),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [oficinas],
  );

  const filteredForKpi = useMemo(() => {
    return oficinas.filter((oficina) => {
      const cityMatch = cityFilter === "Todas" || oficina.city === cityFilter;
      const specialtyMatch =
        specialtyFilter === "Todas" || oficina.specialty === specialtyFilter;
      return cityMatch && specialtyMatch;
    });
  }, [oficinas, cityFilter, specialtyFilter]);

  const avgScore = useMemo(() => {
    if (filteredForKpi.length === 0) return 0;
    const total = filteredForKpi.reduce(
      (sum, oficina) => sum + oficina.score,
      0,
    );
    return total / filteredForKpi.length;
  }, [filteredForKpi]);

  const avgSla = useMemo(() => {
    if (filteredForKpi.length === 0) return 0;
    const total = filteredForKpi.reduce(
      (sum, oficina) => sum + oficina.slaAvg,
      0,
    );
    return total / filteredForKpi.length;
  }, [filteredForKpi]);

  const chartData = useMemo(
    () =>
      [...filteredForKpi]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((oficina) => ({ name: oficina.name, score: oficina.score })),
    [filteredForKpi],
  );

  const totalCredenciadosFiltrados = filteredForKpi.length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gerenciamento de Parceiros Credenciados"
          description="Gerencie oficinas, fornecedores e parceiros da rede credenciada"
        />

        <CredenciadosHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          cityFilter={cityFilter}
          onCityFilterChange={setCityFilter}
          specialtyFilter={specialtyFilter}
          onSpecialtyFilterChange={setSpecialtyFilter}
          cityOptions={cityOptions}
          specialtyOptions={specialtyOptions}
          onCreated={() => setRefreshSeed((value) => value + 1)}
        />

        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          <div className="lg:col-span-2 lg:h-111">
            <QualityScoreChart
              data={chartData}
              className="h-full"
              chartClassName="h-[21.5rem] w-full"
            />
          </div>
          <div className="flex flex-col gap-4 lg:h-111">
            <div className="flex-1 rounded-lg border bg-card p-4">
              <div className="mb-2 text-sm font-medium text-muted-foreground">
                Total Credenciados
              </div>
              <div className="text-3xl font-bold">
                {totalCredenciadosFiltrados}
              </div>
              <div
                suppressHydrationWarning
                className="mt-1 text-xs text-muted-foreground"
              >
                Total de oficinas no filtro atual
              </div>
            </div>
            <div className="flex-1 rounded-lg border bg-card p-4">
              <div className="mb-2 text-sm font-medium text-muted-foreground">
                Score Médio Rede
              </div>
              <div className="text-3xl font-bold">{avgScore.toFixed(1)}</div>
              <div className="mt-1 text-xs text-muted-foreground">de 5.0</div>
            </div>
            <div className="flex-1 rounded-lg border bg-card p-4">
              <div className="mb-2 text-sm font-medium text-muted-foreground">
                SLA Médio
              </div>
              <div className="text-3xl font-bold">{avgSla.toFixed(1)}</div>
              <div className="mt-1 text-xs text-muted-foreground">dias</div>
            </div>
          </div>
        </div>

        {isLoadingSummary ? null : (
          <OficinasList
            searchQuery={searchQuery}
            cityFilter={cityFilter}
            specialtyFilter={specialtyFilter}
          />
        )}
      </div>
    </AppLayout>
  );
}
