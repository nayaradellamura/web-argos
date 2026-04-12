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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Cliente {
  id: string
  nomeCompleto: string
  cpfCnpj: string
  email: string
  riscoHistorico: "baixo" | "medio" | "alto"
  status: "ativo" | "bloqueado"
}

const clientesData: Cliente[] = [
  {
    id: "CLI-001",
    nomeCompleto: "João Silva Santos",
    cpfCnpj: "123.456.789-00",
    email: "joao.silva@email.com",
    riscoHistorico: "baixo",
    status: "ativo",
  },
  {
    id: "CLI-002",
    nomeCompleto: "Maria Oliveira Costa",
    cpfCnpj: "987.654.321-00",
    email: "maria.oliveira@email.com",
    riscoHistorico: "medio",
    status: "ativo",
  },
  {
    id: "CLI-003",
    nomeCompleto: "Auto Peças Ltda",
    cpfCnpj: "12.345.678/0001-90",
    email: "contato@autopecas.com.br",
    riscoHistorico: "alto",
    status: "bloqueado",
  },
  {
    id: "CLI-004",
    nomeCompleto: "Carlos Eduardo Mendes",
    cpfCnpj: "456.789.123-00",
    email: "carlos.mendes@email.com",
    riscoHistorico: "baixo",
    status: "ativo",
  },
  {
    id: "CLI-005",
    nomeCompleto: "Ana Paula Ferreira",
    cpfCnpj: "321.654.987-00",
    email: "ana.ferreira@email.com",
    riscoHistorico: "medio",
    status: "ativo",
  },
  {
    id: "CLI-006",
    nomeCompleto: "Transportadora Norte Sul SA",
    cpfCnpj: "98.765.432/0001-10",
    email: "comercial@nortesul.com.br",
    riscoHistorico: "baixo",
    status: "ativo",
  },
  {
    id: "CLI-007",
    nomeCompleto: "Roberto Almeida Junior",
    cpfCnpj: "654.321.987-00",
    email: "roberto.junior@email.com",
    riscoHistorico: "alto",
    status: "bloqueado",
  },
  {
    id: "CLI-008",
    nomeCompleto: "Patricia Lima Souza",
    cpfCnpj: "789.123.456-00",
    email: "patricia.souza@email.com",
    riscoHistorico: "baixo",
    status: "ativo",
  },
  {
    id: "CLI-009",
    nomeCompleto: "Mecânica Express Ltda",
    cpfCnpj: "11.222.333/0001-44",
    email: "atendimento@mecanicaexpress.com",
    riscoHistorico: "medio",
    status: "ativo",
  },
  {
    id: "CLI-010",
    nomeCompleto: "Fernando Costa Neto",
    cpfCnpj: "147.258.369-00",
    email: "fernando.neto@email.com",
    riscoHistorico: "baixo",
    status: "ativo",
  },
]

function getRiscoBadge(risco: Cliente["riscoHistorico"]) {
  const config = {
    baixo: { label: "Baixo", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    medio: { label: "Médio", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    alto: { label: "Alto", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  }
  return config[risco]
}

function getStatusBadge(status: Cliente["status"]) {
  const config = {
    ativo: { label: "Ativo", className: "bg-primary/10 text-primary" },
    bloqueado: { label: "Bloqueado", className: "bg-muted text-muted-foreground" },
  }
  return config[status]
}

interface ClientesTableProps {
  searchQuery: string
}

export function ClientesTable({ searchQuery }: ClientesTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [clientes, setClientes] = useState(clientesData)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | null>(null)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const [editForm, setEditForm] = useState<Cliente | null>(null)
  const itemsPerPage = 5

  const filteredData = useMemo(() => clientes.filter(
    (cliente) =>
      cliente.nomeCompleto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cliente.cpfCnpj.includes(searchQuery) ||
      cliente.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cliente.id.toLowerCase().includes(searchQuery.toLowerCase())
  ), [clientes, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const openViewDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setDialogMode("view")
    setEditForm(null)
  }

  const openEditDialog = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setEditForm(cliente)
    setDialogMode("edit")
  }

  const closeDialog = () => {
    setSelectedCliente(null)
    setEditForm(null)
    setDialogMode(null)
  }

  const handleSaveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editForm) return

    setClientes((current) =>
      current.map((cliente) =>
        cliente.id === editForm.id ? editForm : cliente,
      ),
    )

    closeDialog()
  }

  const handleDeleteCliente = () => {
    if (!clienteToDelete) return

    setClientes((current) =>
      current.filter((cliente) => cliente.id !== clienteToDelete.id),
    )
    setClienteToDelete(null)
  }

  const dialogCliente = dialogMode === "edit" ? editForm : selectedCliente

  return (
    <>
    <Card className="border-0 shadow-sm">
      <div className="overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">ID</TableHead>
            <TableHead className="font-semibold">Nome Completo</TableHead>
            <TableHead className="font-semibold">CPF/CNPJ</TableHead>
            <TableHead className="font-semibold">E-mail</TableHead>
            <TableHead className="font-semibold">Risco Histórico</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((cliente) => {
            const riscoBadge = getRiscoBadge(cliente.riscoHistorico)
            const statusBadge = getStatusBadge(cliente.status)

            return (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium text-primary">
                  {cliente.id}
                </TableCell>
                <TableCell className="font-medium">{cliente.nomeCompleto}</TableCell>
                <TableCell className="text-muted-foreground">
                  {cliente.cpfCnpj}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {cliente.email}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={riscoBadge.className}>
                    {riscoBadge.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusBadge.className}>
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
                      <DropdownMenuItem onClick={() => openViewDialog(cliente)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(cliente)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setClienteToDelete(cliente)}
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
      </div>

      <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredData.length)} de {filteredData.length} registros
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
            {dialogMode === "edit" ? "Editar Cliente" : "Visualizar Cliente"}
          </DialogTitle>
          <DialogDescription>
            {dialogMode === "edit"
              ? "Atualize os dados cadastrais do cliente selecionado."
              : "Confira as informações completas do cliente selecionado."}
          </DialogDescription>
        </DialogHeader>

        {dialogCliente && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente-id">ID</Label>
              <Input id="cliente-id" value={dialogCliente.id} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente-nome-completo">Nome completo</Label>
              <Input
                id="cliente-nome-completo"
                value={dialogCliente.nomeCompleto}
                disabled={dialogMode === "view"}
                onChange={(event) =>
                  setEditForm((prev) =>
                    prev ? { ...prev, nomeCompleto: event.target.value } : prev,
                  )
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cliente-cpfcnpj">CPF/CNPJ</Label>
                <Input
                  id="cliente-cpfcnpj"
                  value={dialogCliente.cpfCnpj}
                  disabled={dialogMode === "view"}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, cpfCnpj: event.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente-email">E-mail</Label>
                <Input
                  id="cliente-email"
                  value={dialogCliente.email}
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
                <Label>Risco histórico</Label>
                <Select
                  value={dialogCliente.riscoHistorico}
                  disabled={dialogMode === "view"}
                  onValueChange={(value: Cliente["riscoHistorico"]) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, riscoHistorico: value } : prev,
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={dialogCliente.status}
                  disabled={dialogMode === "view"}
                  onValueChange={(value: Cliente["status"]) =>
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
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

    <AlertDialog open={clienteToDelete !== null} onOpenChange={(open) => !open && setClienteToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            {clienteToDelete
              ? `Esta ação removerá ${clienteToDelete.nomeCompleto} da lista atual.`
              : "Esta ação removerá o cliente da lista atual."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleDeleteCliente}>
            Apagar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
