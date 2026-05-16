"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { type DashboardAlert } from "@/components/dashboard/types";

function timeAgo(isoDate?: string, fallback?: string): string {
  if (!isoDate) return fallback ?? "";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  if (isNaN(diffMs) || diffMs < 0) return fallback ?? "";
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} minuto${diffMin > 1 ? "s" : ""}`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} hora${diffH > 1 ? "s" : ""}`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD} dia${diffD > 1 ? "s" : ""}`;
}

interface AlertsFeedProps {
  alerts: DashboardAlert[];
}

function AlertIcon({ type }: { type: DashboardAlert["type"] }) {
  switch (type) {
    case "critical":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "warning":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case "info":
      return <Info className="h-4 w-4 text-primary" />;
  }
}

function AlertBadge({ type }: { type: DashboardAlert["type"] }) {
  switch (type) {
    case "critical":
      return (
        <Badge variant="destructive" className="text-[10px]">
          Critico
        </Badge>
      );
    case "warning":
      return (
        <Badge
          variant="secondary"
          className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        >
          Alerta
        </Badge>
      );
    case "info":
      return (
        <Badge variant="secondary" className="text-[10px]">
          Info
        </Badge>
      );
  }
}

export function AlertsFeed({ alerts }: AlertsFeedProps) {
  return (
    <Card className="w-full lg:w-95">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Alertas Criticos da IA
          </CardTitle>
          <Badge variant="outline" className="text-[10px]">
            {alerts.filter((a) => a.type === "critical").length} criticos
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Ultimas notificacoes do sistema
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="mt-0.5">
                <AlertIcon type={alert.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {alert.title}
                  </span>
                  <AlertBadge type={alert.type} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {alert.description}
                </p>
                <span className="text-[10px] text-muted-foreground mt-1 block mb-2">
                  {timeAgo(alert.createdAt, alert.time)}
                </span>
                {alert.sinistroId && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                  >
                    <Link href={`/orquestracao/${alert.sinistroId}`}>
                      Revisar Agora
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
