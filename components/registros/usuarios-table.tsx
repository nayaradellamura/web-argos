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
  Shield,
  ShieldCheck,
  ShieldAlert,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  type Usuario,
  getUsuarios,
  updateUsuario,
  deleteUsuario,
} from "@/lib/services/registros";

function getNivelBadge(nivel: string) {
  const map: Record<
    string,
    { label: string; className: string; icon: React.ElementType }
  > = {
    admin: {
      label: "Admin",
      className: "bg-red-100 text-red-700",
      icon: ShieldAlert,
    },
    gestor: {
      label: "Gestor",
      className: "bg-amber-100 text-amber-700",
      icon: ShieldCheck,
    },
    analista: {
      label: "Analista",
      className: "bg-primary/10 text-primary",
      icon: Shield,
    },
  };
  return (
    map[nivel] ?? {
      label: nivel,
      className: "bg-muted text-muted-foreground",
      icon: Shield,
    }
  );
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    ativo: { label: "Ativo", className: "bg-emerald-100 text-emerald-700" },
    inativo: { label: "Inativo", className: "bg-muted text-muted-foreground" },
  };
  return (
    map[status] ?? {
      label: status,
      className: "bg-muted text-muted-foreground",
    }
  );
}

function getInitials(name: string) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?"
  );
}

function formatUltimoAcesso(ts: any): string {
  if (!ts) return "—";
  if (typeof ts === "string") return ts;
  if (ts?.toDate) {
    return ts
      .toDate()
      .toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  }
  return "—";
}

interface UsuariosTableProps {
  searchQuery: string;
}

export function UsuariosTable({ searchQuery }: UsuariosTableProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | null>(null);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState<Usuario | null>(null);
  const [saving, setSaving] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    getUsuarios()
      .then(setUsuarios)
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(
    () =>
      usuarios.filter(
        (u) =>
          u.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.cargo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.departamento?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [usuarios, searchQuery],
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const openViewDialog = (u: Usuario) => {
    setSelectedUsuario(u);
    setEditForm(null);
    setDialogMode("view");
  };
  const openEditDialog = (u: Usuario) => {
    setSelectedUsuario(u);
    setEditForm(u);
    setDialogMode("edit");
  };
  const closeDialog = () => {
    setSelectedUsuario(null);
    setEditForm(null);
    setDialogMode(null);
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    try {
      await updateUsuario(editForm.id, editForm);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === editForm.id ? editForm : u)),
      );
      closeDialog();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!usuarioToDelete) return;
    await deleteUsuario(usuarioToDelete.id);
    setUsuarios((prev) => prev.filter((u) => u.id !== usuarioToDelete.id));
    setUsuarioToDelete(null);
  };

  const dialogUsuario = dialogMode === "edit" ? editForm : selectedUsuario;

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
      <Card className="overflow-hidden border-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Usuário</TableHead>
              <TableHead className="font-semibold">Cargo</TableHead>
              <TableHead className="font-semibold">Departamento</TableHead>
              <TableHead className="font-semibold">Nível de Acesso</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Último Acesso</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((usuario) => {
              const nivel = getNivelBadge(usuario.nivelAcesso);
              const status = getStatusBadge(usuario.status);
              const NivelIcon = nivel.icon;
              return (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {usuario.foto && (
                          <AvatarImage src={usuario.foto} alt={usuario.nome} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {getInitials(usuario.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{usuario.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {usuario.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{usuario.cargo}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {usuario.departamento}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={nivel.className}>
                      <NivelIcon className="mr-1 h-3 w-3" />
                      {nivel.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={status.className}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatUltimoAcesso(usuario.ultimoAcesso)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openViewDialog(usuario)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditDialog(usuario)}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setUsuarioToDelete(usuario)}
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
              {dialogMode === "edit" ? "Editar Usuário" : "Visualizar Usuário"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "edit"
                ? "Atualize os dados do usuário."
                : "Informações completas do usuário."}
            </DialogDescription>
          </DialogHeader>
          {dialogUsuario && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={dialogUsuario.nome}
                    disabled={dialogMode === "view"}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, nome: e.target.value } : p,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    value={dialogUsuario.email}
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
                  <Label>Cargo</Label>
                  <Input
                    value={dialogUsuario.cargo ?? ""}
                    disabled={dialogMode === "view"}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, cargo: e.target.value } : p,
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Input
                    value={dialogUsuario.departamento ?? ""}
                    disabled={dialogMode === "view"}
                    onChange={(e) =>
                      setEditForm((p) =>
                        p ? { ...p, departamento: e.target.value } : p,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nível de acesso</Label>
                  <Select
                    value={dialogUsuario.nivelAcesso ?? "analista"}
                    disabled={dialogMode === "view"}
                    onValueChange={(v) =>
                      setEditForm((p) => (p ? { ...p, nivelAcesso: v } : p))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="analista">Analista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={dialogUsuario.status}
                    disabled={dialogMode === "view"}
                    onValueChange={(v) =>
                      setEditForm((p) => (p ? { ...p, status: v } : p))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
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
        open={usuarioToDelete !== null}
        onOpenChange={(open) => !open && setUsuarioToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              {usuarioToDelete
                ? `Esta ação removerá ${usuarioToDelete.nome} permanentemente.`
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
