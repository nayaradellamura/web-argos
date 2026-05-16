"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type Veiculo,
  getVeiculos,
  updateVeiculo,
  deleteVeiculo,
} from "@/lib/services/registros";

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    Ativo: { label: "Ativo", className: "bg-emerald-100 text-emerald-700" },
    ativo: { label: "Ativo", className: "bg-emerald-100 text-emerald-700" },
    sinistrado: { label: "Sinistrado", className: "bg-red-100 text-red-700" },
    Sinistrado: { label: "Sinistrado", className: "bg-red-100 text-red-700" },
    inativo: { label: "Inativo", className: "bg-muted text-muted-foreground" },
    Inativo: { label: "Inativo", className: "bg-muted text-muted-foreground" },
  };
  return (
    map[status] ?? {
      label: status,
      className: "bg-muted text-muted-foreground",
    }
  );
}

function getCoberturaBadge(cobertura: string) {
  const map: Record<string, { label: string; className: string }> = {
    "Roubo e Furto": {
      label: "Roubo e Furto",
      className: "bg-muted text-muted-foreground",
    },
    basica: { label: "Básica", className: "bg-muted text-muted-foreground" },
    completa: { label: "Completa", className: "bg-primary/10 text-primary" },
    premium: { label: "Premium", className: "bg-amber-100 text-amber-700" },
  };
  return (
    map[cobertura] ?? {
      label: cobertura,
      className: "bg-muted text-muted-foreground",
    }
  );
}

interface VeiculosTableProps {
  searchQuery: string;
}

export function VeiculosTable({ searchQuery }: VeiculosTableProps) {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | null>(null);
  const [veiculoToDelete, setVeiculoToDelete] = useState<Veiculo | null>(null);
  const [editForm, setEditForm] = useState<Veiculo | null>(null);
  const [saving, setSaving] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    getVeiculos()
      .then(setVeiculos)
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(
    () =>
      veiculos.filter(
        (v) =>
          v.placa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.modelo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.marca?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.proprietario?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.id?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [veiculos, searchQuery],
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const openViewDialog = (v: Veiculo) => {
    setSelectedVeiculo(v);
    setEditForm(null);
    setDialogMode("view");
  };
  const openEditDialog = (v: Veiculo) => {
    setSelectedVeiculo(v);
    setEditForm(v);
    setDialogMode("edit");
  };
  const closeDialog = () => {
    setSelectedVeiculo(null);
    setEditForm(null);
    setDialogMode(null);
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    try {
      await updateVeiculo(editForm.id, editForm);
      setVeiculos((prev) =>
        prev.map((v) => (v.id === editForm.id ? editForm : v)),
      );
      closeDialog();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!veiculoToDelete) return;
    await deleteVeiculo(veiculoToDelete.id);
    setVeiculos((prev) => prev.filter((v) => v.id !== veiculoToDelete.id));
    setVeiculoToDelete(null);
  };

  const dialogVeiculo = dialogMode === "edit" ? editForm : selectedVeiculo;

  if (loading) {
    return (
      <Card className="border-0 shadow-sm p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg bg-muted/70" />
        ))}
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Placa</TableHead>
                <TableHead className="font-semibold">Marca / Modelo</TableHead>
                <TableHead className="font-semibold">Ano</TableHead>
                <TableHead className="font-semibold">Proprietário</TableHead>
                <TableHead className="font-semibold">Cobertura</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((veiculo) => {
                const status = getStatusBadge(veiculo.status);
                const cobertura = getCoberturaBadge(veiculo.tipoCobertura);
                return (
                  <TableRow key={veiculo.id}>
                    <TableCell className="font-medium text-primary">
                      {veiculo.id}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {veiculo.placa}
                    </TableCell>
                    <TableCell>
                      {veiculo.marca} {veiculo.modelo}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {veiculo.anoFabricacao}
                    </TableCell>
                    <TableCell>{veiculo.proprietario}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cobertura.className}
                      >
                        {cobertura.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openViewDialog(veiculo)}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(veiculo)}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setVeiculoToDelete(veiculo)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Apagar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

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
              disabled={safeCurrentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={safeCurrentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm text-muted-foreground">
              Página {safeCurrentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={safeCurrentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Editar Veículo" : "Visualizar Veículo"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "edit"
                ? "Atualize os dados do veículo."
                : "Informações completas do veículo."}
            </DialogDescription>
          </DialogHeader>
          {dialogVeiculo && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Placa</Label>
                  <Input
                    value={dialogVeiculo.placa}
                    disabled={dialogMode === "view"}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, placa: e.target.value } : p,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input
                    value={dialogVeiculo.marca}
                    disabled={dialogMode === "view"}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, marca: e.target.value } : p,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Input
                    value={dialogVeiculo.modelo}
                    disabled={dialogMode === "view"}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, modelo: e.target.value } : p,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input
                    type="number"
                    value={dialogVeiculo.anoFabricacao}
                    disabled={dialogMode === "view"}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, anoFabricacao: Number(e.target.value) } : p,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cobertura</Label>
                  <Input
                    value={dialogVeiculo.tipoCobertura}
                    disabled={dialogMode === "view"}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, tipoCobertura: e.target.value } : p,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={dialogVeiculo.status}
                    disabled={dialogMode === "view"}
                    onValueChange={(v) =>
                      setEditForm((p) => (p ? { ...p, status: v } : p))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Sinistrado">Sinistrado</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Fechar
                </Button>
                {dialogMode === "edit" && (
                  <Button type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                )}
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={veiculoToDelete !== null}
        onOpenChange={(open) => !open && setVeiculoToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar veículo?</AlertDialogTitle>
            <AlertDialogDescription>
              {veiculoToDelete
                ? `Esta ação removerá o veículo ${veiculoToDelete.placa} permanentemente.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
