"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  ImageOff,
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
import { useVistoria } from "@/hooks/use-vistoria";
import { useVistoriasList } from "@/hooks/use-vistorias-list";

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

export default function VistoriaPage() {
  const router = useRouter();
  const [inspecoes, setInspecoes] = useState<InspecaoData[]>([]);
  const [credenciadosDisponiveis, setCredenciadosDisponiveis] = useState<
    string[]
  >([]);

  const { vistorias: apiVistorias, isLoading: isListLoading } =
    useVistoriasList();

  // Popula o estado com dados reais do Firestore ao carregar/revalidar
  useEffect(() => {
    if (apiVistorias.length === 0) return;
    setInspecoes(
      apiVistorias.map((v) => ({
        id: v.id,
        sinistroId: v.sinistroId,
        credenciado: v.credenciado,
        local: v.local,
        data: v.data,
        hora: v.hora,
        status: (v.status as VistoriaStatus) ?? "EM_ANDAMENTO",
        startedAt: v.createdAt ?? undefined,
        veiculo: v.veiculo,
        placa: v.placa,
        cliente: v.cliente,
        aprovada: false,
        aiFraudRisk: false,
      })),
    );
  }, [apiVistorias]);
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
    {
      id: string;
      role: string;
      text: string;
      createdAt?: string | null;
    }[]
  >([]);

  const [isNavigating, startNavigating] = useTransition();

  const vistoriaId =
    selectedInspecao?.idvistoria ?? selectedInspecao?.id ?? null;
  const {
    vistoria,
    isLoading: isVistoriaLoading,
    isError: isVistoriaError,
    error: vistoriaError,
  } = useVistoria(vistoriaId);

  const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  };

  const extractMediaLabel = (item: unknown) => {
    if (!isPlainObject(item)) {
      return null;
    }

    const record = item as Record<string, unknown>;
    const labelKeys = [
      "fileName",
      "nome",
      "title",
      "descricao",
      "description",
      "transcricao",
      "id",
    ];

    for (const key of labelKeys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return null;
  };

  const extractMediaDescription = (item: unknown) => {
    if (!isPlainObject(item)) {
      return null;
    }

    const record = item as Record<string, unknown>;
    const descriptionKeys = ["descricao", "description", "transcricao", "text"];

    for (const key of descriptionKeys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return null;
  };

  const getBase64String = (item: unknown): string | null => {
    const sanitize = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      if (/^data:/i.test(trimmed)) {
        const [, base64 = ""] = trimmed.split(",");
        return base64.trim() || null;
      }
      return trimmed;
    };

    if (typeof item === "string") {
      const normalized = sanitize(item);
      if (!normalized) return null;
      return normalized.length > 100 ? normalized : null;
    }

    if (!isPlainObject(item)) {
      return null;
    }

    const record = item as Record<string, unknown>;
    const preferredEntry = Object.entries(record).find(([key, value]) => {
      if (typeof value !== "string") return false;
      const normalizedKey = key.toLowerCase();
      return (
        normalizedKey.includes("vistoria_") || normalizedKey.includes("audio_")
      );
    });

    if (preferredEntry && typeof preferredEntry[1] === "string") {
      return sanitize(preferredEntry[1]);
    }

    const direct = [
      "vistoria_1",
      "vistoria_2",
      "vistoria_3",
      "audio_1",
      "audio_2",
      "audio_3",
      "base64",
      "data",
    ];

    for (const key of direct) {
      const value = record[key];
      if (typeof value === "string") {
        const normalized = sanitize(value);
        if (normalized) return normalized;
      }
    }

    const fallback = Object.values(record).find(
      (value) => typeof value === "string" && value.length > 100,
    );

    return typeof fallback === "string" ? sanitize(fallback) : null;
  };

  const getMediaContentType = (item: unknown, fallback: string) => {
    if (!isPlainObject(item)) {
      return fallback;
    }

    const record = item as Record<string, unknown>;
    const keys = ["contentType", "mimeType", "type"];

    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return fallback;
  };

  const toDataUri = (item: unknown, fallbackContentType: string) => {
    const base64 = getBase64String(item);
    if (!base64) return null;

    const contentType = getMediaContentType(item, fallbackContentType);
    return `data:${contentType};base64,${base64}`;
  };

  const imageItems = useMemo(() => {
    const rawImages = vistoria?.images;
    if (!rawImages) {
      return [] as Array<{
        key: string;
        payload: unknown;
        label: string | null;
      }>;
    }

    if (Array.isArray(rawImages)) {
      return rawImages
        .filter((value) => Boolean(value))
        .map((value, index) => ({
          key: extractMediaLabel(value) ?? `imagem-${index + 1}`,
          payload: value,
          label: extractMediaDescription(value),
        }));
    }

    return Object.entries(rawImages)
      .filter(([, value]) => Boolean(value))
      .map(([key, value], index) => ({
        key: extractMediaLabel(value) ?? (key || `imagem-${index + 1}`),
        payload: value,
        label: extractMediaDescription(value),
      }));
  }, [vistoria?.images]);

  const audioItems = useMemo(() => {
    const rawAudios = vistoria?.audios;
    if (!rawAudios) {
      return [] as Array<{
        key: string;
        payload: unknown;
        label: string | null;
      }>;
    }

    if (Array.isArray(rawAudios)) {
      return rawAudios
        .filter((value) => Boolean(value))
        .map((value, index) => ({
          key: extractMediaLabel(value) ?? `audio-${index + 1}`,
          payload: value,
          label: extractMediaDescription(value),
        }));
    }

    return Object.entries(rawAudios)
      .filter(([, value]) => Boolean(value))
      .map(([key, value], index) => ({
        key: extractMediaLabel(value) ?? (key || `audio-${index + 1}`),
        payload: value,
        label: extractMediaDescription(value),
      }));
  }, [vistoria?.audios]);

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

  // Sincronizar mensagens do chat quando a vistoria real muda
  useEffect(() => {
    if (vistoria?.chatmessages && vistoria.chatmessages.length > 0) {
      setChatMessages(
        vistoria.chatmessages.map((msg, index) => ({
          id: `chat-${index + 1}-${msg.createdAt ?? "sem-data"}`,
          role: msg.role,
          text: msg.text,
          createdAt: msg.createdAt,
        })),
      );
    } else {
      setChatMessages([]);
    }
  }, [vistoria?.chatmessages]);

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

  const formatarDataApi = (value?: string | null) => {
    if (!value) return "Não informado";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Não informado";
    return date.toLocaleDateString("pt-BR");
  };

  const handleRedirectToSinistro = () => {
    const protocolo = vistoria?.sinistroId;
    if (!protocolo) return;

    startNavigating(() => {
      router.push(`/orquestracao?protocolo=${encodeURIComponent(protocolo)}`);
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
            {isTabLoading || isListLoading
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
              {vistoria?.id ||
                selectedInspecao?.idvistoria ||
                selectedInspecao?.id}
              {vistoria && (
                <Badge
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                    getStatusConfig(vistoria.status as VistoriaStatus).color,
                  )}
                >
                  {(() => {
                    const cfg = getStatusConfig(
                      vistoria.status as VistoriaStatus,
                    );
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
              <button
                type="button"
                onClick={handleRedirectToSinistro}
                disabled={!vistoria?.sinistroId || isNavigating}
                className={cn(
                  "font-semibold text-blue-600 transition-all hover:text-blue-800 hover:underline cursor-pointer",
                  isNavigating && "cursor-wait opacity-70",
                )}
              >
                {vistoria?.sinistroId || selectedInspecao?.sinistroId}
              </button>
            </DialogDescription>
          </DialogHeader>

          {selectedInspecao && (
            <div className={cn("space-y-5", isNavigating && "cursor-wait")}>
              {isVistoriaLoading && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
                    <Skeleton className="h-6 w-52" />
                    <Skeleton className="mt-3 h-4 w-72" />
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200/70 bg-slate-100/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="mt-3 h-5 w-40" />
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-slate-100/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="mt-3 h-5 w-36" />
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-slate-100/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="mt-3 h-5 w-44" />
                    </div>
                  </div>
                </div>
              )}

              {!isVistoriaLoading && isVistoriaError && (
                <div className="flex min-h-40 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center dark:border-red-900/50 dark:bg-red-950/25">
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                      Não foi possível carregar os dados da vistoria.
                    </p>
                    {vistoriaError?.message && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {vistoriaError.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!isVistoriaLoading && !isVistoriaError && vistoria && (
                <>
                  {/* ── Banner: Alerta IA ── */}
                  {vistoria.alertas && (
                    <div className="flex gap-3 rounded-r-xl border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-yellow-700 dark:text-yellow-400">
                          Alerta da IA
                        </p>
                        <p className="mt-0.5 text-sm text-yellow-800 dark:text-yellow-200">
                          {String(vistoria.alertas)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Banner: Motivo de Rejeição ── */}
                  {vistoria.status === "REJEITADA" &&
                    vistoria.motivoRejeicao && (
                      <div className="flex gap-3 rounded-r-xl border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
                            Motivo de Rejeição
                          </p>
                          <p className="mt-0.5 text-sm text-red-800 dark:text-red-200">
                            {vistoria.motivoRejeicao}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* ── Info grid ── */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        label: "Veículo",
                        value: vistoria.veiculo,
                        sub: vistoria.placa,
                      },
                      { label: "Cliente", value: vistoria.cliente },
                      {
                        label: "Credenciado",
                        value: vistoria.credenciado || "Aguardando vínculo",
                      },
                      ...(vistoria.local
                        ? [{ label: "Local", value: vistoria.local }]
                        : []),
                      ...(vistoria.data
                        ? [
                            {
                              label: "Data e Hora",
                              value: formatarDataApi(vistoria.data),
                            },
                          ]
                        : []),
                      ...(selectedInspecao?.descricaoArtigos
                        ? [
                            {
                              label: "Descrição de Artigos",
                              value: selectedInspecao.descricaoArtigos,
                            },
                          ]
                        : []),
                      ...(selectedInspecao?.observacoes
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
                  {vistoria.laudo && (
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
                            {vistoria.laudo}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Accordion: Histórico da Inspeção ── */}
                  {chatMessages.length > 0 && (
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
                                          {new Date(
                                            msg.createdAt,
                                          ).toLocaleString("pt-BR")}
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
                  {imageItems.length > 0 && (
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
                            {imageItems.map((image) => {
                              const src = toDataUri(
                                image.payload,
                                "image/jpeg",
                              );

                              if (!src) {
                                return (
                                  <div
                                    key={image.key}
                                    className="flex h-48 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900/40"
                                  >
                                    <div className="flex flex-col items-center gap-2 text-center">
                                      <ImageOff className="h-7 w-7 text-slate-400" />
                                      <p className="text-xs font-medium">
                                        Mídia indisponível
                                      </p>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={image.key}
                                  className="group overflow-hidden rounded-lg shadow-sm"
                                >
                                  <img
                                    src={src}
                                    alt={image.label ?? image.key}
                                    className="h-36 w-full rounded-lg object-cover shadow-sm transition-all hover:scale-[1.02]"
                                  />
                                  {image.label || image.key ? (
                                    <p className="mt-1 truncate px-0.5 text-xs text-muted-foreground">
                                      {image.label ?? image.key}
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Accordion: Áudios e Transcrições ── */}
                  {audioItems.length > 0 && (
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
                            {audioItems.map((audio, index) => {
                              const audioSrc = toDataUri(
                                audio.payload,
                                "audio/mp4",
                              );

                              if (!audioSrc) {
                                return (
                                  <div
                                    key={audio.key}
                                    className="flex h-28 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900/40"
                                  >
                                    <div className="flex flex-col items-center gap-2 text-center">
                                      <ImageOff className="h-7 w-7 text-slate-400" />
                                      <p className="text-xs font-medium">
                                        Áudio indisponível
                                      </p>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={audio.key}
                                  className="rounded-xl border border-border/60 bg-background p-4 shadow-sm"
                                >
                                  <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold text-foreground">
                                      {audio.label ??
                                        (audio.key || `Áudio ${index + 1}`)}
                                    </span>
                                    {vistoria.updatedAt && (
                                      <span className="text-[10px] text-muted-foreground">
                                        {new Date(
                                          vistoria.updatedAt,
                                        ).toLocaleString("pt-BR")}
                                      </span>
                                    )}
                                  </div>

                                  <audio
                                    controls
                                    src={audioSrc}
                                    className="mt-2 w-full"
                                  />

                                  {audio.label && audio.label !== audio.key && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      {audio.label}
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

                  {/* ── Rodapé: Ações por Status ── */}
                  <div className="flex items-center justify-end border-t border-border/60 pt-4">
                    {(vistoria.status === "FINALIZADA" ||
                      vistoria.status === "REJEITADA") &&
                      vistoria.pdfLaudoUrl && (
                        <a
                          href={vistoria.pdfLaudoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                          <Download className="h-4 w-4" />
                          Baixar Laudo PDF
                        </a>
                      )}
                    {vistoria.status === "EM_ANALISE_OPERACIONAL" && (
                      <div className="flex items-center gap-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={handleRedirectToSinistro}
                          disabled={isNavigating}
                        >
                          <XCircle className="h-4 w-4" />
                          {isNavigating ? "Redirecionando..." : "Rejeitar"}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={handleRedirectToSinistro}
                          disabled={isNavigating}
                        >
                          {isNavigating ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Redirecionando...
                            </span>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Aprovar
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
