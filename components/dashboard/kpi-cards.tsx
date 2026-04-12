"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Brain,
  FileText,
} from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  change?: {
    value: string
    type: "positive" | "negative" | "neutral"
  }
  icon: React.ReactNode
  badge?: {
    text: string
    variant: "default" | "secondary" | "destructive" | "outline"
  }
}

function KpiCard({ title, value, subtitle, change, icon, badge }: KpiCardProps) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{value}</span>
            {badge && (
              <Badge variant={badge.variant} className="text-[10px]">
                {badge.text}
              </Badge>
            )}
          </div>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
          {change && (
            <div className="flex items-center gap-1 mt-1">
              {change.type === "positive" ? (
                <TrendingUp className="h-3 w-3 text-emerald-600" />
              ) : change.type === "negative" ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <span
                className={`text-xs font-medium ${
                  change.type === "positive"
                    ? "text-emerald-600"
                    : change.type === "negative"
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {change.value}
              </span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

export function KpiCards() {
  const kpis: KpiCardProps[] = [
    {
      title: "Volume de Aberturas (Hoje)",
      value: "147",
      icon: <FileText className="h-5 w-5" />,
      change: {
        value: "+12% vs. ontem",
        type: "positive",
      },
    },
    {
      title: "Tempo Medio de Regulacao (SLA)",
      value: "4.2h",
      subtitle: "Meta: 6h | Real: 4.2h",
      icon: <Clock className="h-5 w-5" />,
      change: {
        value: "Dentro do SLA",
        type: "positive",
      },
    },
    {
      title: "Risco de Fraude Identificado (IA)",
      value: "1.8%",
      subtitle: "dos sinistros analisados",
      icon: <AlertTriangle className="h-5 w-5" />,
      badge: {
        text: "Atencao",
        variant: "destructive",
      },
    },
    {
      title: "Acuracia Diagnostica da IA",
      value: "94.2%",
      subtitle: "Modelo v3.2.1",
      icon: <Brain className="h-5 w-5" />,
      change: {
        value: "+0.8% este mes",
        type: "positive",
      },
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <KpiCard key={index} {...kpi} />
      ))}
    </div>
  )
}
