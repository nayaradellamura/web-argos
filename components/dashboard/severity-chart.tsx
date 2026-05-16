"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

interface SeverityChartPoint {
  name: string;
  Leve: number;
  Media: number;
  GrandeMonta: number;
}

const chartConfig = {
  Leve: {
    label: "Leve",
    color: "oklch(0.7 0.15 145)",
  },
  Media: {
    label: "Media",
    color: "oklch(0.7 0.18 85)",
  },
  GrandeMonta: {
    label: "Grande Monta",
    color: "oklch(0.6 0.22 25)",
  },
} satisfies ChartConfig;

interface SeverityChartProps {
  chartData: SeverityChartPoint[];
}

export function SeverityChart({ chartData }: SeverityChartProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Tendencia de Severidade
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Dias no eixo horizontal e quantidade de sinistros no eixo vertical.
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              label={{ value: "Dias", position: "insideBottom", offset: -2 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              label={{
                value: "Quantidade",
                angle: -90,
                position: "insideLeft",
                offset: 10,
              }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="Leve"
              stroke="var(--color-Leve)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="Media"
              stroke="var(--color-Media)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="GrandeMonta"
              stroke="var(--color-GrandeMonta)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
