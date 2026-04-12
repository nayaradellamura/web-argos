"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { CredenciadosHeader } from "@/components/credenciados/credenciados-header";
import { QualityScoreChart } from "@/components/credenciados/quality-score-chart";
import { OficinasList } from "@/components/credenciados/oficinas-list";

export default function CredenciadosPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("Todas");
  const [specialtyFilter, setSpecialtyFilter] = useState("Todas");

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
        />

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
              <div className="mt-1 text-xs text-emerald-600">+3 este mes</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2 text-sm font-medium text-muted-foreground">
                Score Medio Rede
              </div>
              <div className="text-3xl font-bold">4.4</div>
              <div className="mt-1 text-xs text-muted-foreground">de 5.0</div>
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
      </div>
    </AppLayout>
  );
}
