"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import {
  Search,
  Calendar,
  MapPin,
  Eye,
  Building2,
  CheckCircle2,
  Timer,
  AlertTriangle,
  Plus,
  FileText,
  FileAudio,
  Image as ImageIcon,
  Download,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  getCredenciadosDisponiveisNomes,
  getSinistrosStore,
  getVistoriasVinculadasStore,
} from "@/lib/business-rules-store";

type LifecycleTab =
  | "pendentes_vinculo"
  | "em_andamento"
  | "em_analise"
  | "concluidas";

interface InspecaoData {
  id: string;
  sinistroId: string;
  credenciado: string;
  local: string;
  data: string;
  hora: string;
  status: "pendente" | "agendada" | "realizada";
  startedAt?: string;
  veiculo: string;
  placa: string;
  cliente: string;
  tipoDano?: string;
  aprovada?: boolean;
  aiFraudRisk?: boolean;
  aiRiskReason?: string;
  laudo?: string;
  pdfLaudoUrl?: string;
  audios?: {
    id: string;
    nome: string;
    url: string;
    transcricao: string;
  }[];
  imagens?: {
    id: string;
    nome: string;
    url: string;
  }[];
  descricaoArtigos?: string;
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
    startedAt: "2026-04-15T14:30:00",
    veiculo: "Honda Civic",
    placa: "ABC-1234",
    cliente: "João Silva",
    tipoDano: "Dano em lateral esquerda",
    aprovada: false,
    aiFraudRisk: false,
    laudo:
      "Veículo com avaria na lateral esquerda, incluindo amassamento e risco profundo na porta dianteira. Não foram identificados indícios de danos estruturais no monobloco. Reparo recomendado: funilaria, pintura e alinhamento da porta.",
    pdfLaudoUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    audios: [
      {
        id: "AUD-001",
        nome: "Áudio do vistoriador",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        transcricao:
          "Iniciando vistoria do veículo Honda Civic placa ABC-1234. Constatado dano na porta dianteira esquerda com necessidade de reparo de funilaria.",
      },
      {
        id: "AUD-002",
        nome: "Relato do segurado",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        transcricao:
          "O impacto ocorreu durante manobra de estacionamento. O veículo estava em baixa velocidade no momento da colisão.",
      },
    ],
    imagens: [
      {
        id: "IMG-001",
        nome: "Lateral esquerda",
        url: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "IMG-002",
        nome: "Porta dianteira",
        url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
      },
    ],
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
    startedAt: "2026-04-11T10:00:00",
    veiculo: "Toyota Corolla",
    placa: "XYZ-5678",
    cliente: "Maria Santos",
    tipoDano: "Quebra total de vidro traseiro",
    aprovada: false,
    aiFraudRisk: true,
    aiRiskReason: "⚠️ Risco de Fraude: divergência entre áudio e imagens",
    laudo:
      "Quebra integral do vidro traseiro com estilhaçamento interno. Não há comprometimento de lanternas ou estrutura de tampa do porta-malas. Reparo recomendado: substituição de vidro e limpeza técnica interna.",
    pdfLaudoUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    audios: [
      {
        id: "AUD-003",
        nome: "Registro da oficina",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        transcricao:
          "Vidro traseiro do Toyota Corolla encontra-se totalmente comprometido. Serviço de substituição pode ser realizado no mesmo dia.",
      },
    ],
    imagens: [
      {
        id: "IMG-003",
        nome: "Vidro traseiro",
        url: "https://images.unsplash.com/photo-1605515298946-d057f8f06cf7?auto=format&fit=crop&w=1200&q=80",
      },
    ],
    descricaoArtigos: "Vidro traseiro quebrado",
    observacoes: "Vistoria realizada com sucesso. Cliente presente.",
  },
  {
    id: "VST-003",
    sinistroId: "CLM-125",
    credenciado: "",
    local: "Rua do Comércio, 789 - Belo Horizonte, MG",
    data: "2026-04-20",
    hora: "09:00",
    status: "pendente",
    veiculo: "VW Golf",
    placa: "DEF-9012",
    cliente: "Carlos Mendes",
    tipoDano: "Avaria em para-choque dianteiro",
    aprovada: false,
    aiFraudRisk: false,
  },
  {
    id: "VST-004",
    sinistroId: "CLM-112",
    credenciado: "AutoPrime Reparos",
    local: "Limeira - SP",
    data: "2026-04-10",
    hora: "08:00",
    status: "realizada",
    startedAt: "2026-04-09T08:00:00",
    veiculo: "Nissan Kicks",
    placa: "YZA-7890",
    cliente: "Fernanda Rocha",
    tipoDano: "Dano em suspensão dianteira",
    aprovada: true,
    aiFraudRisk: false,
    pdfLaudoUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    laudo: "Laudo aprovado sem divergências. Reparo autorizado.",
  },
];

export default function VistoriaPage() {
  const [inspecoes, setInspecoes] = useState<InspecaoData[]>(mockInspecoes);
  const [credenciadosDisponiveis, setCredenciadosDisponiveis] = useState<
    string[]
  >([]);
  const [sinistrosDisponiveis, setSinistrosDisponiveis] = useState<
    { id: string; veiculo: string; placa: string; cliente: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<LifecycleTab>("pendentes_vinculo");
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [selectedInspecao, setSelectedInspecao] = useState<InspecaoData | null>(
    null,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nextId, setNextId] = useState(4);
  const [formData, setFormData] = useState({
    sinistroId: "",
    credenciado: "",
    status: "agendada" as "agendada" | "realizada" | "pendente",
  });

  useEffect(() => {
    const syncCredenciados = () => {
      setCredenciadosDisponiveis(getCredenciadosDisponiveisNomes());
    };

    const syncVistoriasVinculadas = () => {
      const vinculadas = getVistoriasVinculadasStore();

      setInspecoes((currentInspecoes) => {
        const updatedInspecoes = [...currentInspecoes];

        vinculadas.forEach((vinculada) => {
          const existingIndex = updatedInspecoes.findIndex(
            (inspecao) => inspecao.sinistroId === vinculada.sinistroId,
          );

          if (existingIndex >= 0) {
            updatedInspecoes[existingIndex] = {
              ...updatedInspecoes[existingIndex],
              credenciado: vinculada.credenciado,
              status: vinculada.status,
              veiculo: vinculada.veiculo,
              placa: vinculada.placa,
              cliente:
                updatedInspecoes[existingIndex].cliente ||
                vinculada.cliente ||
                "Não informado",
            };
            return;
          }

          updatedInspecoes.push({
            id: `VST-LNK-${vinculada.sinistroId}`,
            sinistroId: vinculada.sinistroId,
            credenciado: vinculada.credenciado,
            local: "",
            data: "",
            hora: "",
            status: vinculada.status,
            startedAt: new Date().toISOString(),
            veiculo: vinculada.veiculo,
            placa: vinculada.placa,
            cliente: vinculada.cliente || "Não informado",
            tipoDano: "Dano em análise",
            aprovada: false,
            aiFraudRisk: false,
            observacoes:
              "Vistoria vinculada automaticamente pelo menu de Sinistros.",
          });
        });

        return updatedInspecoes;
      });
    };

    const syncSinistros = () => {
      const sinistros = getSinistrosStore();
      setSinistrosDisponiveis(
        sinistros.map((sinistro) => ({
          id: sinistro.id,
          veiculo: sinistro.vehicle,
          placa: sinistro.plate,
          cliente: "Não informado",
        })),
      );
    };

    syncCredenciados();
    syncSinistros();
    syncVistoriasVinculadas();

    window.addEventListener("argos:credenciados-updated", syncCredenciados);
    window.addEventListener("argos:sinistros-updated", syncSinistros);
    window.addEventListener(
      "argos:vistorias-vinculadas-updated",
      syncVistoriasVinculadas,
    );

    return () => {
      window.removeEventListener(
        "argos:credenciados-updated",
        syncCredenciados,
      );
      window.removeEventListener("argos:sinistros-updated", syncSinistros);
      window.removeEventListener(
        "argos:vistorias-vinculadas-updated",
        syncVistoriasVinculadas,
      );
    };
  }, []);

  useEffect(() => {
    setIsTabLoading(true);

    const timeout = window.setTimeout(() => {
      setIsTabLoading(false);
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [activeTab]);

  const getLifecycleForInspecao = (inspecao: InspecaoData): LifecycleTab => {
    if (!inspecao.credenciado?.trim()) {
      return "pendentes_vinculo";
    }

    if (inspecao.status !== "realizada") {
      return "em_andamento";
    }

    if (inspecao.aprovada) {
      return "concluidas";
    }

    return "em_analise";
  };

  const tabsCount = useMemo(
    () => ({
      pendentes_vinculo: inspecoes.filter(
        (inspecao) => getLifecycleForInspecao(inspecao) === "pendentes_vinculo",
      ).length,
      em_andamento: inspecoes.filter(
        (inspecao) => getLifecycleForInspecao(inspecao) === "em_andamento",
      ).length,
      em_analise: inspecoes.filter(
        (inspecao) => getLifecycleForInspecao(inspecao) === "em_analise",
      ).length,
      concluidas: inspecoes.filter(
        (inspecao) => getLifecycleForInspecao(inspecao) === "concluidas",
      ).length,
    }),
    [inspecoes],
  );

  const filteredByTabAndSearch = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return inspecoes.filter((inspecao) => {
      const lifecycle = getLifecycleForInspecao(inspecao);
      const matchesTab = lifecycle === activeTab;

      if (!matchesTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        inspecao.sinistroId,
        inspecao.veiculo,
        inspecao.cliente,
        inspecao.credenciado,
        inspecao.placa,
        inspecao.tipoDano,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [inspecoes, activeTab, searchQuery]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "realizada":
        return {
          label: "Realizada",
          color:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
          icon: CheckCircle2,
        };
      case "agendada":
        return {
          label: "Agendada",
          color:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          icon: Calendar,
        };
      default:
        return {
          label: "Pendente",
          color:
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
          icon: AlertTriangle,
        };
    }
  };

  const formatarDataHora = (data?: string, hora?: string) => {
    if (!data || !hora) return "Não informado";
    const dataConvertida = new Date(data);
    if (Number.isNaN(dataConvertida.getTime())) return "Não informado";
    return `${dataConvertida.toLocaleDateString("pt-BR")} às ${hora}`;
  };

  const handleCreateVistoria = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sinistroId || !formData.credenciado) {
      alert("Selecione o sinistro e o credenciado");
      return;
    }

    // Encontrar dados do sinistro
    const sinistroInfo = sinistrosDisponiveis.find(
      (s) => s.id === formData.sinistroId,
    );
    if (!sinistroInfo) {
      alert("Sinistro não encontrado");
      return;
    }

    // Verificar se já existe vistoria para este sinistro
    const jaPossuiVistoria = inspecoes.some(
      (i) => i.sinistroId === formData.sinistroId,
    );
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
      startedAt: new Date().toISOString(),
      status: formData.status,
      veiculo: sinistroInfo.veiculo,
      placa: sinistroInfo.placa,
      cliente: sinistroInfo.cliente,
      tipoDano: "Dano em análise",
      aprovada: false,
      aiFraudRisk: false,
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

  const getElapsedTimeLabel = (inspecao: InspecaoData) => {
    const fallbackFromDate =
      inspecao.data && inspecao.hora ? `${inspecao.data}T${inspecao.hora}` : "";
    const rawStart = inspecao.startedAt || fallbackFromDate;

    if (!rawStart) {
      return "Sem início registrado";
    }

    const startDate = new Date(rawStart);

    if (Number.isNaN(startDate.getTime())) {
      return "Sem início registrado";
    }

    const diffMs = Date.now() - startDate.getTime();
    const totalHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days > 0) {
      return `${days}d ${hours}h corridos`;
    }

    return `${hours}h corridas`;
  };

  const renderTabSkeleton = () => {
    if (filteredByTabAndSearch.length === 0) {
      return renderEmptyState("pendentes_vinculo");
    }
  };

  const renderEmptyState = (tab: LifecycleTab) => {
    const configs: Record<
      LifecycleTab,
      { title: string; description: string; icon: React.ReactNode }
    > = {
      pendentes_vinculo: {
        title: "Sem vistorias pendentes de vínculo",
        description:
          "Todas as vistorias desta busca já possuem oficina vinculada ou não há itens nesta etapa.",
        icon: <AlertTriangle className="h-5 w-5" />,
      },
      em_andamento: {
        title: "Nenhuma vistoria em andamento",
        description:
          "No momento não existem vistorias sendo executadas na oficina para os filtros aplicados.",
        icon: <Timer className="h-5 w-5" />,
      },
      em_analise: {
        title: "Nenhuma vistoria em análise",
        description:
          "Não há laudos pendentes de revisão técnica/IA nesta seleção.",
        icon: <FileText className="h-5 w-5" />,
      },
      concluidas: {
        title: "Nenhuma vistoria concluída",
        description:
          "Não existem vistorias aprovadas com laudo final disponível para download.",
        icon: <CheckCircle2 className="h-5 w-5" />,
      },
    };

    const config = configs[tab];

    return (
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">{config.icon}</EmptyMedia>
              <EmptyTitle>{config.title}</EmptyTitle>
              <EmptyDescription>{config.description}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        </CardContent>
      </Card>
    );
  };

  const renderInspectionCards = (tab: LifecycleTab) => {
    if (filteredByTabAndSearch.length === 0) {
      return renderEmptyState(tab);
    }

    return (
      <div className="space-y-3">
        {filteredByTabAndSearch.map((inspecao) => {
          const statusConfig = getStatusConfig(inspecao.status);
          const StatusIcon = statusConfig.icon;
          const showIaRiskHighlight =
            tab === "em_analise" && Boolean(inspecao.aiFraudRisk);

          return (
            <Card
              key={inspecao.id}
              className={cn(
                "transition-shadow hover:shadow-md",
                showIaRiskHighlight &&
                  "border-red-300 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/10",
              )}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-semibold">
                            {inspecao.sinistroId}
                          </span>
                          <Badge
                            className={cn(
                              "inline-flex gap-1",
                              statusConfig.color,
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                          {showIaRiskHighlight && (
                            <Badge variant="destructive">
                              ⚠️ Risco de Fraude
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {inspecao.veiculo} • {inspecao.placa}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>
                          {inspecao.credenciado || "Aguardando vínculo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{inspecao.local || "Local não informado"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatarDataHora(inspecao.data, inspecao.hora)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Cliente:
                        </span>
                        <span>{inspecao.cliente}</span>
                      </div>
                      {tab === "em_andamento" && (
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                          <Timer className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Tempo corrido: {getElapsedTimeLabel(inspecao)}
                          </span>
                        </div>
                      )}
                      {tab === "em_analise" && inspecao.aiRiskReason && (
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">
                          {inspecao.aiRiskReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="w-full sm:w-auto">
                    {tab === "concluidas" ? (
                      <Button
                        asChild
                        className="w-full gap-2 sm:w-auto"
                        variant="outline"
                        disabled={!inspecao.pdfLaudoUrl}
                      >
                        <a
                          href={inspecao.pdfLaudoUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="h-4 w-4" />
                          Baixar PDF
                        </a>
                      </Button>
                    ) : tab === "em_analise" ? (
                      <Button
                        className="w-full gap-2 sm:w-auto"
                        onClick={() => setSelectedInspecao(inspecao)}
                      >
                        <Eye className="h-4 w-4" />
                        Revisar Laudo e IA
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full gap-2 sm:w-auto"
                        onClick={() => setSelectedInspecao(inspecao)}
                      >
                        <Eye className="h-4 w-4" />
                        Detalhes
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes de vínculo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tabsCount.pendentes_vinculo}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em andamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tabsCount.em_andamento}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em análise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tabsCount.em_analise}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tabsCount.concluidas}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Lifecycle de Vistorias
            </CardTitle>
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por sinistro, veículo, placa, cliente, tipo de dano ou oficina..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as LifecycleTab)}
              className="space-y-4"
            >
              <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                <TabsTrigger
                  value="pendentes_vinculo"
                  className="h-9 rounded-md border border-border bg-muted/40 px-3"
                >
                  Pendentes de Vínculo ({tabsCount.pendentes_vinculo})
                </TabsTrigger>
                <TabsTrigger
                  value="em_andamento"
                  className="h-9 rounded-md border border-border bg-muted/40 px-3"
                >
                  Em Andamento ({tabsCount.em_andamento})
                </TabsTrigger>
                <TabsTrigger
                  value="em_analise"
                  className="h-9 rounded-md border border-border bg-muted/40 px-3"
                >
                  Em Análise ({tabsCount.em_analise})
                </TabsTrigger>
                <TabsTrigger
                  value="concluidas"
                  className="h-9 rounded-md border border-border bg-muted/40 px-3"
                >
                  Concluídas ({tabsCount.concluidas})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pendentes_vinculo" className="mt-0">
                {renderInspectionCards("pendentes_vinculo")}
              </TabsContent>
              <TabsContent value="em_andamento" className="mt-0">
                {renderInspectionCards("em_andamento")}
              </TabsContent>
              <TabsContent value="em_analise" className="mt-0">
                {renderInspectionCards("em_analise")}
              </TabsContent>
              <TabsContent value="concluidas" className="mt-0">
                {renderInspectionCards("concluidas")}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes */}
      <Dialog
        open={!!selectedInspecao}
        onOpenChange={() => setSelectedInspecao(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Vistoria {selectedInspecao?.id}
            </DialogTitle>
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
                  <p className="text-sm font-medium">
                    {selectedInspecao.veiculo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedInspecao.placa}
                  </p>
                </div>

                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Cliente
                  </p>
                  <p className="text-sm font-medium">
                    {selectedInspecao.cliente}
                  </p>
                </div>

                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Credenciado
                  </p>
                  <p className="text-sm font-medium">
                    {selectedInspecao.credenciado}
                  </p>
                </div>

                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Local
                  </p>
                  <p className="text-sm font-medium">
                    {selectedInspecao.local}
                  </p>
                </div>

                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Data e Hora
                  </p>
                  <p className="text-sm font-medium">
                    {formatarDataHora(
                      selectedInspecao.data,
                      selectedInspecao.hora,
                    )}
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
                  <p className="text-sm text-foreground">
                    {selectedInspecao.descricaoArtigos}
                  </p>
                </div>
              )}

              {selectedInspecao.observacoes && (
                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Observações
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedInspecao.observacoes}
                  </p>
                </div>
              )}

              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Laudo técnico
                  </p>
                </div>
                <p className="text-sm text-foreground">
                  {selectedInspecao.laudo ||
                    "Laudo ainda não anexado para esta vistoria."}
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Laudo em PDF
                    </p>
                  </div>
                  {selectedInspecao.pdfLaudoUrl && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <a
                        href={selectedInspecao.pdfLaudoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir PDF
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  {selectedInspecao.pdfLaudoUrl
                    ? "Clique em 'Abrir PDF' para visualizar o documento."
                    : "PDF não disponível."}
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <FileAudio className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Áudios e transcrições
                  </p>
                </div>

                {selectedInspecao.audios?.length ? (
                  selectedInspecao.audios.map((audio) => (
                    <div
                      key={audio.id}
                      className="space-y-2 rounded-md border border-border/60 bg-background p-3"
                    >
                      <p className="text-sm font-medium">{audio.nome}</p>
                      <audio controls className="w-full">
                        <source src={audio.url} type="audio/mpeg" />
                        Seu navegador não suporta reprodução de áudio.
                      </audio>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Transcrição
                        </p>
                        <p className="text-sm text-foreground">
                          {audio.transcricao}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum áudio anexado.
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Imagens
                  </p>
                </div>

                {selectedInspecao.imagens?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedInspecao.imagens.map((imagem) => (
                      <a
                        key={imagem.id}
                        href={imagem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group overflow-hidden rounded-md border border-border/60 bg-background"
                      >
                        <img
                          src={imagem.url}
                          alt={imagem.nome}
                          className="h-36 w-full object-cover transition-transform group-hover:scale-[1.02]"
                        />
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          {imagem.nome}
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma imagem anexada.
                  </p>
                )}
              </div>
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
                    .filter(
                      (s) => !inspecoes.some((i) => i.sinistroId === s.id),
                    )
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
                  {credenciadosDisponiveis.map((credenciado) => (
                    <SelectItem key={credenciado} value={credenciado}>
                      {credenciado}
                    </SelectItem>
                  ))}
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

      {/* Overlay de carregamento */}
      {isTabLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="flex flex-col items-center gap-6 rounded-lg bg-white p-8 shadow-lg">
            {/* Logo ARGOS */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                <Image
                  src="/icon.svg"
                  alt="ARGOS"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              </div>
              <span className="text-lg font-bold text-foreground">ARGOS</span>
            </div>

            {/* Spinner */}
            <svg
              className="h-6 w-6 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>

            {/* Message */}
            <span className="text-sm text-muted-foreground">
              Carregando vistorias...
            </span>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
