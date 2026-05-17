"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const data = [
  { name: "Elite Motors", score: 4.9 },
  { name: "AutoPrime", score: 4.7 },
  { name: "CarTech", score: 4.5 },
  { name: "MasterFix", score: 4.3 },
  { name: "ProRepair", score: 4.1 },
];

const chartConfig = {
  score: {
    label: "Score",
    color: "var(--chart-1)",
  },
};

const barPalette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function QualityScoreChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Score de Qualidade Medio
        </CardTitle>
        <CardDescription>Top 5 oficinas com melhor avaliacao</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-55 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                type="number"
                domain={[0, 5]}
                tickCount={6}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                width={90}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={barPalette[index % barPalette.length]}
                  />
                ))}
                <LabelList
                  dataKey="score"
                  position="right"
                  fill="var(--foreground)"
                  fontSize={12}
                  fontWeight={600}
                  formatter={(value: number) => value.toFixed(1)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
