"use client";

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
  FileText,
  FileAudio,
  Image as ImageIcon,
  Download,
  ExternalLink,
  BrainCircuit,
  ClipboardCheck,
  XCircle,
  Activity,
  MessageSquare,
  Bot,
  User,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  getVistoriasVinculadasStore,
} from "@/lib/business-rules-store";

type VistoriaStatus =
  | "EM_ANDAMENTO"
  | "EM_ANALISE_IA"
  | "EM_ANALISE_OPERACIONAL"
  | "FINALIZADA"
  | "REJEITADA";

type LifecycleTab = VistoriaStatus;

interface InspecaoData {
  id: string;
  sinistroId: string;
  credenciado: string;
  local: string;
  data: string;
  hora: string;
  status: VistoriaStatus;
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
  descricaoArtigos?: string;
  observacoes?: string;
  alertas?: string; // IA alert message
  motivoRejeicao?: string; // rejection reason
  // Firestore real data fields
  idvistoria?: string;
  chatmessages?: {
    id: string;
    role: "ai" | "user" | "photo";
    text: string;
    createdAt?: string;
  }[];
  images?: {
    id: string;
    fileName?: string;
    contentType: string;
    vistoria_1?: string; // base64
    vistoria_2?: string; // base64 fallback
    createdAt?: string;
  }[];
  audios?: {
    id: string;
    fileName?: string;
    contentType: string;
    vistoria_1?: string; // base64
    createdAt?: string;
    // legacy mock fields
    nome?: string;
    url?: string;
    transcricao?: string;
  }[];
}

const mockInspecoes: InspecaoData[] = [
  {
    id: "VST-001",
    sinistroId: "CLM-127",
    credenciado: "Auto Center Premium",
    local: "Av. Paulista, 1000 - São Paulo, SP",
    data: "2026-04-15",
    hora: "14:30",
    status: "EM_ANDAMENTO",
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
    chatmessages: [
      {
        id: "msg-1",
        role: "ai",
        text: "Vistoria iniciada. Aguardando envio das primeiras fotos do veículo.",
        createdAt: "2026-04-15T14:31:00",
      },
      {
        id: "msg-2",
        role: "user",
        text: "Fotos da lateral esquerda enviadas. Dano visível na porta dianteira.",
        createdAt: "2026-04-15T14:35:00",
      },
      {
        id: "msg-3",
        role: "ai",
        text: "Imagens recebidas. Detectado amassamento na porta dianteira esquerda. Nenhuma anomalia de fraude identificada. Reparo de funilaria recomendado.",
        createdAt: "2026-04-15T14:36:00",
      },
      {
        id: "msg-4",
        role: "photo",
        text: "Foto adicional da roda dianteira enviada pelo perito.",
        createdAt: "2026-04-15T14:40:00",
      },
    ],
    images: [
      {
        id: "IMG-001",
        fileName: "lateral_esquerda.jpg",
        contentType: "image/jpeg",
        vistoria_1: "/9j/4AAQSkZJRgAB", // placeholder, real base64 would be here
        createdAt: "2026-04-15T14:35:00",
      },
    ],
    audios: [
      {
        id: "AUD-001",
        fileName: "audio_vistoriador.mp3",
        contentType: "audio/mpeg",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        nome: "Áudio do vistoriador",
        transcricao:
          "Iniciando vistoria do veículo Honda Civic placa ABC-1234. Constatado dano na porta dianteira esquerda com necessidade de reparo de funilaria.",
        createdAt: "2026-04-15T14:32:00",
      },
      {
        id: "AUD-002",
        fileName: "relato_segurado.mp3",
        contentType: "audio/mpeg",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        nome: "Relato do segurado",
        transcricao:
          "O impacto ocorreu durante manobra de estacionamento. O veículo estava em baixa velocidade no momento da colisão.",
        createdAt: "2026-04-15T14:38:00",
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
    status: "EM_ANALISE_IA",
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
    chatmessages: [
      {
        id: "msg-a",
        role: "ai",
        text: "Vistoria iniciada. Perito conectado ao sistema.",
        createdAt: "2026-04-12T09:55:00",
      },
      {
        id: "msg-b",
        role: "photo",
        text: "Foto do vidro traseiro enviada pelo credenciado.",
        createdAt: "2026-04-12T10:02:00",
      },
      {
        id: "msg-c",
        role: "ai",
        text: "⚠️ Alerta de risco de fraude detectado: divergência entre o relato em áudio e as imagens enviadas. Encaminhando para análise operacional.",
        createdAt: "2026-04-12T10:03:00",
      },
    ],
    audios: [
      {
        id: "AUD-003",
        fileName: "registro_oficina.mp3",
        contentType: "audio/mpeg",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        nome: "Registro da oficina",
        transcricao:
          "Vidro traseiro do Toyota Corolla encontra-se totalmente comprometido. Serviço de substituição pode ser realizado no mesmo dia.",
        createdAt: "2026-04-12T10:00:00",
      },
    ],
    images: [
      {
        id: "IMG-003",
        fileName: "vidro_traseiro.jpg",
        contentType: "image/jpeg",
        vistoria_1: "/9j/4AAQSkZJRgAB", // placeholder
        createdAt: "2026-04-12T10:02:00",
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
    status: "EM_ANALISE_OPERACIONAL",
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
    status: "FINALIZADA",
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<LifecycleTab>("EM_ANDAMENTO");
  const [isTabLoading, setIsTabLoading] = useState(true);
  const [selectedInspecao, setSelectedInspecao] = useState<InspecaoData | null>(
    null,
  );
  const [accordionState, setAccordionState] = useState({
    laudo: true,
    chat: false,
    imagens: false,
    audios: false,
  });
  const [chatMessages, setChatMessages] = useState<
    InspecaoData["chatmessages"]
  >([]);

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
              status: (vinculada.status as VistoriaStatus) ?? "EM_ANDAMENTO",
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
            status: (vinculada.status as VistoriaStatus) ?? "EM_ANDAMENTO",
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

    syncCredenciados();
    syncVistoriasVinculadas();

    window.addEventListener("argos:credenciados-updated", syncCredenciados);
    window.addEventListener(
      "argos:vistorias-vinculadas-updated",
      syncVistoriasVinculadas,
    );

    return () => {
      window.removeEventListener(
        "argos:credenciados-updated",
        syncCredenciados,
      );
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

  // Sincronizar mensagens do chat quando selectedInspecao muda
  useEffect(() => {
    if (selectedInspecao?.chatmessages) {
      setChatMessages([...selectedInspecao.chatmessages]);
    } else {
      setChatMessages([]);
    }
  }, [selectedInspecao?.id]);

  const getLifecycleForInspecao = (inspecao: InspecaoData): LifecycleTab => {
    return inspecao.status;
  };

  const tabsCount = useMemo(
    () => ({
      EM_ANDAMENTO: inspecoes.filter(
        (i) => getLifecycleForInspecao(i) === "EM_ANDAMENTO",
      ).length,
      EM_ANALISE_IA: inspecoes.filter(
        (i) => getLifecycleForInspecao(i) === "EM_ANALISE_IA",
      ).length,
      EM_ANALISE_OPERACIONAL: inspecoes.filter(
        (i) => getLifecycleForInspecao(i) === "EM_ANALISE_OPERACIONAL",
      ).length,
      FINALIZADA: inspecoes.filter(
        (i) => getLifecycleForInspecao(i) === "FINALIZADA",
      ).length,
      REJEITADA: inspecoes.filter(
        (i) => getLifecycleForInspecao(i) === "REJEITADA",
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

  const getStatusConfig = (status: VistoriaStatus) => {
    switch (status) {
      case "EM_ANDAMENTO":
        return {
          label: "Em Andamento",
          color:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
          icon: Activity,
          kpiColor: "text-blue-600 dark:text-blue-400",
          kpiIconBg: "bg-blue-100 dark:bg-blue-900/30",
        };
      case "EM_ANALISE_IA":
        return {
          label: "Análise IA",
          color:
            "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
          icon: BrainCircuit,
          kpiColor: "text-violet-600 dark:text-violet-400",
          kpiIconBg: "bg-violet-100 dark:bg-violet-900/30",
        };
      case "EM_ANALISE_OPERACIONAL":
        return {
          label: "Análise Operacional",
          color:
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
          icon: ClipboardCheck,
          kpiColor: "text-amber-600 dark:text-amber-400",
          kpiIconBg: "bg-amber-100 dark:bg-amber-900/30",
        };
      case "FINALIZADA":
        return {
          label: "Finalizada",
          color:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
          icon: CheckCircle2,
          kpiColor: "text-emerald-600 dark:text-emerald-400",
          kpiIconBg: "bg-emerald-100 dark:bg-emerald-900/30",
        };
      case "REJEITADA":
        return {
          label: "Rejeitada",
          color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
          icon: XCircle,
          kpiColor: "text-red-600 dark:text-red-400",
          kpiIconBg: "bg-red-100 dark:bg-red-900/30",
        };
    }
  };

  const formatarDataHora = (data?: string, hora?: string) => {
    if (!data || !hora) return "Não informado";
    const dataConvertida = new Date(data);
    if (Number.isNaN(dataConvertida.getTime())) return "Não informado";
    return `${dataConvertida.toLocaleDateString("pt-BR")} às ${hora}`;
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
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`vistoria-skeleton-${index}`}>
            <CardContent className="pt-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-28 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-44" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-24 rounded-md" />
                  <Skeleton className="h-9 w-24 rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderEmptyState = (tab: LifecycleTab) => {
    const configs: Record<
      LifecycleTab,
      { title: string; description: string; icon: React.ReactNode }
    > = {
      EM_ANDAMENTO: {
        title: "Nenhuma vistoria em andamento",
        description:
          "No momento não há vistorias com status Em Andamento para os filtros aplicados.",
        icon: <Activity className="h-5 w-5" />,
      },
      EM_ANALISE_IA: {
        title: "Nenhuma vistoria em análise pela IA",
        description:
          "Não há vistorias aguardando análise do motor de inteligência artificial.",
        icon: <BrainCircuit className="h-5 w-5" />,
      },
      EM_ANALISE_OPERACIONAL: {
        title: "Nenhuma vistoria em análise operacional",
        description:
          "Não há vistorias aguardando revisão técnica da equipe operacional.",
        icon: <ClipboardCheck className="h-5 w-5" />,
      },
      FINALIZADA: {
        title: "Nenhuma vistoria finalizada",
        description:
          "Não existem vistorias finalizadas com laudo disponível para esta seleção.",
        icon: <CheckCircle2 className="h-5 w-5" />,
      },
      REJEITADA: {
        title: "Nenhuma vistoria rejeitada",
        description:
          "Não há vistorias com status rejeitado para os filtros aplicados.",
        icon: <XCircle className="h-5 w-5" />,
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
            tab === "EM_ANALISE_IA" && Boolean(inspecao.aiFraudRisk);

          return (
            <div
              key={inspecao.id}
              className={cn(
                "group rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60",
                showIaRiskHighlight
                  ? "border-red-300 bg-red-50/60 dark:border-red-800/60 dark:bg-red-950/20"
                  : "border-slate-200",
              )}
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                {/* Left: identity info */}
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold tracking-tight text-foreground">
                      {inspecao.sinistroId}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {inspecao.veiculo} &bull; {inspecao.placa}
                    </span>
                    <Badge
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                        statusConfig.color,
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </Badge>
                    {showIaRiskHighlight && (
                      <Badge variant="destructive" className="rounded-full">
                        ⚠️ Risco de Fraude
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {inspecao.credenciado || "Aguardando vínculo"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatarDataHora(inspecao.data, inspecao.hora)}
                    </span>
                    {inspecao.local && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {inspecao.local}
                      </span>
                    )}
                    {tab === "EM_ANDAMENTO" && (
                      <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                        <Timer className="h-3.5 w-3.5" />
                        {getElapsedTimeLabel(inspecao)}
                      </span>
                    )}
                  </div>

                  {tab === "EM_ANALISE_IA" && inspecao.aiRiskReason && (
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {inspecao.aiRiskReason}
                    </p>
                  )}
                </div>

                {/* Right: action button */}
                <div className="flex shrink-0 items-center">
                  {tab === "FINALIZADA" ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
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
                  ) : tab === "EM_ANALISE_IA" ||
                    tab === "EM_ANALISE_OPERACIONAL" ? (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setSelectedInspecao(inspecao)}
                    >
                      <Eye className="h-4 w-4" />
                      Revisar Laudo
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setSelectedInspecao(inspecao)}
                    >
                      <Eye className="h-4 w-4" />
                      Detalhes
                    </Button>
                  )}
                </div>
              </div>
            </div>
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

        {/* Stats Cards — cada card funciona como filtro ativo */}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {(
            [
              ["EM_ANDAMENTO", tabsCount.EM_ANDAMENTO],
              ["EM_ANALISE_IA", tabsCount.EM_ANALISE_IA],
              ["EM_ANALISE_OPERACIONAL", tabsCount.EM_ANALISE_OPERACIONAL],
              ["FINALIZADA", tabsCount.FINALIZADA],
              ["REJEITADA", tabsCount.REJEITADA],
            ] as [VistoriaStatus, number][]
          ).map(([status, count]) => {
            const cfg = getStatusConfig(status);
            const Icon = cfg.icon;
            const isActive = activeTab === status;
            const ringMap: Record<VistoriaStatus, string> = {
              EM_ANDAMENTO: "ring-blue-500",
              EM_ANALISE_IA: "ring-violet-500",
              EM_ANALISE_OPERACIONAL: "ring-amber-500",
              FINALIZADA: "ring-emerald-500",
              REJEITADA: "ring-red-500",
            };
            return (
              <button
                key={status}
                type="button"
                onClick={() => setActiveTab(status)}
                className={cn(
                  "flex cursor-pointer flex-col gap-3 rounded-xl border p-4 text-left shadow-sm transition-all hover:scale-[1.02] hover:shadow-md dark:bg-slate-800/60",
                  isActive
                    ? cn(
                        "ring-2 ring-offset-2 dark:ring-offset-slate-900",
                        ringMap[status],
                        "border-transparent bg-white dark:bg-slate-800",
                      )
                    : "border-slate-200 bg-white opacity-70 hover:opacity-100 dark:border-slate-700 dark:bg-slate-800/40",
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {cfg.label}
                  </p>
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      cfg.kpiIconBg,
                    )}
                  >
                    <Icon className={cn("h-4 w-4", cfg.kpiColor)} />
                  </span>
                </div>
                <p className={cn("text-3xl font-bold", cfg.kpiColor)}>
                  {count}
                </p>
              </button>
            );
          })}
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Vistorias</CardTitle>
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
            {isTabLoading
              ? renderTabSkeleton()
              : renderInspectionCards(activeTab)}
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
            <DialogTitle className="flex items-center gap-2 text-lg">
              {selectedInspecao?.idvistoria || selectedInspecao?.id}
              {selectedInspecao && (
                <Badge
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                    getStatusConfig(selectedInspecao.status).color,
                  )}
                >
                  {(() => {
                    const cfg = getStatusConfig(selectedInspecao.status);
                    const Icon = cfg.icon;
                    return (
                      <>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </>
                    );
                  })()}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Referente ao sinistro:{" "}
              <span className="font-semibold text-foreground underline decoration-dashed underline-offset-2">
                {selectedInspecao?.sinistroId}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedInspecao && (
            <div className="space-y-5">
              {/* ── Banner: Alerta IA ── */}
              {selectedInspecao.alertas && (
                <div className="flex gap-3 rounded-r-xl border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-yellow-700 dark:text-yellow-400">
                      Alerta da IA
                    </p>
                    <p className="mt-0.5 text-sm text-yellow-800 dark:text-yellow-200">
                      {selectedInspecao.alertas}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Banner: Motivo de Rejeição ── */}
              {selectedInspecao.status === "REJEITADA" &&
                selectedInspecao.motivoRejeicao && (
                  <div className="flex gap-3 rounded-r-xl border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
                        Motivo de Rejeição
                      </p>
                      <p className="mt-0.5 text-sm text-red-800 dark:text-red-200">
                        {selectedInspecao.motivoRejeicao}
                      </p>
                    </div>
                  </div>
                )}

              {/* ── Info grid ── */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: "Veículo",
                    value: selectedInspecao.veiculo,
                    sub: selectedInspecao.placa,
                  },
                  { label: "Cliente", value: selectedInspecao.cliente },
                  {
                    label: "Credenciado",
                    value: selectedInspecao.credenciado || "Aguardando vínculo",
                  },
                  ...(selectedInspecao.local
                    ? [{ label: "Local", value: selectedInspecao.local }]
                    : []),
                  ...(selectedInspecao.data && selectedInspecao.hora
                    ? [
                        {
                          label: "Data e Hora",
                          value: formatarDataHora(
                            selectedInspecao.data,
                            selectedInspecao.hora,
                          ),
                        },
                      ]
                    : []),
                  ...(selectedInspecao.descricaoArtigos
                    ? [
                        {
                          label: "Descrição de Artigos",
                          value: selectedInspecao.descricaoArtigos,
                        },
                      ]
                    : []),
                  ...(selectedInspecao.observacoes
                    ? [
                        {
                          label: "Observações",
                          value: selectedInspecao.observacoes,
                        },
                      ]
                    : []),
                ].map(({ label, value, sub }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
                  >
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {value}
                    </p>
                    {sub && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {sub}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* ── Accordion: Laudo da Vistoria ── */}
              {selectedInspecao.laudo && (
                <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
                  <button
                    onClick={() =>
                      setAccordionState((prev) => ({
                        ...prev,
                        laudo: !prev.laudo,
                      }))
                    }
                    className="w-full flex items-center justify-between px-5 py-4 transition-all duration-200 ease-in-out cursor-pointer hover:bg-white hover:shadow-md dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <p className="text-[13px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                        Laudo da Vistoria
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 text-slate-400 transition-transform duration-200",
                        accordionState.laudo && "rotate-180",
                      )}
                    />
                  </button>
                  {accordionState.laudo && (
                    <div className="border-t border-border/40 px-4 py-3">
                      <p className="text-sm leading-relaxed text-foreground">
                        {selectedInspecao.laudo}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Accordion: Histórico da Inspeção ── */}
              {selectedInspecao.chatmessages &&
                selectedInspecao.chatmessages.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
                    <button
                      onClick={() =>
                        setAccordionState((prev) => ({
                          ...prev,
                          chat: !prev.chat,
                        }))
                      }
                      className="w-full flex items-center justify-between px-5 py-4 transition-all duration-200 ease-in-out cursor-pointer hover:bg-white hover:shadow-md dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <p className="text-[13px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                          Histórico da Inspeção
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-slate-400 transition-transform duration-200",
                          accordionState.chat && "rotate-180",
                        )}
                      />
                    </button>
                    {accordionState.chat && (
                      <div className="border-t border-border/40 px-4 py-3 flex flex-col gap-3 max-h-96 overflow-y-auto">
                        {/* Chat messages display - two-sided conversation */}
                        <div className="space-y-3">
                          {chatMessages && chatMessages.length > 0 ? (
                            chatMessages.map((msg) => {
                              const isAi = msg.role === "ai";
                              const isPhoto = msg.role === "photo";

                              return (
                                <div
                                  key={msg.id}
                                  className={cn(
                                    "flex gap-2",
                                    isAi || isPhoto
                                      ? "justify-start"
                                      : "justify-end",
                                  )}
                                >
                                  {(isAi || isPhoto) && (
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                      <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                  )}

                                  <div
                                    className={cn(
                                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                                      isAi
                                        ? "rounded-tl-sm bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                                        : isPhoto
                                          ? "rounded-tl-sm bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100"
                                          : "rounded-tr-sm bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
                                    )}
                                  >
                                    <p className="leading-relaxed whitespace-pre-wrap">
                                      {msg.text}
                                    </p>
                                    {msg.createdAt && (
                                      <p className="mt-1 text-[10px] opacity-55">
                                        {new Date(msg.createdAt).toLocaleString(
                                          "pt-BR",
                                        )}
                                      </p>
                                    )}
                                  </div>

                                  {!isAi && !isPhoto && (
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-600">
                                      <User className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-4">
                              Nenhuma mensagem encontrada
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* ── Accordion: Imagens Fotográficas ── */}
              {selectedInspecao.images &&
                selectedInspecao.images.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
                    <button
                      onClick={() =>
                        setAccordionState((prev) => ({
                          ...prev,
                          imagens: !prev.imagens,
                        }))
                      }
                      className="w-full flex items-center justify-between px-5 py-4 transition-all duration-200 ease-in-out cursor-pointer hover:bg-white hover:shadow-md dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <p className="text-[13px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                          Imagens Fotográficas
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-slate-400 transition-transform duration-200",
                          accordionState.imagens && "rotate-180",
                        )}
                      />
                    </button>
                    {accordionState.imagens && (
                      <div className="border-t border-border/40 px-4 py-3">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                          {selectedInspecao.images.map((image) => {
                            const b64 = image.vistoria_1 || image.vistoria_2;
                            if (!b64) return null;
                            const src = `data:${image.contentType};base64,${b64}`;

                            return (
                              <div
                                key={image.id}
                                className="group overflow-hidden rounded-lg shadow-sm"
                              >
                                <img
                                  src={src}
                                  alt={image.fileName || image.id}
                                  className="h-36 w-full rounded-lg object-cover shadow-sm transition-all hover:scale-[1.02]"
                                />
                                {image.fileName && (
                                  <p className="mt-1 truncate px-0.5 text-xs text-muted-foreground">
                                    {image.fileName}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* ── Accordion: Áudios e Transcrições ── */}
              {selectedInspecao.audios &&
                selectedInspecao.audios.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
                    <button
                      onClick={() =>
                        setAccordionState((prev) => ({
                          ...prev,
                          audios: !prev.audios,
                        }))
                      }
                      className="w-full flex items-center justify-between px-5 py-4 transition-all duration-200 ease-in-out cursor-pointer hover:bg-white hover:shadow-md dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <FileAudio className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <p className="text-[13px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                          Áudios e Transcrições
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 text-slate-400 transition-transform duration-200",
                          accordionState.audios && "rotate-180",
                        )}
                      />
                    </button>
                    {accordionState.audios && (
                      <div className="border-t border-border/40 px-4 py-3">
                        <div className="flex flex-col gap-3">
                          {selectedInspecao.audios.map((audio) => {
                            const b64 = audio.vistoria_1;
                            const audioSrc = b64
                              ? `data:${audio.contentType};base64,${b64}`
                              : (audio.url ?? null);

                            if (!audioSrc) return null;

                            return (
                              <div
                                key={audio.id}
                                className="rounded-xl border border-border/60 bg-background p-4 shadow-sm"
                              >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <span className="text-sm font-semibold text-foreground">
                                    {audio.fileName || audio.nome || audio.id}
                                  </span>
                                  {audio.createdAt && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(audio.createdAt).toLocaleString(
                                        "pt-BR",
                                      )}
                                    </span>
                                  )}
                                </div>

                                <audio
                                  controls
                                  src={audioSrc}
                                  className="w-full"
                                />

                                {audio.transcricao && (
                                  <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                      Transcrição
                                    </p>
                                    <p className="mt-1 text-sm italic leading-relaxed text-foreground">
                                      “{audio.transcricao}”
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* ── Rodapé: Ações por Status ── */}
              <div className="flex items-center justify-end border-t border-border/60 pt-4">
                {(selectedInspecao.status === "FINALIZADA" ||
                  selectedInspecao.status === "REJEITADA") &&
                  selectedInspecao.pdfLaudoUrl && (
                    <a
                      href={selectedInspecao.pdfLaudoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Laudo PDF
                    </a>
                  )}
                {selectedInspecao.status === "EM_ANALISE_OPERACIONAL" && (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Aprovar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
