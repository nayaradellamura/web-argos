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
  type Cliente,
  getClientes,
  updateCliente,
  deleteCliente,
} from "@/lib/services/registros";

function getRiscoBadge(risco: string) {
  const map: Record<string, { label: string; className: string }> = {
    baixo: { label: "Baixo", className: "bg-emerald-100 text-emerald-700" },
    Baixo: { label: "Baixo", className: "bg-emerald-100 text-emerald-700" },
    medio: { label: "Médio", className: "bg-amber-100 text-amber-700" },
    Médio: { label: "Médio", className: "bg-amber-100 text-amber-700" },
    alto: { label: "Alto", className: "bg-red-100 text-red-700" },
    Alto: { label: "Alto", className: "bg-red-100 text-red-700" },
  };
  return (
    map[risco] ?? { label: risco, className: "bg-muted text-muted-foreground" }
  );
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    ativo: { label: "Ativo", className: "bg-primary/10 text-primary" },
    Ativo: { label: "Ativo", className: "bg-primary/10 text-primary" },
    bloqueado: {
      label: "Bloqueado",
      className: "bg-muted text-muted-foreground",
    },
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

interface ClientesTableProps {
  searchQuery: string;
  createdCliente?: Cliente | null;
  onConsumeCreatedCliente?: () => void;
}

export function ClientesTable({
  searchQuery,
  createdCliente,
  onConsumeCreatedCliente,
}: ClientesTableProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | null>(null);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
  const [editForm, setEditForm] = useState<Cliente | null>(null);
  const [saving, setSaving] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    getClientes()
      .then(setClientes)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!createdCliente) return;

    setClientes((prev) => {
      if (prev.some((item) => item.id === createdCliente.id)) {
        return prev;
      }
      return [createdCliente, ...prev];
    });
    setCurrentPage(1);
    onConsumeCreatedCliente?.();
  }, [createdCliente, onConsumeCreatedCliente]);

  const toSearchText = (value: unknown) => String(value ?? "").toLowerCase();

  const filteredData = useMemo(() => {
    const query = toSearchText(searchQuery);

    return clientes.filter(
      (c) =>
        toSearchText(c.nomeCompleto).includes(query) ||
        toSearchText(c.cpfCnpj).includes(query) ||
        toSearchText(c.email).includes(query) ||
        toSearchText(c.id).includes(query),
    );
  }, [clientes, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const openViewDialog = (c: Cliente) => {
    setSelectedCliente(c);
    setEditForm(null);
    setDialogMode("view");
  };
  const openEditDialog = (c: Cliente) => {
    setSelectedCliente(c);
    setEditForm(c);
    setDialogMode("edit");
  };
  const closeDialog = () => {
    setSelectedCliente(null);
    setEditForm(null);
    setDialogMode(null);
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    try {
      await updateCliente(editForm.id, editForm);
      setClientes((prev) =>
        prev.map((c) => (c.id === editForm.id ? editForm : c)),
      );
      closeDialog();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!clienteToDelete) return;
    await deleteCliente(clienteToDelete.id);
    setClientes((prev) => prev.filter((c) => c.id !== clienteToDelete.id));
    setClienteToDelete(null);
  };

  const dialogCliente = dialogMode === "edit" ? editForm : selectedCliente;

  if (loading) {
    return (
      <Card className="border-0 shadow-sm p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Nome Completo</TableHead>
                <TableHead className="font-semibold">CPF/CNPJ</TableHead>
                <TableHead className="font-semibold">E-mail</TableHead>
                <TableHead className="font-semibold">Risco Histórico</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((cliente) => {
                const risco = getRiscoBadge(cliente.riscoHistorico);
                const status = getStatusBadge(cliente.status);
                return (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">
                      {cliente.nomeCompleto}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cliente.cpfCnpj}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cliente.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={risco.className}>
                        {risco.label}
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
                            onClick={() => openViewDialog(cliente)}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(cliente)}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setClienteToDelete(cliente)}
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

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
              {dialogMode === "edit" ? "Editar Cliente" : "Visualizar Cliente"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "edit"
                ? "Atualize os dados cadastrais do cliente."
                : "Informações completas do cliente."}
            </DialogDescription>
          </DialogHeader>
          {dialogCliente && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input
                  value={dialogCliente.nomeCompleto}
                  disabled={dialogMode === "view"}
                  onChange={(e) =>
                    setEditForm((p) =>
                      p ? { ...p, nomeCompleto: e.target.value } : p,
                    )
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input
                    value={dialogCliente.cpfCnpj}
                    disabled={dialogMode === "view"}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, cpfCnpj: e.target.value } : p,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    value={dialogCliente.email}
                    disabled={dialogMode === "view"}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, email: e.target.value } : p,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Risco histórico</Label>
                  <Select
                    value={dialogCliente.riscoHistorico}
                    disabled={dialogMode === "view"}
                    onValueChange={(v) =>
                      setEditForm((p) => (p ? { ...p, riscoHistorico: v } : p))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixo">Baixo</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={dialogCliente.status}
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
        open={clienteToDelete !== null}
        onOpenChange={(open) => !open && setClienteToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {clienteToDelete
                ? `Esta ação removerá ${clienteToDelete.nomeCompleto} permanentemente do banco de dados.`
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
