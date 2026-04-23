"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  Server,
  CheckCircle,
  ExternalLink,
  Check,
  ChevronRight,
  ShieldAlert,
  Timer,
  Zap,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Alerta {
  id: string;
  tipo: "critico" | "sla" | "sistema" | "lido";
  titulo: string;
  descricao: string;
  sinistroId?: string;
  dataHora: string;
  categoria: string;
  lido: boolean;
}

interface AlertasFeedProps {
  alertas: Alerta[];
  onMarcarLido: (id: string) => void;
  onIrParaAnalise: (sinistroId: string) => void;
}

const tipoConfig = {
  critico: {
    icon: AlertTriangle,
    bgColor: "bg-destructive/10",
    iconColor: "text-destructive",
    borderColor: "border-l-destructive",
  },
  sla: {
    icon: Clock,
    bgColor: "bg-amber-500/10",
    iconColor: "text-amber-600",
    borderColor: "border-l-amber-500",
  },
  sistema: {
    icon: Server,
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-600",
    borderColor: "border-l-blue-500",
  },
  lido: {
    icon: CheckCircle,
    bgColor: "bg-muted",
    iconColor: "text-muted-foreground",
    borderColor: "border-l-muted-foreground",
  },
};

const categoriaConfig: Record<
  string,
  { icon: typeof ShieldAlert; color: string }
> = {
  "Possível Fraude": {
    icon: ShieldAlert,
    color: "bg-destructive/10 text-destructive",
  },
  "Inconsistência Documental": {
    icon: AlertCircle,
    color: "bg-destructive/10 text-destructive",
  },
  "Dano Oculto Detectado": {
    icon: Zap,
    color: "bg-orange-500/10 text-orange-600",
  },
  "SLA Violado": { icon: Timer, color: "bg-amber-500/10 text-amber-600" },
  "SLA Crítico": { icon: Clock, color: "bg-amber-500/10 text-amber-600" },
  "Atraso Regulação": { icon: Clock, color: "bg-amber-500/10 text-amber-600" },
  "Falha API": { icon: Server, color: "bg-blue-500/10 text-blue-600" },
  "Erro Integração": { icon: Server, color: "bg-blue-500/10 text-blue-600" },
  "Timeout Sistema": { icon: Server, color: "bg-blue-500/10 text-blue-600" },
};

export function AlertasFeed({
  alertas,
  onMarcarLido,
  onIrParaAnalise,
}: AlertasFeedProps) {
  if (alertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">
          Nenhum alerta encontrado
        </h3>
        <p className="text-sm text-muted-foreground">
          Não há alertas nesta categoria no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alertas.map((alerta) => {
        const config = tipoConfig[alerta.tipo];
        const Icon = config.icon;
        const catConfig = categoriaConfig[alerta.categoria] || {
          icon: AlertCircle,
          color: "bg-muted text-muted-foreground",
        };
        const CatIcon = catConfig.icon;

        return (
          <Card
            key={alerta.id}
            className={cn(
              "border-l-4 transition-all hover:shadow-md",
              config.borderColor,
              alerta.lido && "opacity-60",
            )}
          >
            <div className="flex items-start gap-4 p-4">
              {/* Icon */}
              <div
                className={cn(
                  "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                  config.bgColor,
                )}
              >
                <Icon className={cn("h-5 w-5", config.iconColor)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        "font-medium text-foreground leading-tight",
                        alerta.lido && "text-muted-foreground",
                      )}
                    >
                      {alerta.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {alerta.descricao}
                      {alerta.sinistroId && (
                        <button
                          onClick={() => onIrParaAnalise(alerta.sinistroId!)}
                          className="inline-flex items-center gap-1 ml-1 text-primary hover:underline"
                        >
                          #{alerta.sinistroId}
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                    {alerta.dataHora}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3">
                  <Badge
                    variant="secondary"
                    className={cn("gap-1.5 font-normal", catConfig.color)}
                  >
                    <CatIcon className="h-3 w-3" />
                    {alerta.categoria}
                  </Badge>

                  <div className="flex items-center gap-2">
                    {!alerta.lido && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onMarcarLido(alerta.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Marcar como Lido
                      </Button>
                    )}
                    {alerta.sinistroId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => onIrParaAnalise(alerta.sinistroId!)}
                      >
                        Ir para Análise
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
