"use client"

import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

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
  const itemsPerPage = 5

  const filteredData = usuariosData.filter(
    (usuario) =>
      usuario.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.cargo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.departamento.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  return (
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
                        Desativar
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
    </Card>
  )
}
