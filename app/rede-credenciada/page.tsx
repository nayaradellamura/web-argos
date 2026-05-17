"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { CredenciadosHeader } from "@/components/credenciados/credenciados-header";
import { QualityScoreChart } from "@/components/credenciados/quality-score-chart";
import { OficinasList } from "@/components/credenciados/oficinas-list";
import { cn } from "@/lib/utils";

export default function CredenciadosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("Todas");
  const [specialtyFilter, setSpecialtyFilter] = useState("Todas");
  const [isContentLoading, setIsContentLoading] = useState(true);

  useEffect(() => {
    setIsContentLoading(true);

    const timeout = window.setTimeout(() => {
      setIsContentLoading(false);
    }, 420);

    return () => window.clearTimeout(timeout);
  }, [searchQuery, cityFilter, specialtyFilter]);

  return (
    <AppLayout>
      <style>{`
        @keyframes argos-skeleton-shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>

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
        />

        {isContentLoading ? (
          <CredenciadosContentSkeleton />
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <QualityScoreChart />
              </div>
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">
                    Total Credenciados
                  </div>
                  <div className="text-3xl font-bold">47</div>
                  <div className="mt-1 text-xs text-emerald-600">
                    +3 este mes
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">
                    Score Medio Rede
                  </div>
                  <div className="text-3xl font-bold">4.4</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    de 5.0
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-2 text-sm font-medium text-muted-foreground">
                    SLA Medio
                  </div>
                  <div className="text-3xl font-bold">3.2</div>
                  <div className="mt-1 text-xs text-muted-foreground">dias</div>
                </div>
              </div>
            </div>

            <OficinasList
              searchQuery={searchQuery}
              cityFilter={cityFilter}
              specialtyFilter={specialtyFilter}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}

function CredenciadosContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 lg:col-span-2">
          <div className="mb-6 space-y-2">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-4 w-72" />
          </div>

          <div className="flex h-72 items-end gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonBlock
                key={index}
                className="w-full rounded-t-lg"
                style={{
                  height: `${56 + ((index * 23) % 150)}px`,
                }}
              />
            ))}
          </div>

          <div className="mt-5 flex justify-center gap-4">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-4 w-20" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border bg-card p-4">
              <SkeletonBlock className="mb-3 h-4 w-36" />
              <SkeletonBlock className="h-9 w-16" />
              <SkeletonBlock className="mt-3 h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-44" />
              <SkeletonBlock className="h-4 w-72" />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <SkeletonBlock className="h-10 w-full sm:w-56" />
              <SkeletonBlock className="h-10 w-full sm:w-40" />
              <SkeletonBlock className="h-10 w-full sm:w-40" />
            </div>
          </div>
        </div>

        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-6">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="flex flex-1 gap-4">
                  <SkeletonBlock className="h-12 w-12 shrink-0 rounded-xl" />

                  <div className="w-full space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <SkeletonBlock className="h-5 w-44" />
                      <SkeletonBlock className="h-6 w-20 rounded-full" />
                    </div>

                    <SkeletonBlock className="h-4 w-64 max-w-full" />

                    <div className="grid gap-2 sm:grid-cols-2">
                      <SkeletonBlock className="h-4 w-56 max-w-full" />
                      <SkeletonBlock className="h-4 w-44 max-w-full" />
                      <SkeletonBlock className="h-4 w-52 max-w-full" />
                      <SkeletonBlock className="h-4 w-40 max-w-full" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <SkeletonBlock className="h-9 w-24 rounded-md" />
                  <SkeletonBlock className="h-9 w-9 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-200/80 dark:bg-slate-800",
        className,
      )}
      style={style}
    >
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/10"
        style={{
          animation: "argos-skeleton-shimmer 1.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}
