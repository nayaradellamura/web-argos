"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"

interface Alert {
  id: string
  type: "critical" | "warning" | "info"
  title: string
  description: string
  time: string
}

const alerts: Alert[] = [
  {
    id: "1",
    type: "critical",
    title: "Sinistro #1024",
    description: "Possivel fraude de dano oculto sinalizado pela IA",
    time: "2 min atras",
  },
  {
    id: "2",
    type: "critical",
    title: "Sinistro #1019",
    description: "Inconsistencia detectada entre fotos e laudo",
    time: "15 min atras",
  },
  {
    id: "3",
    type: "warning",
    title: "Sinistro #1022",
    description: "SLA de regulacao proximo do limite",
    time: "32 min atras",
  },
  {
    id: "4",
    type: "warning",
    title: "Oficina Central SP",
    description: "Taxa de retrabalho acima da media (12%)",
    time: "1h atras",
  },
  {
    id: "5",
    type: "info",
    title: "Modelo IA v3.2.2",
    description: "Nova versao disponivel para atualizacao",
    time: "2h atras",
  },
]

function AlertIcon({ type }: { type: Alert["type"] }) {
  switch (type) {
    case "critical":
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case "warning":
      return <AlertCircle className="h-4 w-4 text-amber-500" />
    case "info":
      return <Info className="h-4 w-4 text-primary" />
  }
}

function AlertBadge({ type }: { type: Alert["type"] }) {
  switch (type) {
    case "critical":
      return (
        <Badge variant="destructive" className="text-[10px]">
          Critico
        </Badge>
      )
    case "warning":
      return (
        <Badge
          variant="secondary"
          className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        >
          Alerta
        </Badge>
      )
    case "info":
      return (
        <Badge variant="secondary" className="text-[10px]">
          Info
        </Badge>
      )
  }
}

export function AlertsFeed() {
  return (
    <Card className="w-full lg:w-[380px]">
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
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {alert.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
