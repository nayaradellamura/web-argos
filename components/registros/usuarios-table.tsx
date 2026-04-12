"use client"

import { useMemo, useState } from "react"
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
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Usuario {
  id: string
  nome: string
  email: string
  cargo: string
  departamento: string
  nivelAcesso: "admin" | "gestor" | "analista"
  status: "ativo" | "inativo"
  ultimoAcesso: string
}

const usuariosData: Usuario[] = [
  {
    id: "USR-001",
    nome: "Nayara Dellamura",
    email: "nayara.dellamura@argos.com",
    cargo: "Analista Sênior",
    departamento: "Regulação",
    nivelAcesso: "gestor",
    status: "ativo",
    ultimoAcesso: "Agora",
  },
  {
    id: "USR-002",
    nome: "Ricardo Almeida",
    email: "ricardo.almeida@argos.com",
    cargo: "Diretor de Operações",
    departamento: "Diretoria",
    nivelAcesso: "admin",
    status: "ativo",
    ultimoAcesso: "2h atrás",
  },
  {
    id: "USR-003",
    nome: "Camila Ferreira",
    email: "camila.ferreira@argos.com",
    cargo: "Analista de Sinistros",
    departamento: "Regulação",
    nivelAcesso: "analista",
    status: "ativo",
    ultimoAcesso: "1h atrás",
  },
  {
    id: "USR-004",
    nome: "Pedro Henrique Costa",
    email: "pedro.costa@argos.com",
    cargo: "Gestor de Fraudes",
    departamento: "Compliance",
    nivelAcesso: "gestor",
    status: "ativo",
    ultimoAcesso: "30min atrás",
  },
  {
    id: "USR-005",
    nome: "Juliana Santos",
    email: "juliana.santos@argos.com",
    cargo: "Analista de Vistoria",
    departamento: "Vistoria",
    nivelAcesso: "analista",
    status: "inativo",
    ultimoAcesso: "5 dias atrás",
  },
  {
    id: "USR-006",
    nome: "Bruno Oliveira",
    email: "bruno.oliveira@argos.com",
    cargo: "Coordenador Técnico",
    departamento: "TI",
    nivelAcesso: "admin",
    status: "ativo",
    ultimoAcesso: "15min atrás",
  },
  {
    id: "USR-007",
    nome: "Amanda Lima",
    email: "amanda.lima@argos.com",
    cargo: "Analista de Orçamentos",
    departamento: "Orçamentação",
    nivelAcesso: "analista",
    status: "ativo",
    ultimoAcesso: "45min atrás",
  },
]

function getNivelAcessoBadge(nivel: Usuario["nivelAcesso"]) {
  const config = {
    admin: { 
      label: "Admin", 
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      icon: ShieldAlert,
    },
    gestor: { 
      label: "Gestor", 
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      icon: ShieldCheck,
    },
    analista: { 
      label: "Analista", 
      className: "bg-primary/10 text-primary",
      icon: Shield,
    },
  }
  return config[nivel]
}

function getStatusBadge(status: Usuario["status"]) {
  const config = {
    ativo: { label: "Ativo", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    inativo: { label: "Inativo", className: "bg-muted text-muted-foreground" },
  }
  return config[status]
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

interface UsuariosTableProps {
  searchQuery: string
}

export function UsuariosTable({ searchQuery }: UsuariosTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [usuarios, setUsuarios] = useState(usuariosData)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | null>(null)
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null)
  const [editForm, setEditForm] = useState<Usuario | null>(null)
  const itemsPerPage = 5

  const filteredData = useMemo(() => usuarios.filter(
    (usuario) =>
      usuario.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.cargo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.departamento.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.id.toLowerCase().includes(searchQuery.toLowerCase())
  ), [usuarios, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const openViewDialog = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setEditForm(null)
    setDialogMode("view")
  }

  const openEditDialog = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setEditForm(usuario)
    setDialogMode("edit")
  }

  const closeDialog = () => {
    setSelectedUsuario(null)
    setEditForm(null)
    setDialogMode(null)
  }

  const handleSaveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editForm) return

    setUsuarios((current) =>
      current.map((usuario) =>
        usuario.id === editForm.id ? editForm : usuario,
      ),
    )

    closeDialog()
  }

  const handleDeleteUsuario = () => {
    if (!usuarioToDelete) return

    setUsuarios((current) =>
      current.filter((usuario) => usuario.id !== usuarioToDelete.id),
    )
    setUsuarioToDelete(null)
  }

  const dialogUsuario = dialogMode === "edit" ? editForm : selectedUsuario

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
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((usuario) => {
            const nivelBadge = getNivelAcessoBadge(usuario.nivelAcesso)
            const statusBadge = getStatusBadge(usuario.status)
            const NivelIcon = nivelBadge.icon

            return (
              <TableRow key={usuario.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(usuario.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{usuario.nome}</p>
                      <p className="text-sm text-muted-foreground">{usuario.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{usuario.cargo}</TableCell>
                <TableCell className="text-muted-foreground">
                  {usuario.departamento}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={nivelBadge.className}>
                    <NivelIcon className="mr-1 h-3 w-3" />
                    {nivelBadge.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusBadge.className}>
                    {statusBadge.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {usuario.ultimoAcesso}
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
                      <DropdownMenuItem onClick={() => openViewDialog(usuario)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(usuario)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setUsuarioToDelete(usuario)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Apagar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredData.length)} de {filteredData.length} registros
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
            <span className="sr-only">Primeira página</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={safeCurrentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
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
            <span className="sr-only">Próxima página</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Última página</span>
          </Button>
        </div>
      </div>
    </Card>

    <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {dialogMode === "edit" ? "Editar Usuário" : "Visualizar Usuário"}
          </DialogTitle>
          <DialogDescription>
            {dialogMode === "edit"
              ? "Atualize os dados do usuário selecionado."
              : "Confira as informações completas do usuário selecionado."}
          </DialogDescription>
        </DialogHeader>

        {dialogUsuario && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usuario-id">ID</Label>
              <Input id="usuario-id" value={dialogUsuario.id} disabled />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usuario-nome">Nome</Label>
                <Input
                  id="usuario-nome"
                  value={dialogUsuario.nome}
                  disabled={dialogMode === "view"}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, nome: event.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usuario-email">E-mail</Label>
                <Input
                  id="usuario-email"
                  value={dialogUsuario.email}
                  disabled={dialogMode === "view"}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, email: event.target.value } : prev,
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usuario-cargo">Cargo</Label>
                <Input
                  id="usuario-cargo"
                  value={dialogUsuario.cargo}
                  disabled={dialogMode === "view"}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, cargo: event.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usuario-departamento">Departamento</Label>
                <Input
                  id="usuario-departamento"
                  value={dialogUsuario.departamento}
                  disabled={dialogMode === "view"}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, departamento: event.target.value } : prev,
                    )
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nível de acesso</Label>
                <Select
                  value={dialogUsuario.nivelAcesso}
                  disabled={dialogMode === "view"}
                  onValueChange={(value: Usuario["nivelAcesso"]) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, nivelAcesso: value } : prev,
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
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
                  onValueChange={(value: Usuario["status"]) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, status: value } : prev,
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuario-ultimo-acesso">Último acesso</Label>
              <Input
                id="usuario-ultimo-acesso"
                value={dialogUsuario.ultimoAcesso}
                disabled={dialogMode === "view"}
                onChange={(event) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, ultimoAcesso: event.target.value } : prev,
                  )
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Fechar
              </Button>
              {dialogMode === "edit" && <Button type="submit">Salvar Alterações</Button>}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>

    <AlertDialog open={usuarioToDelete !== null} onOpenChange={(open) => !open && setUsuarioToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar usuário?</AlertDialogTitle>
          <AlertDialogDescription>
            {usuarioToDelete
              ? `Esta ação removerá ${usuarioToDelete.nome} da lista atual.`
              : "Esta ação removerá o usuário da lista atual."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleDeleteUsuario}>
            Apagar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
