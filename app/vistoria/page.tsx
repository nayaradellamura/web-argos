"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Search, Calendar, MapPin, Eye, CheckCircle2, Clock, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InspecaoData {
  id: string;
  sinistroId: string;
  credenciado: string;
  local: string;
  data: string;
  hora: string;
  status: "pendente" | "agendada" | "realizada";
  veiculo: string;
  placa: string;
  cliente: string;
  descricaoArtigos?: string;
  fotos?: string[];
  observacoes?: string;
}

const mockInspecoes: InspecaoData[] = [
  {
    id: "VST-001",
    sinistroId: "CLM-127",
    credenciado: "Auto Center Premium",
    local: "Av. Paulista, 1000 - São Paulo, SP",
    data: "2026-04-15",
    hora: "14:30",
    status: "agendada",
    veiculo: "Honda Civic",
    placa: "ABC-1234",
    cliente: "João Silva",
    descricaoArtigos: "Dano na lateral esquerda, amassamento na porta",
  },
  {
    id: "VST-002",
    sinistroId: "CLM-126",
    credenciado: "Oficina Central",
    local: "Rua das Flores, 456 - Rio de Janeiro, RJ",
    data: "2026-04-12",
    hora: "10:00",
    status: "realizada",
    veiculo: "Toyota Corolla",
    placa: "XYZ-5678",
    cliente: "Maria Santos",
    descricaoArtigos: "Vidro traseiro quebrado",
    observacoes: "Vistoria realizada com sucesso. Cliente presente.",
  },
  {
    id: "VST-003",
    sinistroId: "CLM-125",
    credenciado: "Repair Masters",
    local: "Rua do Comércio, 789 - Belo Horizonte, MG",
    data: "2026-04-20",
    hora: "09:00",
    status: "pendente",
    veiculo: "VW Golf",
    placa: "DEF-9012",
    cliente: "Carlos Mendes",
  },
];

// Sinistros disponíveis para vincular (simulando dados do kanban)
const sinistrosDisponiveis = [
  { id: "CLM-127", veiculo: "Honda Civic", placa: "ABC-1234", cliente: "João Silva" },
  { id: "CLM-126", veiculo: "Toyota Corolla", placa: "XYZ-5678", cliente: "Maria Santos" },
  { id: "CLM-125", veiculo: "VW Golf", placa: "DEF-9012", cliente: "Carlos Mendes" },
  { id: "CLM-124", veiculo: "Fiat Uno", placa: "GHI-3456", cliente: "Ana Costa" },
  { id: "CLM-123", veiculo: "Ford Focus", placa: "JKL-7890", cliente: "Pedro Lima" },
];

export default function VistoriaPage() {
  const [inspecoes, setInspecoes] = useState<InspecaoData[]>(mockInspecoes);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [selectedInspecao, setSelectedInspecao] = useState<InspecaoData | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nextId, setNextId] = useState(4);
  const [formData, setFormData] = useState({
    sinistroId: "",
    credenciado: "",
    status: "agendada" as "agendada" | "realizada" | "pendente",
  });

  const filteredInspecoes = inspecoes.filter((inspecao) => {
    const matchesSearch =
      inspecao.sinistroId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspecao.veiculo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspecao.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspecao.credenciado.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "Todas" || inspecao.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    pendentes: inspecoes.filter((i) => i.status === "pendente").length,
    agendadas: inspecoes.filter((i) => i.status === "agendada").length,
    realizadas: inspecoes.filter((i) => i.status === "realizada").length,
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "realizada":
        return {
          label: "Realizada",
          color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
          icon: CheckCircle2,
        };
      case "agendada":
        return {
          label: "Agendada",
          color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          icon: Calendar,
        };
      default:
        return {
          label: "Pendente",
          color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
          icon: AlertTriangle,
        };
    }
  };

  const handleCreateVistoria = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sinistroId || !formData.credenciado) {
      alert("Selecione o sinistro e o credenciado");
      return;
    }

    // Encontrar dados do sinistro
    const sinistroInfo = sinistrosDisponiveis.find(s => s.id === formData.sinistroId);
    if (!sinistroInfo) {
      alert("Sinistro não encontrado");
      return;
    }

    // Verificar se já existe vistoria para este sinistro
    const jaPossuiVistoria = inspecoes.some(i => i.sinistroId === formData.sinistroId);
    if (jaPossuiVistoria) {
      alert("Este sinistro já possui uma vistoria vinculada");
      return;
    }

    const novaVistoria: InspecaoData = {
      id: `VST-${String(nextId).padStart(3, "0")}`,
      sinistroId: formData.sinistroId,
      credenciado: formData.credenciado,
      local: "",
      data: "",
      hora: "",
      status: formData.status,
      veiculo: sinistroInfo.veiculo,
      placa: sinistroInfo.placa,
      cliente: sinistroInfo.cliente,
    };

    setInspecoes([...inspecoes, novaVistoria]);
    setNextId(nextId + 1);
    setIsCreateOpen(false);
    setFormData({
      sinistroId: "",
      credenciado: "",
      status: "agendada",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gerenciamento de Vistorias"
          description="Agende, acompanhe e gerencie todas as vistorias de sinistros"
        />

        {/* Novo Button */}
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Vistoria
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendentes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Agendadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.agendadas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Realizadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.realizadas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gaps-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar sinistro, veículo, cliente ou credenciado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="agendada">Agendadas</SelectItem>
              <SelectItem value="realizada">Realizadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Inspecões List */}
        <div className="space-y-3">
          {filteredInspecoes.length === 0 ? (
            <Card>
              <CardContent className="flex h-32 items-center justify-center">
                <p className="text-sm text-muted-foreground">Nenhuma vistoria encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredInspecoes.map((inspecao) => {
              const statusConfig = getStatusConfig(inspecao.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={inspecao.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold">{inspecao.sinistroId}</span>
                              <Badge className={cn("inline-flex gap-1", statusConfig.color)}>
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {inspecao.veiculo} • {inspecao.placa}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2Icon className="h-4 w-4" />
                            <span>{inspecao.credenciado}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{inspecao.local}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(inspecao.data).toLocaleDateString("pt-BR")} às {inspecao.hora}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium text-foreground">Cliente:</span>
                            <span>{inspecao.cliente}</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto">
                        <Button
                          variant="outline"
                          className="w-full gap-2 sm:w-auto"
                          onClick={() => setSelectedInspecao(inspecao)}
                        >
                          <Eye className="h-4 w-4" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedInspecao} onOpenChange={() => setSelectedInspecao(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Vistoria {selectedInspecao?.id}</DialogTitle>
            <DialogDescription>
              Sinistro {selectedInspecao?.sinistroId}
            </DialogDescription>
          </DialogHeader>

          {selectedInspecao && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Veículo
                  </p>
                  <p className="text-sm font-medium">{selectedInspecao.veiculo}</p>
                  <p className="text-xs text-muted-foreground">{selectedInspecao.placa}</p>
                </div>

                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Cliente
                  </p>
                  <p className="text-sm font-medium">{selectedInspecao.cliente}</p>
                </div>

                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Credenciado
                  </p>
                  <p className="text-sm font-medium">{selectedInspecao.credenciado}</p>
                </div>

                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Local
                  </p>
                  <p className="text-sm font-medium">{selectedInspecao.local}</p>
                </div>

                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Data e Hora
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(selectedInspecao.data).toLocaleDateString("pt-BR")} às {selectedInspecao.hora}
                  </p>
                </div>

                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Status
                  </p>
                  <div className="mt-1">
                    <Badge
                      className={cn(
                        "inline-flex gap-1",
                        getStatusConfig(selectedInspecao.status).color,
                      )}
                    >
                      {getStatusConfig(selectedInspecao.status).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedInspecao.descricaoArtigos && (
                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Descrição de Artigos
                  </p>
                  <p className="text-sm text-foreground">{selectedInspecao.descricaoArtigos}</p>
                </div>
              )}

              {selectedInspecao.observacoes && (
                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Observações
                  </p>
                  <p className="text-sm text-foreground">{selectedInspecao.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog - Criar Nova Vistoria */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Vistoria</DialogTitle>
            <DialogDescription>
              Vincule um sinistro aberto com um credenciado
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateVistoria} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sinistroId">Sinistro *</Label>
              <Select
                value={formData.sinistroId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, sinistroId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um sinistro" />
                </SelectTrigger>
                <SelectContent>
                  {sinistrosDisponiveis
                    .filter(s => !inspecoes.some(i => i.sinistroId === s.id))
                    .map((sinistro) => (
                      <SelectItem key={sinistro.id} value={sinistro.id}>
                        {sinistro.id} - {sinistro.veiculo} ({sinistro.placa})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credenciado">Credenciado *</Label>
              <Select
                value={formData.credenciado}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, credenciado: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um credenciado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auto Center Premium">Auto Center Premium</SelectItem>
                  <SelectItem value="Oficina Central">Oficina Central</SelectItem>
                  <SelectItem value="Repair Masters">Repair Masters</SelectItem>
                  <SelectItem value="Express Auto">Express Auto</SelectItem>
                  <SelectItem value="Técnicos Associados">Técnicos Associados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as "agendada" | "realizada" | "pendente",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="realizada">Realizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Vincular</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Icon component
function Building2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
