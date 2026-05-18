"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserX,
  Clock,
  Wrench,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import {
  type DashboardFilter,
  type DashboardKpis,
} from "@/components/dashboard/types";

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
  bgClassName?: string;
  /** Indica que este card representa uma ação pendente do usuário */
  isPendingAction?: boolean;
}

const CARD_CONFIGS: CardStaticConfig[] = [
  {
    filterKey: "aguardandoVinculo",
    title: "Aguardando Vínculo",
    subtitle: "Sem credenciada vinculada",
    Icon: UserX,
  },
  {
    filterKey: "aguardandoCheckin",
    title: "Aguardando Check-in",
    subtitle: "A caminho da oficina",
    Icon: Clock,
  },
  {
    filterKey: "checkinRealizado",
    title: "Check-in Realizado",
    subtitle: "Veículo no pátio",
    Icon: CheckCircle2,
  },
  {
    filterKey: "emVistoria",
    title: "Em Vistoria",
    subtitle: "Inspeção em andamento",
    Icon: Wrench,
  },
  {
    filterKey: "aguardandoAceite",
    title: "Aguardando Seu Aceite",
    subtitle: "Ação pendente do operador",
    Icon: ClipboardCheck,
    isPendingAction: true,
    bgClassName:
      "bg-orange-50/40 border-orange-200/70 dark:bg-orange-950/20 dark:border-orange-900/40",
    badge: {
      text: "Ação",
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
  bgClassName,
  isPendingAction,
  value,
  active,
  onClick,
}: KpiCardProps) {
  const handleCardAction = () => onClick?.(filterKey);

  const baseClass = active
    ? "border-primary bg-primary/5 ring-1 ring-primary"
    : bgClassName
      ? bgClassName
      : "";

  const iconBgClass =
    isPendingAction && !active
      ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
      : "bg-primary/10 text-primary";

  return (
    <Card
      className={`py-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 ${baseClass}`}
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
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgClass} ${iconClassName ?? ""}`}
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

function getKpiValue(kpis: DashboardKpis, key: DashboardFilter): string {
  const map: Record<DashboardFilter, number> = {
    aguardandoVinculo: kpis.aguardandoVinculo,
    aguardandoCheckin: kpis.aguardandoCheckin,
    checkinRealizado: kpis.checkinRealizado,
    emVistoria: kpis.emVistoria,
    aguardandoAceite: kpis.aguardandoAceite,
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5" />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
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
