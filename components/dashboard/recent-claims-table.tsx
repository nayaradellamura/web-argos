"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Claim {
  id: string
  placa: string
  oficina: string
  severidade: "Leve" | "Media" | "Grande Monta"
  status: "Processado" | "Em Analise" | "Pendente"
  dataHora: string
}

const claims: Claim[] = [
  {
    id: "#1024",
    placa: "ABC-1234",
    oficina: "Oficina Central SP",
    severidade: "Grande Monta",
    status: "Em Analise",
    dataHora: "Hoje, 14:32",
  },
  {
    id: "#1023",
    placa: "DEF-5678",
    oficina: "Auto Reparos RJ",
    severidade: "Leve",
    status: "Processado",
    dataHora: "Hoje, 14:15",
  },
  {
    id: "#1022",
    placa: "GHI-9012",
    oficina: "Mecanica Belo Horizonte",
    severidade: "Media",
    status: "Pendente",
    dataHora: "Hoje, 13:58",
  },
  {
    id: "#1021",
    placa: "JKL-3456",
    oficina: "Centro Automotivo Curitiba",
    severidade: "Leve",
    status: "Processado",
    dataHora: "Hoje, 13:42",
  },
  {
    id: "#1020",
    placa: "MNO-7890",
    oficina: "Oficina Central SP",
    severidade: "Media",
    status: "Processado",
    dataHora: "Hoje, 13:28",
  },
]

function SeveridadeBadge({ severidade }: { severidade: Claim["severidade"] }) {
  switch (severidade) {
    case "Leve":
      return (
        <Badge
          variant="secondary"
          className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        >
          Leve
        </Badge>
      )
    case "Media":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        >
          Media
        </Badge>
      )
    case "Grande Monta":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        >
          Grande Monta
        </Badge>
      )
  }
}

function StatusBadge({ status }: { status: Claim["status"] }) {
  switch (status) {
    case "Processado":
      return (
        <Badge variant="outline" className="text-emerald-600 border-emerald-300">
          Processado
        </Badge>
      )
    case "Em Analise":
      return (
        <Badge variant="outline" className="text-primary border-primary/30">
          Em Analise
        </Badge>
      )
    case "Pendente":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Pendente
        </Badge>
      )
  }
}

export function RecentClaimsTable() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Ultimos 5 Sinistros Processados
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Acompanhamento em tempo real
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Oficina</TableHead>
              <TableHead>Severidade IA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell className="font-medium text-primary">
                  {claim.id}
                </TableCell>
                <TableCell className="font-mono text-sm">{claim.placa}</TableCell>
                <TableCell>{claim.oficina}</TableCell>
                <TableCell>
                  <SeveridadeBadge severidade={claim.severidade} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={claim.status} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {claim.dataHora}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
