"use client";
import { apiFetch } from "@/lib/api-client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useVistoria, type VistoriaDetalhe } from "@/hooks/use-vistoria";
import { useVistoriasList } from "@/hooks/use-vistorias-list";

type VistoriaStatus =
  | "EM_ANDAMENTO"
  | "EM_ANALISE_OPERACIONAL"
  | "FINALIZADA"
  | "REJEITADA"
  | "CANCELADA";

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
  motivoRejeicao?: string;
  tipoVistoria?: "ORIGINAL" | "RETIFICACAO";
  retificacaoAtualId?: string;
  vistoriaOrigemId?: string;
  ajustesNecessarios?: string;
  motivoCancelamento?: string;
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
  const searchParams = useSearchParams();
  const [inspecoes, setInspecoes] = useState<InspecaoData[]>([]);
  const [credenciadosDisponiveis, setCredenciadosDisponiveis] = useState<
    string[]
  >([]);

  const { vistorias: apiVistorias, isLoading: isListLoading } =
    useVistoriasList();

  // Popula o estado com dados reais do Firestore ao carregar/revalidar.
  // Agrupa por sinistroId e exibe apenas a vistoria mais recente por sinistro.
  useEffect(() => {
    if (apiVistorias.length === 0) return;

    const latestBySinistro = new Map<string, typeof apiVistorias[0]>();
    for (const v of apiVistorias) {
      const existing = latestBySinistro.get(v.sinistroId);
      const vTs = new Date(v.createdAt ?? 0).getTime();
      const existingTs = new Date(existing?.createdAt ?? 0).getTime();
      if (!existing || vTs > existingTs) {
        latestBySinistro.set(v.sinistroId, v);
      }
    }

    setInspecoes(
      Array.from(latestBySinistro.values()).map((v) => ({
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
        tipoVistoria: v.tipoVistoria as "ORIGINAL" | "RETIFICACAO" | undefined,
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

  const urlParamHandled = useRef(false);

  // Abre automaticamente a vistoria indicada na URL (?vistoriaId= tem prioridade sobre ?sinistroId=)
  useEffect(() => {
    if (inspecoes.length === 0 || urlParamHandled.current) return;

    const targetVistoriaId = searchParams.get("vistoriaId");
    const targetSinistroId = searchParams.get("sinistroId");

    if (!targetVistoriaId && !targetSinistroId) return;

    const match = targetVistoriaId
      ? inspecoes.find((i) => i.id === targetVistoriaId)
      : inspecoes.find((i) => i.sinistroId === targetSinistroId);

    if (match) {
      urlParamHandled.current = true;
      setActiveTab(match.status);
      setSelectedInspecao(match);
    }
  }, [searchParams, inspecoes]);

  const [accordionState, setAccordionState] = useState({
    laudo: true,
    chat: false,
    imagens: false,
    audios: false,
    transcricoes: false,
    historicoVistorias: false,
    laudo_ia: false,
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
  const [isCancelVistoriaOpen, setIsCancelVistoriaOpen] = useState(false);
  const [motivoCancelamentoVistoria, setMotivoCancelamentoVistoria] = useState("");
  const [isCancellingVistoria, setIsCancellingVistoria] = useState(false);

  const [isAprovando, setIsAprovando] = useState(false);
  const [isRejeitarOpen, setIsRejeitarOpen] = useState(false);
  const [motivoRejeicaoInput, setMotivoRejeicaoInput] = useState("");
  const [ajustesNecessariosInput, setAjustesNecessariosInput] = useState("");
  const [isRejeitando, setIsRejeitando] = useState(false);

  type HistoricoItemBasic = {
    id: string;
    status: string;
    tipoVistoria?: string | null;
    motivoRejeicao?: string | null;
    ajustesNecessarios?: string | null;
    motivoCancelamento?: string | null;
    createdAt?: string | null;
  };

  const [sinistroHistorico, setSinistroHistorico] = useState<{
    isLoading: boolean;
    items: HistoricoItemBasic[];
  }>({ isLoading: false, items: [] });
  const [expandedHistoricoId, setExpandedHistoricoId] = useState<string | null>(null);
  const [expandedHistoricoData, setExpandedHistoricoData] = useState<VistoriaDetalhe | null>(null);
  const [isLoadingHistoricoDetail, setIsLoadingHistoricoDetail] = useState(false);

  const vistoriaId =
    selectedInspecao?.idvistoria ?? selectedInspecao?.id ?? null;
  const {
    vistoria,
    isLoading: isVistoriaLoading,
    isError: isVistoriaError,
    error: vistoriaError,
    reload,
  } = useVistoria(vistoriaId);

  // Busca histórico de vistorias do sinistro quando o modal abre
  useEffect(() => {
    const sinistroId = selectedInspecao?.sinistroId;
    const currentId = selectedInspecao?.id;
    if (!sinistroId) {
      setSinistroHistorico({ isLoading: false, items: [] });
      setExpandedHistoricoId(null);
      setExpandedHistoricoData(null);
      return;
    }
    setSinistroHistorico({ isLoading: true, items: [] });
    setExpandedHistoricoId(null);
    setExpandedHistoricoData(null);
    apiFetch(`/api/sinistros/${sinistroId}/vistorias`)
      .then((r) => r.json())
      .then((data: { vistorias?: HistoricoItemBasic[] }) => {
        const items = (data.vistorias ?? []).filter((v) => v.id !== currentId);
        setSinistroHistorico({ isLoading: false, items });
      })
      .catch(() => setSinistroHistorico({ isLoading: false, items: [] }));
  }, [selectedInspecao?.sinistroId, selectedInspecao?.id]);

  const handleToggleHistoricoItem = async (id: string) => {
    if (expandedHistoricoId === id) {
      setExpandedHistoricoId(null);
      setExpandedHistoricoData(null);
      return;
    }
    setExpandedHistoricoId(id);
    setExpandedHistoricoData(null);
    setIsLoadingHistoricoDetail(true);
    try {
      const res = await apiFetch(`/api/vistorias/${id}`);
      if (res.ok) {
        const data = (await res.json()) as VistoriaDetalhe;
        setExpandedHistoricoData(data);
      }
    } finally {
      setIsLoadingHistoricoDetail(false);
    }
  };

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

  // Retorna URL direta (http/https) se disponível; caso contrário tenta base64.
  const getImageSrc = (item: unknown, fallbackContentType: string): string | null => {
    const isUrl = (v: unknown): v is string =>
      typeof v === "string" && /^https?:\/\//i.test(v.trim());

    if (isUrl(item)) return item.trim();

    if (isPlainObject(item)) {
      const record = item as Record<string, unknown>;
      const urlKeys = ["url", "src", "downloadUrl", "imageUrl", "fileUrl", "uri"];
      for (const k of urlKeys) {
        if (isUrl(record[k])) return (record[k] as string).trim();
      }
      // Qualquer valor string que pareça URL
      for (const v of Object.values(record)) {
        if (isUrl(v)) return (v as string).trim();
      }
    }

    return toDataUri(item, fallbackContentType);
  };

  // Constrói lista de itens de mídia a partir de um campo images/audios (reutilizável no histórico)
  const buildMediaItems = (raw: unknown) => {
    type MediaItem = { key: string; payload: unknown; label: string | null };
    if (!raw) return [] as MediaItem[];
    if (Array.isArray(raw)) {
      return raw.filter(Boolean).map((v, i) => ({
        key: extractMediaLabel(v) ?? `item-${i + 1}`,
        payload: v,
        label: extractMediaDescription(v),
      })) as MediaItem[];
    }
    if (isPlainObject(raw)) {
      return Object.entries(raw as Record<string, unknown>)
        .filter(([, v]) => Boolean(v))
        .map(([k, v], i) => ({
          key: extractMediaLabel(v) ?? (k || `item-${i + 1}`),
          payload: v,
          label: extractMediaDescription(v),
        })) as MediaItem[];
    }
    return [] as MediaItem[];
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
      EM_ANALISE_OPERACIONAL: inspecoes.filter(
        (i) => getLifecycleForInspecao(i) === "EM_ANALISE_OPERACIONAL",
      ).length,
      FINALIZADA: inspecoes.filter(
        (i) => getLifecycleForInspecao(i) === "FINALIZADA",
      ).length,
      REJEITADA: inspecoes.filter(
        (i) => getLifecycleForInspecao(i) === "REJEITADA",
      ).length,
      CANCELADA: inspecoes.filter(
        (i) => getLifecycleForInspecao(i) === "CANCELADA",
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
    switch (status?.toUpperCase()) {
      case "EM_ANDAMENTO":
        return {
          label: "Em Andamento",
          color:
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
          icon: Activity,
          kpiColor: "text-blue-600 dark:text-blue-400",
          kpiIconBg: "bg-blue-100 dark:bg-blue-900/30",
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
      case "CANCELADA":
        return {
          label: "Cancelada",
          color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
          icon: XCircle,
          kpiColor: "text-orange-600 dark:text-orange-400",
          kpiIconBg: "bg-orange-100 dark:bg-orange-900/30",
        };
      default:
        return {
          label: status ?? "Desconhecido",
          color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
          icon: AlertTriangle,
          kpiColor: "text-slate-600 dark:text-slate-400",
          kpiIconBg: "bg-slate-100 dark:bg-slate-800",
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

  const handleAprovarVistoria = async () => {
    if (!vistoriaId) return;
    setIsAprovando(true);
    try {
      const res = await apiFetch(`/api/vistorias/${vistoriaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "FINALIZADA" }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Falha ao aprovar.");
      }
      setSelectedInspecao(null);
      await reload();
    } finally {
      setIsAprovando(false);
    }
  };

  const handleRejeitarVistoria = async () => {
    if (!vistoriaId || !motivoRejeicaoInput.trim() || !ajustesNecessariosInput.trim()) return;
    setIsRejeitando(true);
    try {
      const res = await apiFetch(`/api/vistorias/${vistoriaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJEITADA",
          motivoRejeicao: motivoRejeicaoInput.trim(),
          ajustesNecessarios: ajustesNecessariosInput.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Falha ao rejeitar.");
      }
      setIsRejeitarOpen(false);
      setMotivoRejeicaoInput("");
      setAjustesNecessariosInput("");
      setSelectedInspecao(null);
      await reload();
    } finally {
      setIsRejeitando(false);
    }
  };

  const handleRedirectToSinistro = () => {
    const protocolo = vistoria?.sinistroId;
    if (!protocolo) return;

    startNavigating(() => {
      router.push(`/orquestracao?protocolo=${encodeURIComponent(protocolo)}`);
    });
  };

  const handleCancelVistoria = async () => {
    if (!vistoriaId || !motivoCancelamentoVistoria.trim()) return;
    setIsCancellingVistoria(true);
    try {
      const res = await apiFetch(`/api/vistorias/${vistoriaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELADA",
          motivoCancelamento: motivoCancelamentoVistoria.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Falha ao cancelar.");
      }
      setIsCancelVistoriaOpen(false);
      setMotivoCancelamentoVistoria("");
      await reload();
    } finally {
      setIsCancellingVistoria(false);
    }
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
      CANCELADA: {
        title: "Nenhuma vistoria cancelada",
        description:
          "Não há vistorias com status cancelado para os filtros aplicados.",
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

          return (
            <div
              key={inspecao.id}
              className={cn(
                "group rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60",
                inspecao.tipoVistoria === "RETIFICACAO"
                  ? "border-amber-300 bg-amber-50/40 dark:border-amber-700/60 dark:bg-amber-950/10"
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
                    {inspecao.tipoVistoria === "RETIFICACAO" && (
                      <Badge className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        RETIFICAÇÃO
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
                  ) : tab === "EM_ANALISE_OPERACIONAL" ? (
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
              ["EM_ANALISE_OPERACIONAL", tabsCount.EM_ANALISE_OPERACIONAL],
              ["FINALIZADA", tabsCount.FINALIZADA],
              ["REJEITADA", tabsCount.REJEITADA],
              ["CANCELADA", tabsCount.CANCELADA],
            ] as [VistoriaStatus, number][]
          ).map(([status, count]) => {
            const cfg = getStatusConfig(status);
            const Icon = cfg.icon;
            const isActive = activeTab === status;
            const ringMap: Record<VistoriaStatus, string> = {
              EM_ANDAMENTO: "ring-blue-500",
              EM_ANALISE_OPERACIONAL: "ring-amber-500",
              FINALIZADA: "ring-emerald-500",
              REJEITADA: "ring-red-500",
              CANCELADA: "ring-orange-500",
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
        onOpenChange={() => {
          setSelectedInspecao(null);
          setIsRejeitarOpen(false);
          setMotivoRejeicaoInput("");
          setAjustesNecessariosInput("");
          setIsCancelVistoriaOpen(false);
          setMotivoCancelamentoVistoria("");
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
              {vistoria?.id ||
                selectedInspecao?.idvistoria ||
                selectedInspecao?.id}
              {vistoria && (
                <Badge
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                    getStatusConfig(vistoria.status).color,
                  )}
                >
                  {(() => {
                    const cfg = getStatusConfig(vistoria.status);
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
              {vistoria?.tipoVistoria === "RETIFICACAO" && (
                <Badge className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  RETIFICAÇÃO
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
                  {/* ── Laudo Analítico da IA ── */}
                  {vistoria.laudo_analitico && (
                    <div
                      className={cn(
                        "overflow-hidden rounded-r-xl border-l-4",
                        vistoria.laudo_analitico.incongruencia_detectada
                          ? "border-l-red-500"
                          : "border-l-emerald-500",
                      )}
                    >
                      <div className="rounded-r-xl border border-l-0 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                        {/* Linha de indicadores */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                          <div className="flex items-center gap-1.5 mr-auto">
                            <Bot className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Laudo IA
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "border text-xs",
                                vistoria.laudo_analitico.incongruencia_detectada
                                  ? "border-red-200 bg-red-100 text-red-700 dark:border-red-900/50 dark:bg-red-900/35 dark:text-red-300"
                                  : "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/35 dark:text-emerald-300",
                              )}
                            >
                              {vistoria.laudo_analitico.incongruencia_detectada
                                ? "Incongruência detectada"
                                : "Sem incongruências"}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "border text-xs",
                                vistoria.laudo_analitico.evidencias_suficientes
                                  ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/35 dark:text-emerald-300"
                                  : "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/35 dark:text-amber-300",
                              )}
                            >
                              {vistoria.laudo_analitico.evidencias_suficientes
                                ? "Evidências ✓"
                                : "Evidências insuficientes"}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="border border-slate-200 bg-slate-100 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                            >
                              {vistoria.laudo_analitico.indice_confianca_ia}/100
                            </Badge>
                            {vistoria.laudo_analitico.severidade_contran !== "N/A" && (
                              <Badge
                                variant="secondary"
                                className="border border-orange-200 bg-orange-100 text-xs text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/35 dark:text-orange-300"
                              >
                                CONTRAN: {vistoria.laudo_analitico.severidade_contran}
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className="border border-violet-200 bg-violet-100 font-mono text-xs text-violet-800 dark:border-violet-900/50 dark:bg-violet-900/35 dark:text-violet-200"
                            >
                              {vistoria.laudo_analitico.recomendacao_auditoria}
                            </Badge>
                          </div>
                        </div>

                        {/* Accordion: detalhes completos */}
                        <button
                          type="button"
                          onClick={() =>
                            setAccordionState((prev) => ({
                              ...prev,
                              laudo_ia: !prev.laudo_ia,
                            }))
                          }
                          className="flex w-full items-center justify-between border-t border-border/40 px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <span className="text-xs text-muted-foreground">
                            Ver análise completa
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform duration-200",
                              accordionState.laudo_ia && "rotate-180",
                            )}
                          />
                        </button>

                        {accordionState.laudo_ia && (
                          <div className="space-y-3 border-t border-border/40 px-4 py-3">
                            {vistoria.laudo_analitico.analise_visual && (
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                  Análise Visual
                                </p>
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                  {vistoria.laudo_analitico.analise_visual}
                                </p>
                              </div>
                            )}
                            {vistoria.laudo_analitico.analise_audio && (
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                  Análise de Áudio
                                </p>
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                  {vistoria.laudo_analitico.analise_audio}
                                </p>
                              </div>
                            )}
                            {vistoria.laudo_analitico.detalhes_incongruencia && (
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                  Detalhes da Incongruência
                                </p>
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                  {vistoria.laudo_analitico.detalhes_incongruencia}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Peças Visivelmente Afetadas
                              </p>
                              {vistoria.laudo_analitico.pecas_visivelmente_afetadas.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  Nenhuma peça identificada
                                </p>
                              ) : (
                                <ul className="space-y-1">
                                  {vistoria.laudo_analitico.pecas_visivelmente_afetadas.map(
                                    (peca, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                                      >
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                                        {peca}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Banner: Motivo de Rejeição ── */}
                  {vistoria.status === "REJEITADA" &&
                    vistoria.motivoRejeicao && (
                      <div className="flex gap-3 rounded-r-xl border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                        <div className="flex-1">
                          <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
                            Motivo de Rejeição
                          </p>
                          <p className="mt-0.5 text-sm text-red-800 dark:text-red-200">
                            {vistoria.motivoRejeicao}
                          </p>
                          {vistoria.ajustesNecessarios && (
                            <>
                              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
                                Ajustes Necessários
                              </p>
                              <p className="mt-0.5 text-sm text-red-800 dark:text-red-200">
                                {vistoria.ajustesNecessarios}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                  {/* ── Banner: Motivo de Cancelamento ── */}
                  {vistoria.status === "CANCELADA" &&
                    vistoria.motivoCancelamento && (
                      <div className="flex gap-3 rounded-r-xl border-l-4 border-orange-500 bg-orange-50 p-4 dark:bg-orange-900/20">
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-orange-700 dark:text-orange-400">
                            Motivo de Cancelamento
                          </p>
                          <p className="mt-0.5 text-sm text-orange-900 dark:text-orange-200">
                            {vistoria.motivoCancelamento}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* ── Navegação: links de retificação ── */}
                  {(vistoria.retificacaoAtualId || vistoria.vistoriaOrigemId) && (
                    <div className="flex flex-wrap gap-2">
                      {vistoria.retificacaoAtualId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            const target = inspecoes.find(
                              (i) => i.id === vistoria.retificacaoAtualId,
                            );
                            if (target) setSelectedInspecao(target);
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver retificação
                        </Button>
                      )}
                      {vistoria.vistoriaOrigemId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => {
                            const target = inspecoes.find(
                              (i) => i.id === vistoria.vistoriaOrigemId,
                            );
                            if (target) setSelectedInspecao(target);
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver vistoria original
                        </Button>
                      )}
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
                              const src = getImageSrc(
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

                  {/* ── Transcrições da subcoleção de áudios ── */}
                  {vistoria.audiosSubcollection &&
                    vistoria.audiosSubcollection.length > 0 && (
                      <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
                        <button
                          onClick={() =>
                            setAccordionState((prev) => ({
                              ...prev,
                              transcricoes: !prev.transcricoes,
                            }))
                          }
                          className="w-full flex items-center justify-between px-5 py-4 transition-all duration-200 ease-in-out cursor-pointer hover:bg-white hover:shadow-md dark:hover:bg-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <FileAudio className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <p className="text-[13px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                              Transcrições de Áudio
                            </p>
                          </div>
                          <ChevronDown
                            className={cn(
                              "h-5 w-5 text-slate-400 transition-transform duration-200",
                              accordionState.transcricoes && "rotate-180",
                            )}
                          />
                        </button>
                        {accordionState.transcricoes && (
                          <div className="border-t border-border/40 px-4 py-3 flex flex-col gap-3">
                            {vistoria.audiosSubcollection.map((audioDoc) => (
                              <div
                                key={audioDoc.id}
                                className="rounded-xl border border-border/60 bg-background p-4 shadow-sm"
                              >
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                                  Áudio {audioDoc.id}
                                </p>
                                {audioDoc.transcricaoRevisada ? (
                                  <p className="text-sm leading-relaxed text-foreground">
                                    <span className="font-semibold">Transcrição revisada: </span>
                                    {audioDoc.transcricaoRevisada}
                                  </p>
                                ) : audioDoc.transcricaoOriginal ? (
                                  <p className="text-sm leading-relaxed text-foreground">
                                    <span className="font-semibold">Transcrição original: </span>
                                    {audioDoc.transcricaoOriginal}
                                  </p>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">
                                    Transcrição não disponível
                                  </p>
                                )}
                                {audioDoc.transcriptionStatus && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Status: {audioDoc.transcriptionStatus}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  {/* ── Accordion: Histórico de Vistorias do Sinistro ── */}
                  {sinistroHistorico.items.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
                      <button
                        onClick={() =>
                          setAccordionState((prev) => ({
                            ...prev,
                            historicoVistorias: !prev.historicoVistorias,
                          }))
                        }
                        className="w-full flex items-center justify-between px-5 py-4 transition-all duration-200 ease-in-out cursor-pointer hover:bg-white hover:shadow-md dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <p className="text-[13px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                            Histórico de Vistorias
                          </p>
                        </div>
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 text-slate-400 transition-transform duration-200",
                            accordionState.historicoVistorias && "rotate-180",
                          )}
                        />
                      </button>
                      {accordionState.historicoVistorias && (
                      <div className="border-t border-border/40 px-4 py-3">
                        <div className="relative space-y-0 pl-4 before:absolute before:left-1.5 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-border">
                            {sinistroHistorico.items.map((item) => {
                              const isExpanded = expandedHistoricoId === item.id;
                              const hStatusCfg = getStatusConfig(item.status);
                              const HStatusIcon = hStatusCfg.icon;

                              const hImageItems = isExpanded && expandedHistoricoData?.id === item.id
                                ? buildMediaItems(expandedHistoricoData.images)
                                : [];
                              const hAudioItems = isExpanded && expandedHistoricoData?.id === item.id
                                ? buildMediaItems(expandedHistoricoData.audios)
                                : [];

                              return (
                                <div key={item.id} className="relative pb-4 last:pb-0">
                                  <span className={cn(
                                    "absolute -left-4 top-2 h-3.5 w-3.5 rounded-full border-2 border-background",
                                    item.status === "REJEITADA" ? "bg-red-400" :
                                    item.status === "FINALIZADA" ? "bg-emerald-400" :
                                    item.status === "CANCELADA" ? "bg-orange-400" : "bg-amber-400",
                                  )} />
                                  <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5 shadow-sm">
                                    {/* Cabeçalho */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                          variant="secondary"
                                          className={cn("border text-xs inline-flex items-center gap-1", hStatusCfg.color)}
                                        >
                                          <HStatusIcon className="h-3 w-3" />
                                          {hStatusCfg.label}
                                        </Badge>
                                        {item.tipoVistoria === "RETIFICACAO" && (
                                          <Badge className="border border-amber-200 bg-amber-100 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                            RETIFICAÇÃO
                                          </Badge>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleHistoricoItem(item.id)}
                                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                                      >
                                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
                                        {isExpanded ? "Fechar" : "Ver detalhes"}
                                      </button>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {formatarDataApi(item.createdAt ?? undefined)}
                                    </p>

                                    {/* Motivo rejeição (sempre visível) */}
                                    {item.motivoRejeicao && (
                                      <div className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1.5 dark:border-red-900/50 dark:bg-red-950/25">
                                        <p className="text-xs font-medium text-red-700 dark:text-red-300">Motivo da rejeição:</p>
                                        <p className="mt-0.5 text-xs text-red-600 dark:text-red-200/90">{item.motivoRejeicao}</p>
                                        {item.ajustesNecessarios && (
                                          <>
                                            <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-300">Ajustes solicitados:</p>
                                            <p className="mt-0.5 text-xs text-red-600 dark:text-red-200/90">{item.ajustesNecessarios}</p>
                                          </>
                                        )}
                                      </div>
                                    )}

                                    {/* Motivo cancelamento (sempre visível) */}
                                    {item.motivoCancelamento && (
                                      <div className="mt-2 rounded border border-orange-200 bg-orange-50 px-2 py-1.5 dark:border-orange-900/50 dark:bg-orange-950/25">
                                        <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Motivo do cancelamento:</p>
                                        <p className="mt-0.5 text-xs text-orange-600 dark:text-orange-200/90">{item.motivoCancelamento}</p>
                                      </div>
                                    )}

                                    {/* Detalhe expandido */}
                                    {isExpanded && (
                                      <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
                                        {isLoadingHistoricoDetail ? (
                                          <p className="py-4 text-center text-sm text-muted-foreground">
                                            Carregando...
                                          </p>
                                        ) : expandedHistoricoData?.id === item.id ? (
                                          <>
                                            {/* Laudo */}
                                            {expandedHistoricoData.laudo && (
                                              <div className="rounded-lg border border-border/50 bg-slate-50 p-3 dark:bg-slate-800/40">
                                                <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Laudo</p>
                                                <p className="text-sm leading-relaxed text-foreground">{expandedHistoricoData.laudo}</p>
                                              </div>
                                            )}

                                            {/* Chat */}
                                            {expandedHistoricoData.chatmessages.length > 0 && (
                                              <div className="rounded-lg border border-border/50 bg-slate-50 p-3 dark:bg-slate-800/40">
                                                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                                  <MessageSquare className="inline h-3.5 w-3.5 mr-1" />
                                                  Histórico da Inspeção
                                                </p>
                                                <div className="flex max-h-60 flex-col gap-2 overflow-y-auto">
                                                  {expandedHistoricoData.chatmessages.map((msg, mi) => {
                                                    const isAi = msg.role === "ai" || msg.role === "photo";
                                                    return (
                                                      <div key={`hchat-${mi}`} className={cn("flex gap-2", isAi ? "justify-start" : "justify-end")}>
                                                        {isAi && (
                                                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                                            <Bot className="h-3.5 w-3.5 text-blue-600" />
                                                          </div>
                                                        )}
                                                        <div className={cn(
                                                          "max-w-[75%] rounded-xl px-3 py-2 text-xs",
                                                          isAi ? "rounded-tl-sm bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                                                               : "rounded-tr-sm bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100",
                                                        )}>
                                                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                                        </div>
                                                        {!isAi && (
                                                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-600">
                                                            <User className="h-3.5 w-3.5 text-slate-700" />
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}

                                            {/* Imagens */}
                                            {hImageItems.length > 0 && (
                                              <div className="rounded-lg border border-border/50 bg-slate-50 p-3 dark:bg-slate-800/40">
                                                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                                  <ImageIcon className="inline h-3.5 w-3.5 mr-1" />
                                                  Imagens Fotográficas
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                                                  {hImageItems.map((img) => {
                                                    const src = getImageSrc(img.payload, "image/jpeg");
                                                    if (!src) return null;
                                                    return (
                                                      <img
                                                        key={img.key}
                                                        src={src}
                                                        alt={img.label ?? img.key}
                                                        className="h-28 w-full rounded-lg object-cover shadow-sm"
                                                      />
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}

                                            {/* Áudios */}
                                            {hAudioItems.length > 0 && (
                                              <div className="rounded-lg border border-border/50 bg-slate-50 p-3 dark:bg-slate-800/40">
                                                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                                  <FileAudio className="inline h-3.5 w-3.5 mr-1" />
                                                  Áudios
                                                </p>
                                                <div className="flex flex-col gap-2">
                                                  {hAudioItems.map((aud, ai) => {
                                                    const src = toDataUri(aud.payload, "audio/mp4");
                                                    if (!src) return null;
                                                    return (
                                                      <div key={aud.key} className="rounded-lg border border-border/40 bg-background p-2">
                                                        <p className="mb-1 text-xs font-medium text-foreground">{aud.label ?? `Áudio ${ai + 1}`}</p>
                                                        <audio controls src={src} className="w-full" />
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}

                                            {/* Transcrições da subcoleção */}
                                            {expandedHistoricoData.audiosSubcollection.length > 0 && (
                                              <div className="rounded-lg border border-border/50 bg-slate-50 p-3 dark:bg-slate-800/40">
                                                <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                                  <FileAudio className="inline h-3.5 w-3.5 mr-1" />
                                                  Transcrições de Áudio
                                                </p>
                                                <div className="flex flex-col gap-2">
                                                  {expandedHistoricoData.audiosSubcollection.map((a) => (
                                                    <div key={a.id} className="rounded border border-border/40 bg-background px-3 py-2">
                                                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{a.id}</p>
                                                      {a.transcricaoRevisada ? (
                                                        <p className="mt-1 text-xs text-foreground"><span className="font-semibold">Revisada: </span>{a.transcricaoRevisada}</p>
                                                      ) : a.transcricaoOriginal ? (
                                                        <p className="mt-1 text-xs text-foreground"><span className="font-semibold">Original: </span>{a.transcricaoOriginal}</p>
                                                      ) : (
                                                        <p className="mt-1 text-xs italic text-muted-foreground">Transcrição não disponível</p>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                      </div>
                      )}
                    </div>
                  )}

                  {/* ── Rodapé: Ações por Status ── */}
                  <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
                    {(vistoria.status === "FINALIZADA" ||
                      vistoria.status === "REJEITADA") &&
                      vistoria.pdfLaudoUrl && (
                        <div className="flex justify-end">
                          <a
                            href={vistoria.pdfLaudoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                          >
                            <Download className="h-4 w-4" />
                            Baixar Laudo PDF
                          </a>
                        </div>
                      )}

                    {/* Ações para EM_ANALISE_OPERACIONAL: Rejeitar + Aprovar + Cancelar */}
                    {vistoria.status === "EM_ANALISE_OPERACIONAL" && (
                      <div className="flex items-center justify-end gap-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => setIsRejeitarOpen((prev) => !prev)}
                          disabled={isAprovando || isCancellingVistoria}
                        >
                          <XCircle className="h-4 w-4" />
                          Rejeitar
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={handleAprovarVistoria}
                          disabled={isAprovando || isCancellingVistoria || isRejeitando}
                        >
                          {isAprovando ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Aprovando...
                            </span>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Aprovar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 border-gray-300 text-gray-600"
                          onClick={() => setIsCancelVistoriaOpen((prev) => !prev)}
                          disabled={isAprovando || isCancellingVistoria || isRejeitando}
                        >
                          <XCircle className="h-4 w-4" />
                          Cancelar Vistoria
                        </Button>
                      </div>
                    )}

                    {/* Ações para EM_ANDAMENTO e REJEITADA: só Cancelar */}
                    {(vistoria.status === "EM_ANDAMENTO" ||
                      vistoria.status === "REJEITADA") && (
                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 border-gray-300 text-gray-600"
                          onClick={() => setIsCancelVistoriaOpen((prev) => !prev)}
                          disabled={isCancellingVistoria}
                        >
                          <XCircle className="h-4 w-4" />
                          Cancelar Vistoria
                        </Button>
                      </div>
                    )}

                    {/* Formulário inline de rejeição */}
                    {isRejeitarOpen && (
                      <div className="grid gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-950/20">
                        <div className="grid gap-2">
                          <Label htmlFor="motivo-rejeicao" className="text-sm font-semibold text-red-800 dark:text-red-300">
                            Motivo da Rejeição <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="motivo-rejeicao"
                            value={motivoRejeicaoInput}
                            onChange={(e) => setMotivoRejeicaoInput(e.target.value)}
                            placeholder="Descreva o motivo da rejeição..."
                            disabled={isRejeitando}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="ajustes-necessarios" className="text-sm font-semibold text-red-800 dark:text-red-300">
                            Ajustes Necessários <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="ajustes-necessarios"
                            value={ajustesNecessariosInput}
                            onChange={(e) => setAjustesNecessariosInput(e.target.value)}
                            placeholder="Descreva os ajustes que a oficina deve realizar..."
                            disabled={isRejeitando}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsRejeitarOpen(false);
                              setMotivoRejeicaoInput("");
                              setAjustesNecessariosInput("");
                            }}
                            disabled={isRejeitando}
                          >
                            Voltar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isRejeitando || !motivoRejeicaoInput.trim() || !ajustesNecessariosInput.trim()}
                            onClick={handleRejeitarVistoria}
                          >
                            {isRejeitando ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Rejeitando...
                              </span>
                            ) : (
                              "Confirmar Rejeição"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Formulário inline de cancelamento */}
                    {isCancelVistoriaOpen && (
                      <div className="grid gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/20">
                        <Label htmlFor="motivo-cancelamento-vistoria" className="text-sm font-semibold text-gray-800 dark:text-gray-300">
                          Motivo do Cancelamento <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="motivo-cancelamento-vistoria"
                          value={motivoCancelamentoVistoria}
                          onChange={(e) => setMotivoCancelamentoVistoria(e.target.value)}
                          placeholder="Descreva o motivo do cancelamento..."
                          disabled={isCancellingVistoria}
                        />
                        <div className="flex justify-end gap-2 mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsCancelVistoriaOpen(false);
                              setMotivoCancelamentoVistoria("");
                            }}
                            disabled={isCancellingVistoria}
                          >
                            Voltar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isCancellingVistoria || !motivoCancelamentoVistoria.trim()}
                            onClick={handleCancelVistoria}
                          >
                            {isCancellingVistoria ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cancelando...
                              </span>
                            ) : (
                              "Confirmar Cancelamento"
                            )}
                          </Button>
                        </div>
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
