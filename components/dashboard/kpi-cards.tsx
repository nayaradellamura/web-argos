"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Files, UserX, Clock, Wrench, ShieldAlert } from "lucide-react";
import {
  type DashboardFilter,
  type DashboardKpis,
} from "@/components/dashboard/types";

// ---------------------------------------------------------------------------
// Configuração ESTÁTICA de cada card — fora do componente para não ser
// recriada a cada render e evitar divergência SSR vs. CSR (hydration error).
// ---------------------------------------------------------------------------
interface CardStaticConfig {
  filterKey: DashboardFilter;
  title: string;
  subtitle: string;
  Icon: React.ElementType;
  iconClassName?: string;
  badge?: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  };
}

const CARD_CONFIGS: CardStaticConfig[] = [
  {
    filterKey: "total",
    title: "Total de Sinistros",
    subtitle: "Volume geral",
    Icon: Files,
  },
  {
    filterKey: "semVinculo",
    title: "Aguardando Vínculo",
    subtitle: "Sem oficina credenciada vinculada",
    Icon: UserX,
  },
  {
    filterKey: "aguardandoCheckin",
    title: "Aguardando Check-in",
    subtitle: "Agendados ou a caminho da oficina",
    Icon: Clock,
  },
  {
    filterKey: "andamento",
    title: "Em Andamento",
    subtitle: "Veículo no pátio / Em análise",
    Icon: Wrench,
  },
  {
    filterKey: "inconformidades",
    title: "Inconformidades",
    subtitle: "Com alertas da IA",
    Icon: ShieldAlert,
    iconClassName: "text-orange-600",
    badge: {
      text: "Crítico",
      variant: "secondary",
      className:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    },
  },
];

interface KpiCardProps extends CardStaticConfig {
  value: string;
  active: boolean;
  onClick: (filterKey: DashboardFilter) => void;
}

function KpiCard({
  filterKey,
  title,
  subtitle,
  Icon,
  iconClassName,
  badge,
  value,
  active,
  onClick,
}: KpiCardProps) {
  const handleCardAction = () => onClick?.(filterKey);

  return (
    <Card
      className={`py-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 ${
        active ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardAction}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCardAction();
          }
        }}
        className="outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-md"
      >
        <CardContent className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {value}
              </span>
              {badge && (
                <Badge
                  variant={badge.variant}
                  className={`text-[10px] ${badge.className ?? ""}`}
                >
                  {badge.text}
                </Badge>
              )}
            </div>
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ${iconClassName ?? ""}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

interface KpiCardsProps {
  kpis: DashboardKpis;
  activeFilter: DashboardFilter | null;
  onFilterChange: (filter: DashboardFilter) => void;
  isLoading?: boolean;
}

// Resolve o valor numérico do KPI pela chave, sem criar objetos intermediários.
function getKpiValue(kpis: DashboardKpis, key: DashboardFilter): string {
  const map: Record<DashboardFilter, number> = {
    total: kpis.total,
    semVinculo: kpis.semVinculo,
    aguardandoCheckin: kpis.aguardandoCheckin,
    andamento: kpis.andamento,
    inconformidades: kpis.inconformidades,
  };
  return String(map[key] ?? 0);
}

export function KpiCards({
  kpis,
  activeFilter,
  onFilterChange,
  isLoading,
}: KpiCardsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" />
    );
  }

  if (isLoading) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="py-4">
          <CardContent className="flex items-start justify-between gap-3">
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-3 w-36" />
            </div>

            <Skeleton className="h-10 w-10 rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {CARD_CONFIGS.map((config) => (
        <KpiCard
          key={config.filterKey}
          {...config}
          value={getKpiValue(kpis, config.filterKey)}
          active={activeFilter === config.filterKey}
          onClick={onFilterChange}
        />
      ))}
    </div>
  );
}
