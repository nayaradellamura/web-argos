"use client";

import {
  memo,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  AlertCircle,
  AlertTriangle,
  AlignLeft,
  BarChart3,
  Building2,
  Car,
  Check,
  ChevronsUpDown,
  ClipboardCheck,
  FileText,
  FilePlus,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  User,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type KanbanColumnId =
  | "triagem"
  | "aguardandoCheckin"
  | "checkinRealizado"
  | "emVistoria"
  | "analiseOperacional"
  | "finalizados";

export interface KanbanCard {
  id: string;
  protocol: string;
  status: string;
  priority: string;
  claimType: string;
  damageDescription: string;
  observations?: string;
  credenciadoId: string | null;
  checkInAt: string | null;
  entryDate: string | null;
  latestVistoriaStatus: string | null;
  isRejected: boolean;
  hasHistoricoRejeicao: boolean;
  kanbanColumn: KanbanColumnId;
  clienteSnapshot?: {
    nomeCompleto?: string;
  };
  clientesSnapshot?: {
    nomeCompleto?: string;
  };
  clienteNome: string;
  clienteTelefone: string;
  placa: string;
  veiculoMarca: string;
  veiculoModelo: string;
  veiculoAno: number | null;
  oficinaNome: string | null;
  oficinaCidade: string | null;
}

export interface KanbanColumnConfig {
  id: KanbanColumnId;
  title: string;
  dotClassName: string;
}

interface KanbanResponse {
  columns: Record<KanbanColumnId, KanbanCard[]>;
}

interface OficinaOption {
  id: string;
  nome: string;
  cidade?: string;
  uf?: string;
}

interface SelectOption {
  id: string;
  label: string;
}

interface VeiculoOption extends SelectOption {
  clienteId?: string;
  proprietarioId?: string;
}

interface AlertaIA {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  categoria?: string;
  createdAt?: string | null;
}

interface AlertasResponse {
  alertas: AlertaIA[];
  total: number;
}

interface VistoriaHistorico {
  id: string;
  status: string;
  createdAt: string;
  motivoRejeicao?: string | null;
}

function normalizeAlerta(raw: Record<string, unknown>): AlertaIA {
  const typeRaw = String(raw.type ?? raw.tipo ?? "info").toLowerCase();
  const type: AlertaIA["type"] =
    typeRaw === "critical" || typeRaw === "critico"
      ? "critical"
      : typeRaw === "warning" || typeRaw === "sla"
        ? "warning"
        : "info";

  return {
    id: String(raw.id ?? crypto.randomUUID()),
    type,
    title: String(raw.title ?? raw.titulo ?? "Alerta IA"),
    description: String(raw.description ?? raw.descricao ?? ""),
    categoria: raw.categoria ? String(raw.categoria) : undefined,
    createdAt: raw.createdAt
      ? String(raw.createdAt)
      : raw.dataHora
        ? String(raw.dataHora)
        : null,
  };
}

interface SinistroDetailResponse {
  id: string;
  credenciadoId?: string | null;
  protocol?: string;
  claimType?: string;
  priority?: string;
  damageDescription?: string;
  observations?: string;
  status?: string;
  checkInAt?: string | null;
  entryDate?: string | null;
  scheduledDate?: string | null;
  clienteSnapshot?: Record<string, unknown>;
  clientesSnapshot?: Record<string, unknown>;
  veiculoSnapshot?: Record<string, unknown>;
  seguradoraSnapshot?: Record<string, unknown>;
  seguradorasSnapshot?: Record<string, unknown>;
  credenciadoSnapshot?: Record<string, unknown> | null;
}

const PRIORITY_OPTIONS = [
  { value: "BAIXA", label: "Baixa" },
  { value: "MEDIA", label: "Média" },
  { value: "ALTA", label: "Alta" },
] as const;

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

function formatPriority(value?: string) {
  const normalized = String(value ?? "").toUpperCase();
  const found = PRIORITY_OPTIONS.find((item) => item.value === normalized);
  return found?.label ?? value ?? "-";
}

function getPriorityBadgeClass(value?: string) {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "ALTA") {
    return "border-red-200 bg-red-100 text-red-700";
  }
  if (normalized === "MEDIA") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }
  return "border-emerald-200 bg-emerald-100 text-emerald-700";
}

const COLUMN_CONFIGS: KanbanColumnConfig[] = [
  { id: "triagem", title: "Entrada (Triagem)", dotClassName: "bg-slate-500" },
  {
    id: "aguardandoCheckin",
    title: "Aguardando Check-in",
    dotClassName: "bg-blue-500",
  },
  {
    id: "checkinRealizado",
    title: "Check-in Realizado",
    dotClassName: "bg-cyan-500",
  },
  { id: "emVistoria", title: "Em Vistoria", dotClassName: "bg-amber-500" },
  {
    id: "analiseOperacional",
    title: "Análise Operacional",
    dotClassName: "bg-purple-500",
  },
  { id: "finalizados", title: "Finalizados", dotClassName: "bg-emerald-500" },
];

const EMPTY_COLUMNS: Record<KanbanColumnId, KanbanCard[]> = {
  triagem: [],
  aguardandoCheckin: [],
  checkinRealizado: [],
  emVistoria: [],
  analiseOperacional: [],
  finalizados: [],
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao buscar ${url}: ${res.status}`);
  }
  return (await res.json()) as T;
};

function mapKanbanResponse(
  data?: KanbanResponse,
): Record<KanbanColumnId, KanbanCard[]> {
  const columns = data?.columns;
  if (!columns) return EMPTY_COLUMNS;

  return {
    triagem: columns.triagem ?? [],
    aguardandoCheckin: columns.aguardandoCheckin ?? [],
    checkinRealizado: columns.checkinRealizado ?? [],
    emVistoria: columns.emVistoria ?? [],
    analiseOperacional: columns.analiseOperacional ?? [],
    finalizados: columns.finalizados ?? [],
  };
}

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  cards: KanbanCard[];
  isDragOver: boolean;
  draggingCardId: string | null;
  dragSourceColumnId: KanbanColumnId | null;
  onDragOver: (columnId: KanbanColumnId) => void;
  onDragLeave: () => void;
  onDrop: (columnId: KanbanColumnId) => void;
  onDragStartCard: (cardId: string, sourceColumnId: KanbanColumnId) => void;
  onDragEndCard: () => void;
  onEditCard: (card: KanbanCard) => void;
  onDeleteCard: (card: KanbanCard) => void;
  onViewCard: (card: KanbanCard) => void;
  onQuickLink: (card: KanbanCard) => void;
  onQuickAnalyze: (card: KanbanCard) => void;
}

function formatStatus(status: string): string {
  const normalized = status.trim().toUpperCase();
  const map: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_ANDAMENTO: "Em Andamento",
    FINALIZADO: "Finalizado",
    EM_ANALISE_IA: "Em Análise pela IA",
    EM_ANALISE_OPERACIONAL: "Em Análise Operacional",
    FINALIZADA: "Finalizada",
    REJEITADA: "Rejeitada",
  };
  return map[normalized] ?? status;
}

function getVistoriaBadgeClass(status: string) {
  const normalized = status.trim().toUpperCase();
  if (normalized === "REJEITADA") {
    return "border-red-200 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }
  if (normalized === "EM_ANALISE_IA") {
    return "border-purple-200 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
  }
  if (normalized === "EM_ANALISE_OPERACIONAL") {
    return "border-amber-200 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }
  if (normalized === "FINALIZADA") {
    return "border-emerald-200 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  return "border-slate-200 bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300";
}

interface KanbanCardItemProps {
  card: KanbanCard;
  columnId: KanbanColumnId;
  draggingCardId: string | null;
  onDragStartCard: (cardId: string, sourceColumnId: KanbanColumnId) => void;
  onDragEndCard: () => void;
  onEditCard: (card: KanbanCard) => void;
  onDeleteCard: (card: KanbanCard) => void;
  onViewCard: (card: KanbanCard) => void;
  onQuickLink: (card: KanbanCard) => void;
  onQuickAnalyze: (card: KanbanCard) => void;
}

const KanbanCardItem = memo(function KanbanCardItem({
  card,
  columnId,
  draggingCardId,
  onDragStartCard,
  onDragEndCard,
  onEditCard,
  onDeleteCard,
  onViewCard,
  onQuickLink,
  onQuickAnalyze,
}: KanbanCardItemProps) {
  const clientName =
    card.clienteSnapshot?.nomeCompleto ??
    card.clientesSnapshot?.nomeCompleto ??
    card.clienteNome ??
    "Cliente não informado";

  return (
    <Card
      key={card.id}
      draggable
      onDragStart={() => onDragStartCard(card.id, columnId)}
      onDragEnd={onDragEndCard}
      onClick={() => onViewCard(card)}
      className={cn(
        "h-full w-full overflow-hidden cursor-grab border-border/70 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-lg active:cursor-grabbing",
        draggingCardId === card.id && "scale-[0.98] opacity-50",
        card.hasHistoricoRejeicao &&
          !card.isRejected &&
          "border-2 border-orange-400 bg-orange-50/30",
        card.isRejected &&
          "border-2 border-red-500 bg-red-50/40 ring-1 ring-red-500/30 dark:bg-red-950/20",
      )}
    >
      <CardHeader className="px-3 pb-2 pt-3">
        <div className="flex w-full min-w-0 items-start justify-between gap-2 overflow-hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-primary">
              {card.protocol}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {clientName}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCard(card);
                }}
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCard(card);
                }}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Car className="h-3.5 w-3.5" />
          <span className="truncate">
            {card.placa || "Placa não informada"}
            {card.veiculoMarca || card.veiculoModelo
              ? ` • ${[card.veiculoMarca, card.veiculoModelo].filter(Boolean).join(" ")}`
              : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span className="truncate">
            {card.oficinaNome || "Oficina não vinculada"}
          </span>
        </div>

        {card.isRejected && (
          <Badge
            variant="secondary"
            className="border border-red-200 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          >
            Ajuste Oficina - Rejeitado
          </Badge>
        )}

        {card.latestVistoriaStatus && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "h-auto max-w-full whitespace-normal wrap-break-word py-1 text-center leading-tight",
                "border",
                getVistoriaBadgeClass(card.latestVistoriaStatus),
              )}
            >
              {`Vistoria: ${formatStatus(card.latestVistoriaStatus)}`}
            </Badge>
          </div>
        )}

        {columnId === "triagem" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto w-full min-w-0 justify-center gap-1.5 whitespace-normal px-2 py-1.5 text-center text-xs leading-tight"
            onClick={(event) => {
              event.stopPropagation();
              onQuickLink(card);
            }}
          >
            <Wrench className="h-3.5 w-3.5" />
            Vincular Oficina
          </Button>
        )}

        {columnId === "analiseOperacional" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto w-full min-w-0 justify-center gap-1.5 whitespace-normal px-2 py-1.5 text-center text-xs leading-tight"
            onClick={(event) => {
              event.stopPropagation();
              onQuickAnalyze(card);
            }}
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Finalizar Vistoria
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

const KanbanColumn = memo(function KanbanColumn({
  column,
  cards,
  isDragOver,
  draggingCardId,
  dragSourceColumnId,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStartCard,
  onDragEndCard,
  onEditCard,
  onDeleteCard,
  onViewCard,
  onQuickLink,
  onQuickAnalyze,
}: KanbanColumnProps) {
  const handleColumnDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (!isDragOver) {
      onDragOver(column.id);
    }
  };

  const handleColumnDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDrop(column.id);
    onDragLeave();
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-3 py-2 transition-all duration-200 ease-in-out",
        "max-h-[calc(100vh-220px)]",
        isDragOver && "border-primary/60 bg-primary/5 ring-1 ring-primary/30",
      )}
      onDragOver={handleColumnDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleColumnDrop}
    >
      <div className="sticky top-0 z-10 mb-3 flex items-center justify-between gap-2 bg-card py-1">
        <div className="flex items-center gap-2">
          <span
            className={cn("h-2.5 w-2.5 rounded-full", column.dotClassName)}
          />
          <h3 className="text-sm font-semibold text-foreground">
            {column.title}
          </h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {cards.length}
        </Badge>
      </div>

      <div className="max-h-[calc(100vh-285px)] space-y-3 overflow-y-auto pb-1 pt-1 pr-1 scrollbar-thin scrollbar-thumb-gray-300">
        {isDragOver &&
          dragSourceColumnId &&
          dragSourceColumnId !== column.id && (
            <div className="rounded-md border border-dashed border-primary/50 bg-primary/10 px-3 py-2 text-xs text-primary transition-all duration-200 ease-in-out">
              Solte aqui para mover para {column.title}
            </div>
          )}

        {column.id === "emVistoria"
          ? (() => {
              const vistoriasNormais = cards.filter((c) => !c.isRejected);
              const retificacao = cards.filter((c) => c.isRejected);
              return (
                <>
                  {vistoriasNormais.map((card) => (
                    <KanbanCardItem
                      key={card.id}
                      card={card}
                      columnId={column.id}
                      draggingCardId={draggingCardId}
                      onDragStartCard={onDragStartCard}
                      onDragEndCard={onDragEndCard}
                      onEditCard={onEditCard}
                      onDeleteCard={onDeleteCard}
                      onViewCard={onViewCard}
                      onQuickLink={onQuickLink}
                      onQuickAnalyze={onQuickAnalyze}
                    />
                  ))}
                  {retificacao.length > 0 && (
                    <>
                      <div className="w-full border-t-2 border-dashed border-orange-300 my-4 pt-4 text-center text-orange-600 font-bold text-sm uppercase tracking-wider">
                        Retificação
                      </div>
                      {retificacao.map((card) => (
                        <KanbanCardItem
                          key={card.id}
                          card={card}
                          columnId={column.id}
                          draggingCardId={draggingCardId}
                          onDragStartCard={onDragStartCard}
                          onDragEndCard={onDragEndCard}
                          onEditCard={onEditCard}
                          onDeleteCard={onDeleteCard}
                          onViewCard={onViewCard}
                          onQuickLink={onQuickLink}
                          onQuickAnalyze={onQuickAnalyze}
                        />
                      ))}
                    </>
                  )}
                </>
              );
            })()
          : cards.map((card) => (
              <KanbanCardItem
                key={card.id}
                card={card}
                columnId={column.id}
                draggingCardId={draggingCardId}
                onDragStartCard={onDragStartCard}
                onDragEndCard={onDragEndCard}
                onEditCard={onEditCard}
                onDeleteCard={onDeleteCard}
                onViewCard={onViewCard}
                onQuickLink={onQuickLink}
                onQuickAnalyze={onQuickAnalyze}
              />
            ))}
      </div>
    </div>
  );
});

export function KanbanBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const protocoloParaAbrir = searchParams.get("protocolo");
  const deepLinkHandledRef = useRef(false);
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnId | null>(
    null,
  );
  const [dragPayload, setDragPayload] = useState<{
    cardId: string;
    sourceColumnId: KanbanColumnId;
  } | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [createClienteOpen, setCreateClienteOpen] = useState(false);
  const [createVeiculoOpen, setCreateVeiculoOpen] = useState(false);
  const [createSeguradoraOpen, setCreateSeguradoraOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    clienteId: "",
    veiculoId: "",
    seguradoraId: "",
    claimType: "",
    priority: "MEDIA",
    damageDescription: "",
  });

  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    claimType: "",
    priority: "MEDIA",
    damageDescription: "",
    observations: "",
  });

  const [deletingCard, setDeletingCard] = useState<KanbanCard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [detailsModal, setDetailsModal] = useState<{
    open: boolean;
    card: KanbanCard | null;
    detail: SinistroDetailResponse | null;
    loading: boolean;
  }>({ open: false, card: null, detail: null, loading: false });
  const [detailsAlertas, setDetailsAlertas] = useState<{
    isLoading: boolean;
    alertas: AlertaIA[];
  }>({ isLoading: false, alertas: [] });
  const [detailsHistorico, setDetailsHistorico] = useState<{
    isLoading: boolean;
    vistorias: VistoriaHistorico[];
  }>({ isLoading: false, vistorias: [] });

  const [linkModal, setLinkModal] = useState<{
    open: boolean;
    card: KanbanCard | null;
    selectedCredenciadoId: string;
  }>({ open: false, card: null, selectedCredenciadoId: "" });
  const [linkOfficeSearch, setLinkOfficeSearch] = useState("");
  const [linkOfficeComboboxOpen, setLinkOfficeComboboxOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const [checkinModal, setCheckinModal] = useState<{
    open: boolean;
    card: KanbanCard | null;
  }>({ open: false, card: null });
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const [approvalModal, setApprovalModal] = useState<{
    open: boolean;
    card: KanbanCard | null;
    alertas: AlertaIA[];
    isLoadingAlertas: boolean;
  }>({ open: false, card: null, alertas: [], isLoadingAlertas: false });
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);

  const { data, isLoading, mutate, error } = useSWR<KanbanResponse>(
    "/api/sinistros?tipo=kanban",
    fetcher,
    {
      refreshInterval: isDragging ? 0 : 3000,
      revalidateOnFocus: true,
    },
  );

  const oficinasUrl = linkModal.open
    ? `/api/oficinas?page=1&limit=50${
        linkOfficeSearch.trim()
          ? `&search=${encodeURIComponent(linkOfficeSearch.trim().toLowerCase())}`
          : ""
      }`
    : null;

  const { data: oficinasData, isLoading: isOficinasLoading } = useSWR<{
    oficinas: OficinaOption[];
  }>(oficinasUrl, fetcher);

  const { data: clientesData } = useSWR<{ clientes: SelectOption[] }>(
    isCreateOpen ? "/api/clientes" : null,
    fetcher,
  );
  const { data: veiculosData } = useSWR<{ veiculos: VeiculoOption[] }>(
    isCreateOpen && createForm.clienteId
      ? `/api/veiculos?clienteId=${encodeURIComponent(createForm.clienteId)}`
      : null,
    fetcher,
  );
  const { data: seguradorasData } = useSWR<{ seguradoras: SelectOption[] }>(
    isCreateOpen ? "/api/seguradoras" : null,
    fetcher,
  );

  const columns = useMemo(() => mapKanbanResponse(data), [data]);

  const selectedClienteLabel = useMemo(() => {
    return (clientesData?.clientes ?? []).find(
      (item) => item.id === createForm.clienteId,
    )?.label;
  }, [clientesData?.clientes, createForm.clienteId]);

  const selectedVeiculoLabel = useMemo(() => {
    return (veiculosData?.veiculos ?? []).find(
      (item) => item.id === createForm.veiculoId,
    )?.label;
  }, [veiculosData?.veiculos, createForm.veiculoId]);

  const veiculosFiltrados = useMemo(() => {
    if (!createForm.clienteId) return [];

    const todosVeiculos = veiculosData?.veiculos ?? [];
    const temRelacaoExplicita = todosVeiculos.some(
      (v) => Boolean(v.clienteId) || Boolean(v.proprietarioId),
    );

    if (!temRelacaoExplicita) {
      return todosVeiculos;
    }

    return todosVeiculos.filter((v) => {
      const relatedClientId = v.clienteId ?? v.proprietarioId ?? "";
      return relatedClientId === createForm.clienteId;
    });
  }, [createForm.clienteId, veiculosData?.veiculos]);

  const selectedSeguradoraLabel = useMemo(() => {
    return (seguradorasData?.seguradoras ?? []).find(
      (item) => item.id === createForm.seguradoraId,
    )?.label;
  }, [seguradorasData?.seguradoras, createForm.seguradoraId]);

  const cardsById = useMemo(() => {
    const map = new Map<string, KanbanCard>();
    (Object.keys(columns) as KanbanColumnId[]).forEach((colId) => {
      columns[colId].forEach((card) => map.set(card.id, card));
    });
    return map;
  }, [columns]);

  const filteredColumns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return columns;

    const filterCard = (card: KanbanCard) =>
      card.protocol.toLowerCase().includes(q) ||
      card.placa.toLowerCase().includes(q) ||
      card.clienteNome.toLowerCase().includes(q);

    return {
      triagem: columns.triagem.filter(filterCard),
      aguardandoCheckin: columns.aguardandoCheckin.filter(filterCard),
      checkinRealizado: columns.checkinRealizado.filter(filterCard),
      emVistoria: columns.emVistoria.filter(filterCard),
      analiseOperacional: columns.analiseOperacional.filter(filterCard),
      finalizados: columns.finalizados.filter(filterCard),
    };
  }, [columns, search]);

  const filteredOficinas = useMemo(() => {
    const oficinas = oficinasData?.oficinas ?? [];
    const query = linkOfficeSearch.trim().toLowerCase();
    if (!query) return oficinas;

    return oficinas.filter((oficina) => {
      const nome = oficina.nome?.toLowerCase() ?? "";
      const cidade = oficina.cidade?.toLowerCase() ?? "";
      return nome.includes(query) || cidade.includes(query);
    });
  }, [oficinasData?.oficinas, linkOfficeSearch]);

  const selectedOficina = useMemo(
    () =>
      filteredOficinas.find(
        (item) => item.id === linkModal.selectedCredenciadoId,
      ) ?? null,
    [filteredOficinas, linkModal.selectedCredenciadoId],
  );

  const optimisticMove = useCallback(
    (
      card: KanbanCard,
      source: KanbanColumnId,
      target: KanbanColumnId,
      overrides?: Partial<KanbanCard>,
    ) => {
      void mutate(
        (current) => {
          if (!current) return current;
          const currCols = mapKanbanResponse(current);
          const cardFromSource = currCols[source].find(
            (item) => item.id === card.id,
          );
          if (!cardFromSource) return current;

          const nextCard: KanbanCard = {
            ...cardFromSource,
            ...overrides,
            kanbanColumn: target,
          };

          return {
            ...current,
            columns: {
              ...currCols,
              [source]: currCols[source].filter((item) => item.id !== card.id),
              [target]: [
                nextCard,
                ...currCols[target].filter((item) => item.id !== card.id),
              ],
            },
          };
        },
        { revalidate: false },
      );
    },
    [mutate],
  );

  const rollbackOptimistic = useCallback(
    async (snapshot?: KanbanResponse) => {
      if (snapshot) {
        await mutate(snapshot, { revalidate: false });
      }
      await mutate();
    },
    [mutate],
  );

  const handleCreate = async () => {
    try {
      setIsCreateSubmitting(true);
      const res = await fetch("/api/sinistros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: createForm.clienteId,
          veiculoId: createForm.veiculoId,
          seguradoraId: createForm.seguradoraId,
          claimType: createForm.claimType,
          priority: createForm.priority,
          damageDescription: createForm.damageDescription,
        }),
      });

      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Falha ao criar sinistro.");

      toast({
        title: "Sinistro criado",
        description: "Cadastro realizado com sucesso.",
      });
      setIsCreateOpen(false);
      setCreateForm({
        clienteId: "",
        veiculoId: "",
        seguradoraId: "",
        claimType: "",
        priority: "MEDIA",
        damageDescription: "",
      });
      await mutate();
    } catch (err) {
      toast({
        title: "Erro ao criar",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const openEditModal = (card: KanbanCard) => {
    setEditingCard(card);
    setEditForm({
      claimType: card.claimType ?? "",
      priority: card.priority ?? "MEDIA",
      damageDescription: card.damageDescription ?? "",
      observations: card.observations ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    try {
      setIsEditSubmitting(true);
      const res = await fetch(`/api/sinistros/${editingCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimType: editForm.claimType,
          priority: editForm.priority,
          damageDescription: editForm.damageDescription,
          observations: editForm.observations,
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok)
        throw new Error(body.error ?? "Falha ao atualizar sinistro.");

      toast({
        title: "Sinistro atualizado",
        description: "Dados salvos com sucesso.",
      });
      setEditingCard(null);
      await mutate();
    } catch (err) {
      toast({
        title: "Erro ao atualizar",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCard) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/sinistros/${deletingCard.id}`, {
        method: "DELETE",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Falha ao eliminar sinistro.");

      toast({
        title: "Sinistro eliminado",
        description: "Registro removido com sucesso.",
      });
      setDeletingCard(null);
      await mutate();
    } catch (err) {
      toast({
        title: "Erro ao eliminar",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchAlertasIa = useCallback(async (sinistroId: string) => {
    const res = await fetch(`/api/sinistros/${sinistroId}/alertas`);
    const body = (await res.json()) as
      | AlertasResponse
      | { alertas?: Record<string, unknown>[]; error?: string };

    if (!res.ok) {
      throw new Error(
        (body as { error?: string }).error ?? "Falha ao buscar alertas IA.",
      );
    }

    const rawAlertas = Array.isArray((body as AlertasResponse).alertas)
      ? ((body as AlertasResponse).alertas as unknown[])
      : [];

    return rawAlertas.map((item) =>
      normalizeAlerta(item as Record<string, unknown>),
    );
  }, []);

  const openDetailsModal = async (card: KanbanCard) => {
    setDetailsModal({ open: true, card, detail: null, loading: true });
    setDetailsAlertas({
      isLoading: card.kanbanColumn === "analiseOperacional",
      alertas: [],
    });
    setDetailsHistorico({ isLoading: true, vistorias: [] });
    try {
      const [detailRes, historicoRes] = await Promise.all([
        fetch(`/api/sinistros/${card.id}`),
        fetch(`/api/sinistros/${card.id}/vistorias`),
      ]);
      const body = (await detailRes.json()) as SinistroDetailResponse & {
        error?: string;
      };
      if (!detailRes.ok)
        throw new Error(body.error ?? "Falha ao carregar detalhes.");

      if (historicoRes.ok) {
        const hBody = (await historicoRes.json()) as {
          vistorias?: VistoriaHistorico[];
        };
        setDetailsHistorico({
          isLoading: false,
          vistorias: hBody.vistorias ?? [],
        });
      } else {
        setDetailsHistorico({ isLoading: false, vistorias: [] });
      }

      if (card.kanbanColumn === "analiseOperacional") {
        try {
          const alertas = await fetchAlertasIa(card.id);
          setDetailsAlertas({ isLoading: false, alertas });
        } catch {
          setDetailsAlertas({ isLoading: false, alertas: [] });
        }
      }

      setDetailsModal({ open: true, card, detail: body, loading: false });
    } catch (err) {
      toast({
        title: "Erro ao carregar detalhes",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
      setDetailsModal({ open: true, card, detail: null, loading: false });
      setDetailsAlertas({ isLoading: false, alertas: [] });
      setDetailsHistorico({ isLoading: false, vistorias: [] });
    }
  };

  useEffect(() => {
    if (!protocoloParaAbrir) {
      deepLinkHandledRef.current = false;
      return;
    }

    if (isLoading || deepLinkHandledRef.current) {
      return;
    }

    const protocoloNormalizado = protocoloParaAbrir
      .trim()
      .replace(/^#/, "")
      .toLowerCase();
    const allCards = (Object.keys(columns) as KanbanColumnId[]).flatMap(
      (columnId) => columns[columnId],
    );
    const cardEncontrado = allCards.find(
      (card) =>
        card.protocol.trim().replace(/^#/, "").toLowerCase() ===
        protocoloNormalizado,
    );

    if (!cardEncontrado) {
      return;
    }

    deepLinkHandledRef.current = true;
    void openDetailsModal(cardEncontrado);
    router.replace("/orquestracao", { scroll: false });
  }, [columns, isLoading, openDetailsModal, protocoloParaAbrir, router]);

  const closeDetailsModal = useCallback(() => {
    setDetailsModal({
      open: false,
      card: null,
      detail: null,
      loading: false,
    });
    setDetailsAlertas({ isLoading: false, alertas: [] });
    setDetailsHistorico({ isLoading: false, vistorias: [] });
  }, []);

  const openLinkModal = (card: KanbanCard) => {
    setLinkModal({
      open: true,
      card,
      selectedCredenciadoId: card.credenciadoId ?? "",
    });
    setLinkOfficeSearch("");
    setLinkOfficeComboboxOpen(false);
  };

  const handleConfirmVincular = async () => {
    if (!linkModal.card || !linkModal.selectedCredenciadoId) return;
    const movedCard = linkModal.card;
    const selectedCredenciadoId = linkModal.selectedCredenciadoId;
    const snapshotBeforeMove = data;

    optimisticMove(movedCard, "triagem", "aguardandoCheckin", {
      credenciadoId: selectedCredenciadoId,
    });

    try {
      setIsLinking(true);
      const res = await fetch(`/api/sinistros/${movedCard.id}/vincular`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credenciadoId: selectedCredenciadoId,
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Falha ao vincular oficina.");

      toast({
        title: "Oficina vinculada",
        description: "Transição aplicada com sucesso.",
      });
      setLinkModal({ open: false, card: null, selectedCredenciadoId: "" });
      setLinkOfficeSearch("");
      setLinkOfficeComboboxOpen(false);
      await mutate();
    } catch (err) {
      await rollbackOptimistic(snapshotBeforeMove);
      toast({
        title: "Erro ao vincular",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleConfirmCheckin = async () => {
    if (!checkinModal.card) return;
    const nowIso = new Date().toISOString();
    const movedCard = checkinModal.card;
    const snapshotBeforeMove = data;

    optimisticMove(movedCard, "aguardandoCheckin", "checkinRealizado", {
      checkInAt: nowIso,
    });

    try {
      setIsCheckingIn(true);
      const res = await fetch(`/api/sinistros/${movedCard.id}/checkin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInAt: nowIso }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok)
        throw new Error(body.error ?? "Falha ao confirmar check-in.");

      toast({
        title: "Check-in confirmado",
        description: "Chegada física registrada com sucesso.",
      });
      setCheckinModal({ open: false, card: null });
      await mutate();
    } catch (err) {
      await rollbackOptimistic(snapshotBeforeMove);
      toast({
        title: "Erro ao confirmar check-in",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const closeApprovalModal = useCallback(() => {
    setApprovalModal({
      open: false,
      card: null,
      alertas: [],
      isLoadingAlertas: false,
    });
    setIsRejecting(false);
    setRejectReason("");
  }, []);

  const openApprovalModal = async (card: KanbanCard) => {
    setIsRejecting(false);
    setRejectReason("");
    setApprovalModal({ open: true, card, alertas: [], isLoadingAlertas: true });
    try {
      const alertas = await fetchAlertasIa(card.id);
      setApprovalModal({
        open: true,
        card,
        alertas,
        isLoadingAlertas: false,
      });
    } catch (err) {
      setApprovalModal({
        open: true,
        card,
        alertas: [],
        isLoadingAlertas: false,
      });
      toast({
        title: "Erro ao carregar relatório IA",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleOpenApprovalFromDetails = useCallback(() => {
    const card = detailsModal.card;
    if (!card || card.kanbanColumn !== "analiseOperacional") return;
    closeDetailsModal();
    void openApprovalModal(card);
  }, [closeDetailsModal, detailsModal.card, openApprovalModal]);

  const handleConfirmFinalizar = async () => {
    if (!approvalModal.card) return;
    const movedCard = approvalModal.card;
    const snapshotBeforeMove = data;

    optimisticMove(movedCard, "analiseOperacional", "finalizados", {
      status: "FINALIZADO",
    });

    try {
      setIsFinalizing(true);
      const res = await fetch(`/api/sinistros/${movedCard.id}/finalizar`, {
        method: "PATCH",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok)
        throw new Error(body.error ?? "Falha ao finalizar sinistro.");

      toast({
        title: "Sinistro finalizado",
        description: "Aprovação confirmada.",
      });
      closeApprovalModal();
      await mutate();
    } catch (err) {
      await rollbackOptimistic(snapshotBeforeMove);
      toast({
        title: "Erro ao finalizar",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!approvalModal.card || !rejectReason.trim()) return;

    const movedCard = approvalModal.card;
    const motivoRejeicao = rejectReason.trim();
    const snapshotBeforeMove = data;

    optimisticMove(movedCard, "analiseOperacional", "emVistoria", {
      latestVistoriaStatus: "REJEITADA",
      isRejected: true,
    });

    try {
      setIsRejectSubmitting(true);
      const res = await fetch(`/api/sinistros/${movedCard.id}/rejeitar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivoRejeicao }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Falha ao rejeitar vistoria.");
      }

      toast({
        title: "Vistoria rejeitada",
        description: "Motivo enviado para a oficina com sucesso.",
      });
      closeApprovalModal();
      await mutate();
    } catch (err) {
      await rollbackOptimistic(snapshotBeforeMove);
      toast({
        title: "Erro ao rejeitar",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsRejectSubmitting(false);
    }
  };

  const handleOpenFullVistoria = useCallback(() => {
    if (!approvalModal.card?.id) return;
    router.push(`/vistoria?sinistroId=${approvalModal.card.id}`);
  }, [approvalModal.card?.id, router]);

  const handleDropBetweenColumns = async (targetColumnId: KanbanColumnId) => {
    if (!dragPayload) return;
    const { cardId, sourceColumnId } = dragPayload;
    if (sourceColumnId === targetColumnId) return;

    const card = cardsById.get(cardId);
    if (!card) return;

    if (
      targetColumnId === "emVistoria" ||
      targetColumnId === "analiseOperacional"
    ) {
      toast({
        title: "Movimento bloqueado",
        description:
          "Esta etapa é atualizada pelo aplicativo da oficina, aguarde!",
      });
      return;
    }

    if (
      sourceColumnId === "triagem" &&
      targetColumnId === "aguardandoCheckin"
    ) {
      openLinkModal(card);
      return;
    }

    if (
      sourceColumnId === "aguardandoCheckin" &&
      targetColumnId === "checkinRealizado"
    ) {
      setCheckinModal({ open: true, card });
      return;
    }

    if (
      sourceColumnId === "analiseOperacional" &&
      targetColumnId === "finalizados"
    ) {
      await openApprovalModal(card);
      return;
    }

    toast({
      title: "Movimento inválido",
      description: "Movimento inválido. Siga o fluxo de regulação.",
      variant: "destructive",
    });
  };

  const handleDragStartCard = useCallback(
    (cardId: string, sourceColumnId: KanbanColumnId) => {
      setDragPayload({ cardId, sourceColumnId });
      setDraggingCardId(cardId);
      setIsDragging(true);
    },
    [],
  );

  const handleDragEndCard = useCallback(() => {
    setDragPayload(null);
    setDragOverColumn(null);
    setDraggingCardId(null);
    setIsDragging(false);
  }, []);

  const handleDragLeaveColumn = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleQuickAnalyze = useCallback(
    (card: KanbanCard) => {
      void openApprovalModal(card);
    },
    [openApprovalModal],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por protocolo, placa ou cliente..."
            className="pl-9"
          />
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="shrink-0">
          <Plus className="mr-1 h-4 w-4" />
          Novo Sinistro
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Falha ao carregar Kanban em tempo real.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {COLUMN_CONFIGS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            cards={filteredColumns[column.id]}
            isDragOver={dragOverColumn === column.id}
            draggingCardId={draggingCardId}
            dragSourceColumnId={dragPayload?.sourceColumnId ?? null}
            onDragOver={setDragOverColumn}
            onDragLeave={handleDragLeaveColumn}
            onDrop={handleDropBetweenColumns}
            onDragStartCard={handleDragStartCard}
            onDragEndCard={handleDragEndCard}
            onEditCard={openEditModal}
            onDeleteCard={setDeletingCard}
            onViewCard={openDetailsModal}
            onQuickLink={openLinkModal}
            onQuickAnalyze={handleQuickAnalyze}
          />
        ))}
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">
          Sincronizando quadro em tempo real...
        </p>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-800">
              <FilePlus className="h-6 w-6 text-blue-700" />
              Novo Sinistro
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Selecione as bases e preencha os campos operacionais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="grid gap-5">
                <div className="grid gap-1.5">
                  <Label className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Cliente
                  </Label>
                  <Popover
                    open={createClienteOpen}
                    onOpenChange={setCreateClienteOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={createClienteOpen}
                        className="h-11 w-full justify-between rounded-xl border-slate-200 bg-slate-50 text-slate-700 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-left">
                          <User className="h-4 w-4 shrink-0 text-slate-500" />
                          <span className="truncate">
                            {selectedClienteLabel ?? "Selecione o cliente"}
                          </span>
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) rounded-xl border-slate-200 p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Buscar cliente por nome ou CPF..." />
                        <CommandList>
                          <CommandEmpty>
                            Nenhum resultado encontrado.
                          </CommandEmpty>
                          <CommandGroup>
                            {(clientesData?.clientes ?? []).map((item) => (
                              <CommandItem
                                key={item.id}
                                value={item.label}
                                onSelect={() => {
                                  setCreateForm((cur) => ({
                                    ...cur,
                                    clienteId: item.id,
                                    veiculoId: "",
                                  }));
                                  setCreateVeiculoOpen(false);
                                  setCreateClienteOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    createForm.clienteId === item.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <span className="truncate">{item.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-1.5">
                  <Label className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Veículo
                  </Label>
                  <Popover
                    open={createVeiculoOpen}
                    onOpenChange={(open) =>
                      setCreateVeiculoOpen(createForm.clienteId ? open : false)
                    }
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={createVeiculoOpen}
                        disabled={!createForm.clienteId}
                        className="h-11 w-full justify-between rounded-xl border-slate-200 bg-slate-50 text-slate-700 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:opacity-70"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-left">
                          <Car className="h-4 w-4 shrink-0 text-slate-500" />
                          <span className="truncate">
                            {!createForm.clienteId
                              ? "Selecione um cliente primeiro..."
                              : (selectedVeiculoLabel ?? "Selecione o veículo")}
                          </span>
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) rounded-xl border-slate-200 p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Buscar por placa ou modelo..." />
                        <CommandList>
                          <CommandEmpty>
                            {createForm.clienteId
                              ? "Nenhum veículo encontrado para este cliente"
                              : "Selecione um cliente primeiro..."}
                          </CommandEmpty>
                          <CommandGroup>
                            {veiculosFiltrados.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={item.label}
                                onSelect={() => {
                                  setCreateForm((cur) => ({
                                    ...cur,
                                    veiculoId: item.id,
                                  }));
                                  setCreateVeiculoOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    createForm.veiculoId === item.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <span className="truncate">{item.label}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-1.5">
                  <Label className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                    Seguradora
                  </Label>
                  <Popover
                    open={createSeguradoraOpen}
                    onOpenChange={setCreateSeguradoraOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={createSeguradoraOpen}
                        className="h-11 w-full justify-between rounded-xl border-slate-200 bg-slate-50 text-slate-700 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20"
                      >
                        <span className="flex min-w-0 items-center gap-2 text-left">
                          <Shield className="h-4 w-4 shrink-0 text-slate-500" />
                          <span className="truncate">
                            {selectedSeguradoraLabel ??
                              "Selecione a seguradora"}
                          </span>
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-(--radix-popover-trigger-width) rounded-xl border-slate-200 p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Buscar seguradora..." />
                        <CommandList>
                          <CommandEmpty>
                            Nenhum resultado encontrado.
                          </CommandEmpty>
                          <CommandGroup>
                            {(seguradorasData?.seguradoras ?? []).map(
                              (item) => (
                                <CommandItem
                                  key={item.id}
                                  value={item.label}
                                  onSelect={() => {
                                    setCreateForm((cur) => ({
                                      ...cur,
                                      seguradoraId: item.id,
                                    }));
                                    setCreateSeguradoraOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      createForm.seguradoraId === item.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  <span className="truncate">{item.label}</span>
                                </CommandItem>
                              ),
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <Label
                  htmlFor="claimType"
                  className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Tipo de Sinistro
                </Label>
                <div className="relative w-full">
                  <AlertCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="claimType"
                    value={createForm.claimType}
                    placeholder="Ex: Colisão frontal severa"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    onChange={(event) =>
                      setCreateForm((cur) => ({
                        ...cur,
                        claimType: event.target.value,
                      }))
                    }
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Exemplo: Danos em porta e retrovisor.
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Prioridade
                </Label>
                <div className="relative">
                  <BarChart3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Select
                    value={createForm.priority}
                    onValueChange={(value) =>
                      setCreateForm((cur) => ({ ...cur, priority: value }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 focus:bg-white focus:ring-2 focus:ring-blue-500/20">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label
                  htmlFor="damageDescription"
                  className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Descrição do Dano
                </Label>
                <div className="relative w-full">
                  <AlignLeft className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Textarea
                    id="damageDescription"
                    value={createForm.damageDescription}
                    placeholder="Detalhe os danos visíveis, peças afetadas e informações iniciais. Ex: Para-choque com riscos profundos, lanterna direita quebrada e capô amassado."
                    className="field-sizing-fixed min-h-28 w-full max-w-full resize-none overflow-x-hidden rounded-xl border-slate-200 bg-slate-50 pl-10 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    onChange={(event) =>
                      setCreateForm((cur) => ({
                        ...cur,
                        damageDescription: event.target.value,
                      }))
                    }
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Exemplo: Danos em porta e retrovisor com necessidade de
                  análise de pintura, funilaria e fixação.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2 flex w-full justify-end gap-3">
            <Button
              variant="outline"
              className="rounded-xl text-slate-500 hover:bg-slate-100"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreateSubmitting}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white shadow-md shadow-blue-200 hover:bg-blue-700"
            >
              {isCreateSubmitting ? "Criando..." : "Criar sinistro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingCard)}
        onOpenChange={(open) => !open && setEditingCard(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sinistro</DialogTitle>
            <DialogDescription>
              Atualize somente os campos operacionais deste sinistro.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-claimType">Tipo de Sinistro</Label>
              <Input
                id="edit-claimType"
                value={editForm.claimType}
                onChange={(event) =>
                  setEditForm((cur) => ({
                    ...cur,
                    claimType: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Prioridade</Label>
              <Select
                value={editForm.priority}
                onValueChange={(value) =>
                  setEditForm((cur) => ({ ...cur, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-damageDescription">Descrição do Dano</Label>
              <Textarea
                id="edit-damageDescription"
                value={editForm.damageDescription}
                onChange={(event) =>
                  setEditForm((cur) => ({
                    ...cur,
                    damageDescription: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="edit-observations">Observações</Label>
              <Textarea
                id="edit-observations"
                value={editForm.observations}
                onChange={(event) =>
                  setEditForm((cur) => ({
                    ...cur,
                    observations: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isEditSubmitting}>
              {isEditSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailsModal.open}
        onOpenChange={(open) => !open && closeDetailsModal()}
      >
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Detalhes do Sinistro</DialogTitle>
            <DialogDescription>
              Visualização dos detalhes do sinistro.
            </DialogDescription>
          </DialogHeader>

          {detailsModal.loading ? (
            <p className="text-sm text-muted-foreground">
              Carregando detalhes...
            </p>
          ) : (
            <ScrollArea className="h-[65vh] rounded-xl bg-slate-50 p-4">
              <div className="text-sm">
                <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-700">
                    <Car className="h-5 w-5" />
                    Dados do veículo
                  </h3>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Placa</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.veiculoSnapshot?.placa ?? "-",
                      )}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Marca</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.veiculoSnapshot?.marca ?? "-",
                      )}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Modelo</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.veiculoSnapshot?.modelo ?? "-",
                      )}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Ano</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.veiculoSnapshot?.anoFabricacao ??
                          "-",
                      )}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Cor</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(detailsModal.detail?.veiculoSnapshot?.cor ?? "-")}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Chassi</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.veiculoSnapshot?.chassi ?? "-",
                      )}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Renavam</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.veiculoSnapshot?.renavam ?? "-",
                      )}
                    </span>
                  </div>
                  <div className="flex items-start justify-between py-2">
                    <span className="text-sm text-gray-500">Combustível</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.veiculoSnapshot?.combustivel ??
                          "-",
                      )}
                    </span>
                  </div>
                </div>

                <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-700">
                    <FileText className="h-5 w-5" />
                    Dados do sinistro
                  </h3>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Protocolo</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {detailsModal.detail?.protocol ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Seguradora</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.seguradoraSnapshot?.name ??
                          detailsModal.detail?.seguradorasSnapshot?.name ??
                          "-",
                      )}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Tipo</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {detailsModal.detail?.claimType ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Prioridade</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "border text-xs",
                        getPriorityBadgeClass(detailsModal.detail?.priority),
                      )}
                    >
                      {formatPriority(detailsModal.detail?.priority)}
                    </Badge>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {formatStatus(detailsModal.detail?.status ?? "-")}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Agendamento</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {formatDate(detailsModal.detail?.scheduledDate)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between py-2">
                    <span className="text-sm text-gray-500">Check-in</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {detailsModal.detail?.checkInAt
                        ? formatDate(detailsModal.detail?.checkInAt)
                        : "Aguardando"}
                    </span>
                  </div>
                </div>

                <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-700">
                    <User className="h-5 w-5" />
                    Cliente
                  </h3>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Nome</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.clienteSnapshot?.nomeCompleto ??
                          detailsModal.detail?.clienteSnapshot?.nome ??
                          detailsModal.detail?.clienteSnapshot?.name ??
                          detailsModal.detail?.clientesSnapshot?.nomeCompleto ??
                          detailsModal.detail?.clientesSnapshot?.nome ??
                          detailsModal.detail?.clientesSnapshot?.name ??
                          detailsModal.card?.clienteNome ??
                          "-",
                      )}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Documento</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.clienteSnapshot?.cpfCnpj ??
                          detailsModal.detail?.clienteSnapshot?.cpf ??
                          detailsModal.detail?.clienteSnapshot?.cnpj ??
                          detailsModal.detail?.clienteSnapshot?.documento ??
                          detailsModal.detail?.clienteSnapshot?.document ??
                          detailsModal.detail?.clientesSnapshot?.cpfCnpj ??
                          detailsModal.detail?.clientesSnapshot?.cpf ??
                          detailsModal.detail?.clientesSnapshot?.cnpj ??
                          detailsModal.detail?.clientesSnapshot?.documento ??
                          detailsModal.detail?.clientesSnapshot?.document ??
                          "-",
                      )}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                    <span className="text-sm text-gray-500">Telefone</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.clienteSnapshot?.telefone ??
                          detailsModal.detail?.clienteSnapshot?.phone ??
                          detailsModal.detail?.clienteSnapshot?.celular ??
                          detailsModal.detail?.clientesSnapshot?.telefone ??
                          detailsModal.detail?.clientesSnapshot?.phone ??
                          detailsModal.detail?.clientesSnapshot?.celular ??
                          detailsModal.card?.clienteTelefone ??
                          "-",
                      )}
                    </span>
                  </div>
                  <div className="flex items-start justify-between py-2">
                    <span className="text-sm text-gray-500">E-mail</span>
                    <span className="text-right text-sm font-medium text-gray-900">
                      {String(
                        detailsModal.detail?.clienteSnapshot?.email ??
                          detailsModal.detail?.clienteSnapshot?.mail ??
                          detailsModal.detail?.clientesSnapshot?.email ??
                          detailsModal.detail?.clientesSnapshot?.mail ??
                          "-",
                      )}
                    </span>
                  </div>
                </div>

                {detailsModal.detail?.credenciadoId &&
                  detailsModal.detail?.credenciadoSnapshot && (
                    <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-700">
                        <Wrench className="h-5 w-5" />
                        Oficina credenciada
                      </h3>
                      <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                        <span className="text-sm text-gray-500">Oficina</span>
                        <span className="text-right text-sm font-medium text-gray-900">
                          {String(
                            detailsModal.detail?.credenciadoSnapshot?.name ??
                              "-",
                          )}
                        </span>
                      </div>
                      <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                        <span className="text-sm text-gray-500">Endereço</span>
                        <span className="text-right text-sm font-medium text-gray-900">
                          {[
                            String(
                              detailsModal.detail?.credenciadoSnapshot
                                ?.address ?? "",
                            ).trim(),
                            String(
                              detailsModal.detail?.credenciadoSnapshot?.city ??
                                "",
                            ).trim(),
                          ]
                            .filter(Boolean)
                            .join(", ") +
                            (detailsModal.detail?.credenciadoSnapshot?.uf
                              ? ` - ${String(detailsModal.detail?.credenciadoSnapshot?.uf)}`
                              : "") || "-"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between border-b border-gray-50 py-2 last:border-0">
                        <span className="text-sm text-gray-500">Telefone</span>
                        <span className="text-right text-sm font-medium text-gray-900">
                          {String(
                            detailsModal.detail?.credenciadoSnapshot?.phone ??
                              "-",
                          )}
                        </span>
                      </div>
                      <div className="flex items-start justify-between py-2">
                        <span className="text-sm text-gray-500">E-mail</span>
                        <span className="text-right text-sm font-medium text-gray-900">
                          {String(
                            detailsModal.detail?.credenciadoSnapshot?.email ??
                              "-",
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-700">
                    <AlertTriangle className="h-5 w-5" />
                    Descrição inicial do dano
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-700">
                    {detailsModal.detail?.damageDescription || "Não informado"}
                  </p>
                </div>

                {(detailsHistorico.isLoading ||
                  detailsHistorico.vistorias.length > 0) && (
                  <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-700">
                      <FileText className="h-5 w-5" />
                      Histórico de Vistorias
                    </h3>
                    {detailsHistorico.isLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Carregando histórico...
                      </p>
                    ) : (
                      <div className="relative space-y-0 pl-4 before:absolute before:left-1.75 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-gray-200">
                        {detailsHistorico.vistorias.map((v, idx) => (
                          <div key={v.id} className="relative pb-4 last:pb-0">
                            <span
                              className={cn(
                                "absolute -left-4 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                                v.status.toUpperCase().includes("REJEIT")
                                  ? "bg-red-400"
                                  : v.status.toUpperCase().includes("FINALIZ")
                                    ? "bg-emerald-400"
                                    : "bg-amber-400",
                              )}
                            />
                            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-medium text-gray-700">
                                  Vistoria{" "}
                                  {detailsHistorico.vistorias.length - idx}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "border text-xs",
                                    getVistoriaBadgeClass(v.status),
                                  )}
                                >
                                  {formatStatus(v.status)}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatDate(v.createdAt)}
                              </p>
                              {v.motivoRejeicao && (
                                <div className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1.5">
                                  <p className="text-xs font-medium text-red-700">
                                    Motivo da rejeição:
                                  </p>
                                  <p className="mt-0.5 text-xs text-red-600">
                                    {v.motivoRejeicao}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {detailsModal.card?.kanbanColumn === "analiseOperacional" && (
                  <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-700">
                      <AlertTriangle className="h-5 w-5" />
                      Alertas da IA
                    </h3>

                    {detailsAlertas.isLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Carregando alertas...
                      </p>
                    ) : detailsAlertas.alertas.length === 0 ? (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        Nenhuma inconformidade encontrada.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {detailsAlertas.alertas.map((alerta) => {
                          const isCritical = alerta.type === "critical";
                          const isWarning = alerta.type === "warning";
                          const borderColor = isCritical
                            ? "border-l-red-500"
                            : isWarning
                              ? "border-l-amber-500"
                              : "border-l-blue-400";
                          const bgColor = isCritical
                            ? "bg-red-50"
                            : isWarning
                              ? "bg-amber-50"
                              : "bg-blue-50/50";
                          const badgeClass = isCritical
                            ? "border-red-200 bg-red-100 text-red-700"
                            : isWarning
                              ? "border-amber-200 bg-amber-100 text-amber-700"
                              : "border-blue-200 bg-blue-100 text-blue-700";
                          const badgeLabel = isCritical
                            ? "Crítico"
                            : isWarning
                              ? "Atenção"
                              : "Informativo";

                          return (
                            <div
                              key={alerta.id}
                              className={cn(
                                "rounded-r-xl border-l-4 p-4",
                                borderColor,
                                bgColor,
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-foreground">
                                  {alerta.title}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "shrink-0 border text-xs",
                                    badgeClass,
                                  )}
                                >
                                  {badgeLabel}
                                </Badge>
                              </div>
                              {alerta.description && (
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                  {alerta.description}
                                </p>
                              )}
                              {alerta.createdAt && (
                                <p className="mt-2 text-xs text-muted-foreground/60">
                                  {formatDate(alerta.createdAt)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="flex w-full justify-end gap-3 sm:justify-between">
            {detailsModal.card?.kanbanColumn === "analiseOperacional" ? (
              <Button type="button" onClick={handleOpenApprovalFromDetails}>
                Finalizar Vistoria
              </Button>
            ) : (
              <span />
            )}
            <Button variant="outline" onClick={closeDetailsModal}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingCard)}
        onOpenChange={(open) => !open && setDeletingCard(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar sinistro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove permanentemente o registro e não poderá ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={linkModal.open}
        onOpenChange={(open) =>
          !open &&
          (() => {
            setLinkModal({
              open: false,
              card: null,
              selectedCredenciadoId: "",
            });
            setLinkOfficeSearch("");
            setLinkOfficeComboboxOpen(false);
          })()
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-blue-900">
              Vincular Oficina
            </DialogTitle>
            <DialogDescription className="mb-2 text-sm text-gray-500">
              Para mover de Entrada para Aguardando Check-in, selecione uma
              oficina credenciada.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2.5">
            <Label className="text-sm text-slate-700">
              Oficina credenciada
            </Label>
            <Popover
              open={linkOfficeComboboxOpen}
              onOpenChange={setLinkOfficeComboboxOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={linkOfficeComboboxOpen}
                  className="h-11 w-full justify-between rounded-lg border-slate-300 px-3 text-left"
                >
                  <span className="truncate text-left">
                    {linkModal.selectedCredenciadoId
                      ? selectedOficina
                        ? `${selectedOficina.nome}${
                            selectedOficina.cidade
                              ? ` • ${selectedOficina.cidade}${
                                  selectedOficina.uf
                                    ? `/${selectedOficina.uf}`
                                    : ""
                                }`
                              : ""
                          }`
                        : "Oficina selecionada"
                      : isOficinasLoading
                        ? "Carregando oficinas..."
                        : "Selecione uma oficina"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar por nome ou cidade..."
                    value={linkOfficeSearch}
                    onValueChange={setLinkOfficeSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhuma oficina encontrada.</CommandEmpty>
                    <CommandGroup>
                      {filteredOficinas.map((oficina) => (
                        <CommandItem
                          key={oficina.id}
                          value={`${oficina.nome} ${oficina.cidade ?? ""} ${oficina.uf ?? ""}`}
                          onSelect={() => {
                            setLinkModal((cur) => ({
                              ...cur,
                              selectedCredenciadoId: oficina.id,
                            }));
                            setLinkOfficeComboboxOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              linkModal.selectedCredenciadoId === oficina.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span className="truncate">
                            {oficina.nome}
                            {oficina.cidade
                              ? ` • ${oficina.cidade}${oficina.uf ? `/${oficina.uf}` : ""}`
                              : ""}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="mt-2 flex w-full justify-end gap-3">
            <Button
              variant="outline"
              disabled={isLinking}
              onClick={() =>
                (() => {
                  setLinkModal({
                    open: false,
                    card: null,
                    selectedCredenciadoId: "",
                  });
                  setLinkOfficeSearch("");
                  setLinkOfficeComboboxOpen(false);
                })()
              }
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmVincular}
              disabled={isLinking || !linkModal.selectedCredenciadoId}
              className={cn(!linkModal.selectedCredenciadoId && "opacity-50")}
            >
              {isLinking ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Vinculando...
                </span>
              ) : (
                "Confirmar vínculo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={checkinModal.open}
        onOpenChange={(open) =>
          !open && setCheckinModal({ open: false, card: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar chegada física?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação registra o check-in do veículo e move para Check-in
              Realizado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCheckingIn}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCheckin}
              disabled={isCheckingIn}
            >
              {isCheckingIn ? "Confirmando..." : "Confirmar chegada"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={approvalModal.open}
        onOpenChange={(open) => !open && closeApprovalModal()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Finalizar Vistoria</DialogTitle>
            <DialogDescription>
              Revise o relatório de alertas da IA e tome a decisão final de
              aprovação ou rejeição.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-5 p-1">
              {/* Bloco 1 — Resumo do sinistro */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sinistro
                </p>
                <p className="mt-1 text-base font-bold text-foreground">
                  {approvalModal.card?.protocol ?? "-"}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {approvalModal.card?.clienteSnapshot?.nomeCompleto ??
                      approvalModal.card?.clientesSnapshot?.nomeCompleto ??
                      approvalModal.card?.clienteNome ??
                      "Cliente não informado"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    {approvalModal.card?.placa ?? "Sem placa"}
                  </span>
                  {approvalModal.card?.oficinaNome && (
                    <span className="flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5" />
                      {approvalModal.card.oficinaNome}
                    </span>
                  )}
                </div>
              </div>

              {/* Bloco 2 — Relatório da IA */}
              <div>
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Relatório da IA
                </p>

                {approvalModal.isLoadingAlertas ? (
                  <p className="text-sm text-muted-foreground">
                    Carregando relatório...
                  </p>
                ) : approvalModal.alertas.length === 0 ? (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm text-emerald-700">
                      Nenhuma inconformidade encontrada.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvalModal.alertas.map((alerta) => {
                      const isCritical = alerta.type === "critical";
                      const isWarning = alerta.type === "warning";
                      const borderColor = isCritical
                        ? "border-l-red-500"
                        : isWarning
                          ? "border-l-amber-500"
                          : "border-l-blue-400";
                      const bgColor = isCritical
                        ? "bg-red-50"
                        : isWarning
                          ? "bg-amber-50"
                          : "bg-blue-50/50";
                      const badgeClass = isCritical
                        ? "border-red-200 bg-red-100 text-red-700"
                        : isWarning
                          ? "border-amber-200 bg-amber-100 text-amber-700"
                          : "border-blue-200 bg-blue-100 text-blue-700";
                      const badgeLabel = isCritical
                        ? "Crítico"
                        : isWarning
                          ? "Atenção"
                          : "Informativo";

                      return (
                        <div
                          key={alerta.id}
                          className={cn(
                            "rounded-r-xl border-l-4 p-4",
                            borderColor,
                            bgColor,
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-foreground">
                              {alerta.title}
                            </p>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "shrink-0 border text-xs",
                                badgeClass,
                              )}
                            >
                              {badgeLabel}
                            </Badge>
                          </div>
                          {alerta.description && (
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                              {alerta.description}
                            </p>
                          )}
                          {alerta.createdAt && (
                            <p className="mt-2 text-xs text-muted-foreground/60">
                              {formatDate(alerta.createdAt)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Ver Vistoria Completa — bloco Bloco 3 */}
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto gap-1.5 px-0 text-sm font-normal text-slate-500 underline-offset-4 hover:bg-transparent hover:text-slate-700 hover:underline"
                    onClick={handleOpenFullVistoria}
                    disabled={
                      !approvalModal.card?.id ||
                      isFinalizing ||
                      isRejectSubmitting
                    }
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver Vistoria
                  </Button>
                </div>
              </div>

              {/* Bloco de rejeição — visível apenas quando isRejecting */}
              {isRejecting && (
                <div className="grid gap-2 rounded-xl border border-red-200 bg-red-50 p-4">
                  <Label
                    htmlFor="reject-reason"
                    className="text-sm font-semibold text-red-800"
                  >
                    Motivo da Rejeição{" "}
                    <span className="font-normal text-red-600">
                      (obrigatório — será enviado à oficina)
                    </span>
                  </Label>
                  <Textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Descreva claramente o motivo da reprovação para retorno à oficina..."
                    className="min-h-24 border-red-300 bg-white focus-visible:ring-red-400"
                    disabled={isRejectSubmitting}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            {isRejecting ? (
              <div className="flex w-full justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-4"
                  onClick={() => {
                    setIsRejecting(false);
                    setRejectReason("");
                  }}
                  disabled={isRejectSubmitting}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-9 px-4"
                  onClick={handleConfirmReject}
                  disabled={isRejectSubmitting || !rejectReason.trim()}
                >
                  {isRejectSubmitting ? "Rejeitando..." : "Confirmar Rejeição"}
                </Button>
              </div>
            ) : (
              <div className="flex w-full justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 px-4"
                  onClick={closeApprovalModal}
                  disabled={isFinalizing}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-9 px-4"
                  onClick={() => setIsRejecting(true)}
                  disabled={isFinalizing}
                >
                  Rejeitar Vistoria
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 px-4"
                  onClick={handleConfirmFinalizar}
                  disabled={isFinalizing}
                >
                  {isFinalizing ? "Finalizando..." : "Finalizar Vistoria"}
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
