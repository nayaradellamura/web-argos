"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  anoFabricacao: number;
  proprietario: string;
  tipoCobertura: "basica" | "completa" | "premium";
  status: "ativo" | "sinistrado" | "inativo";
}

const veiculosData: Veiculo[] = [
  {
    id: "VEI-001",
    placa: "ABC-1234",
    modelo: "Honda Civic 2.0",
    anoFabricacao: 2022,
    proprietario: "João Silva Santos",
    tipoCobertura: "completa",
    status: "ativo",
  },
  {
    id: "VEI-002",
    placa: "XYZ-5678",
    modelo: "Toyota Corolla Cross",
    anoFabricacao: 2023,
    proprietario: "Maria Oliveira Costa",
    tipoCobertura: "premium",
    status: "sinistrado",
  },
  {
    id: "VEI-003",
    placa: "DEF-9012",
    modelo: "Volkswagen Polo 1.0",
    anoFabricacao: 2021,
    proprietario: "Carlos Eduardo Mendes",
    tipoCobertura: "basica",
    status: "ativo",
  },
  {
    id: "VEI-004",
    placa: "GHI-3456",
    modelo: "Chevrolet Onix Plus",
    anoFabricacao: 2022,
    proprietario: "Ana Paula Ferreira",
    tipoCobertura: "completa",
    status: "ativo",
  },
  {
    id: "VEI-005",
    placa: "JKL-7890",
    modelo: "Fiat Pulse Impetus",
    anoFabricacao: 2023,
    proprietario: "Roberto Almeida Junior",
    tipoCobertura: "premium",
    status: "inativo",
  },
  {
    id: "VEI-006",
    placa: "MNO-1234",
    modelo: "Hyundai HB20S",
    anoFabricacao: 2021,
    proprietario: "Patricia Lima Souza",
    tipoCobertura: "basica",
    status: "ativo",
  },
  {
    id: "VEI-007",
    placa: "PQR-5678",
    modelo: "Jeep Compass Limited",
    anoFabricacao: 2024,
    proprietario: "Fernando Costa Neto",
    tipoCobertura: "premium",
    status: "ativo",
  },
];

function getCoberturaBadge(cobertura: Veiculo["tipoCobertura"]) {
  const config = {
    basica: { label: "Básica", className: "bg-muted text-muted-foreground" },
    completa: { label: "Completa", className: "bg-primary/10 text-primary" },
    premium: {
      label: "Premium",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
  };
  return config[cobertura];
}

function getStatusBadge(status: Veiculo["status"]) {
  const config = {
    ativo: {
      label: "Ativo",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    sinistrado: {
      label: "Sinistrado",
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    inativo: { label: "Inativo", className: "bg-muted text-muted-foreground" },
  };
  return config[status];
}

interface VeiculosTableProps {
  searchQuery: string;
}

export function VeiculosTable({ searchQuery }: VeiculosTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredData = veiculosData.filter(
    (veiculo) =>
      veiculo.placa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      veiculo.modelo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      veiculo.proprietario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      veiculo.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <Card className="border-0 shadow-sm">
      <div className="overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Placa</TableHead>
              <TableHead className="font-semibold">Modelo</TableHead>
              <TableHead className="font-semibold">Ano</TableHead>
              <TableHead className="font-semibold">Proprietário</TableHead>
              <TableHead className="font-semibold">Cobertura</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((veiculo) => {
              const coberturaBadge = getCoberturaBadge(veiculo.tipoCobertura);
              const statusBadge = getStatusBadge(veiculo.status);

              return (
                <TableRow key={veiculo.id}>
                  <TableCell className="font-medium text-primary">
                    {veiculo.id}
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {veiculo.placa}
                  </TableCell>
                  <TableCell>{veiculo.modelo}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {veiculo.anoFabricacao}
                  </TableCell>
                  <TableCell>{veiculo.proprietario}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={coberturaBadge.className}
                    >
                      {coberturaBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusBadge.className}
                    >
                      {statusBadge.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a{" "}
            {Math.min(startIndex + itemsPerPage, filteredData.length)} de{" "}
            {filteredData.length} registros
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">Primeira página</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Página anterior</span>
            </Button>
            <span className="px-3 text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Próxima página</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Última página</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
