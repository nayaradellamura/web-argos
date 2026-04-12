"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

const chartData = [
  { dia: "01", leve: 45, media: 28, grandeMonta: 12 },
  { dia: "05", leve: 52, media: 35, grandeMonta: 8 },
  { dia: "10", leve: 38, media: 42, grandeMonta: 15 },
  { dia: "15", leve: 61, media: 31, grandeMonta: 10 },
  { dia: "20", leve: 55, media: 38, grandeMonta: 18 },
  { dia: "25", leve: 48, media: 45, grandeMonta: 14 },
  { dia: "30", leve: 58, media: 40, grandeMonta: 11 },
]

const chartConfig = {
  leve: {
    label: "Leve",
    color: "oklch(0.7 0.15 145)",
  },
  media: {
    label: "Media",
    color: "oklch(0.7 0.18 85)",
  },
  grandeMonta: {
    label: "Grande Monta",
    color: "oklch(0.6 0.22 25)",
  },
} satisfies ChartConfig

export function SeverityChart() {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Tendencia de Severidade
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Distribuicao ao longo do mes atual
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="dia"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="leve"
              stroke="var(--color-leve)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="media"
              stroke="var(--color-media)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="grandeMonta"
              stroke="var(--color-grandeMonta)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
