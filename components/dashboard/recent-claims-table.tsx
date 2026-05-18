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
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import {
  type DashboardClaim,
  type DashboardFilter,
} from "@/components/dashboard/types";
import { Skeleton } from "../ui/skeleton";

interface RecentClaimsTableProps {
  claims: DashboardClaim[];
  title?: string;
  description?: string;
  activeFilter?: DashboardFilter | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalFiltered: number;
  pageSize: number;
  isTableLoading?: boolean;
  onResetFilters?: () => void;
  showMotivoRejeicao?: boolean;
  emptyStateMessage?: string;
  emptyStateIcon?: "check" | "shield";
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
          Média
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
    default:
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          {severidade}
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
    case "PENDENTE":
      return (
        <Badge variant="outline" className="text-muted-foreground border-muted">
          Pendente
        </Badge>
      );
    case "EM_ANDAMENTO":
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-300">
          Em andamento
        </Badge>
      );
    case "FINALIZADO":
      return (
        <Badge
          variant="outline"
          className="text-emerald-600 border-emerald-300"
        >
          Finalizado
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          {status}
        </Badge>
      );
  }
}

export function RecentClaimsTable({
  claims,
  title = "Sinistros",
  description = "Acompanhamento em tempo real",
  searchQuery,
  onSearchChange,
  currentPage,
  onPageChange,
  totalFiltered,
  pageSize,
  isTableLoading = false,
  showMotivoRejeicao = false,
  emptyStateMessage = "Nenhum registro encontrado.",
  emptyStateIcon,
}: RecentClaimsTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const startItem = totalFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalFiltered);
  const colSpan = showMotivoRejeicao ? 6 : 5;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="pt-2">
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Busca por ID ou Placa..."
            className="h-9"
          />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {isTableLoading ? (
          <div className="space-y-3">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Oficina Credenciada</TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Status</TableHead>
                  {showMotivoRejeicao && <TableHead>Motivo</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: pageSize }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-2.5 w-2.5 rounded-full" />
                        <Skeleton className="h-6 w-28 rounded-full" />
                      </div>
                    </TableCell>
                    {showMotivoRejeicao && (
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-4 w-48" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
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
                  {showMotivoRejeicao && (
                    <TableHead>Motivo de Rejeição</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={colSpan}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 py-2">
                        {emptyStateIcon === "check" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500/80" />
                        ) : emptyStateIcon === "shield" ? (
                          <ShieldCheck className="h-5 w-5 text-muted-foreground/70" />
                        ) : null}
                        <span>{emptyStateMessage}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  claims.map((claim) => (
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
                      {showMotivoRejeicao && (
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {claim.motivoRejeicao ?? (
                            <span className="italic opacity-50">
                              Não informado
                            </span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

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
