"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  type DashboardClaim,
  type DashboardFilter,
} from "@/components/dashboard/types";

interface RecentClaimsTableProps {
  claims: DashboardClaim[];
  activeFilter: DashboardFilter | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalFiltered: number;
  pageSize: number;
  isTableLoading?: boolean;
  onResetFilters?: () => void;
}

function SeveridadeBadge({
  severidade,
}: {
  severidade: DashboardClaim["severidade"];
}) {
  switch (severidade) {
    case "Baixa":
    case "Leve":
      return (
        <Badge
          variant="secondary"
          className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        >
          Leve
        </Badge>
      );
    case "Média":
    case "Media":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        >
          Media
        </Badge>
      );
    case "Alta":
    case "Crítica":
    case "Grande Monta":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        >
          Grande Monta
        </Badge>
      );
  }
}

function SlaSemaphore({ health }: { health?: DashboardClaim["slaHealth"] }) {
  const className =
    (health ?? "warning") === "healthy"
      ? "bg-emerald-500"
      : (health ?? "warning") === "warning"
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <span className={`inline-flex h-2.5 w-2.5 rounded-full ${className}`} />
  );
}

function StatusBadge({ status }: { status: DashboardClaim["status"] }) {
  switch (status) {
    case "Em andamento":
      return (
        <Badge variant="outline" className="text-primary border-primary/30">
          Em andamento
        </Badge>
      );
    case "Aberto":
      return (
        <Badge variant="outline" className="text-primary border-primary/30">
          Aberto
        </Badge>
      );
    case "Em Analise":
      return (
        <Badge variant="outline" className="text-primary border-primary/30">
          Em Analise
        </Badge>
      );
    case "Pendente":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Pendente
        </Badge>
      );
    case "Concluído":
      return (
        <Badge
          variant="outline"
          className="text-emerald-600 border-emerald-300"
        >
          Concluído
        </Badge>
      );
    case "Liquidado":
      return (
        <Badge
          variant="outline"
          className="text-emerald-700 border-emerald-400"
        >
          Liquidado
        </Badge>
      );
  }
}

export function RecentClaimsTable({
  claims,
  searchQuery,
  onSearchChange,
  currentPage,
  onPageChange,
  totalFiltered,
  pageSize,
  isTableLoading = false,
  onResetFilters,
}: RecentClaimsTableProps) {
  // Calcular informações de paginação
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const startItem = totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalFiltered);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Sinistros</CardTitle>
        <p className="text-xs text-muted-foreground">
          Acompanhamento em tempo real
        </p>
        <div className="pt-2">
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Busca rápida por ID ou Placa..."
            className="h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {isTableLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Spinner className="size-5" />
              <span className="text-xs">Carregando...</span>
            </div>
          </div>
        ) : (
          <>
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Oficina Credenciada</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium text-primary">
                      <Link
                        href={`/orquestracao?sinistro=${claim.id.replace("#", "")}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {claim.id}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {claim.placa}
                    </TableCell>
                    <TableCell>{claim.oficina}</TableCell>
                    <TableCell>
                      <SeveridadeBadge severidade={claim.severidade} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <SlaSemaphore health={claim.slaHealth} />
                        <StatusBadge status={claim.status} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalFiltered === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum sinistro encontrado para os filtros atuais.
              </p>
            )}

            {totalFiltered > 0 && (
              <div className="mt-4 flex flex-col gap-3 border-t pt-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Mostrando {startItem} a {endItem} de {totalFiltered} registros
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="rounded-md border px-3 py-1 text-foreground">
                    Página {currentPage} de {totalPages}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      onPageChange(Math.min(totalPages, currentPage + 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
