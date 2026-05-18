import type { SinistroStatus } from "@/lib/types/firestore";

/** Filtros clicáveis nos KPI cards (sem "total" e sem "inconformidades") */
export type DashboardFilter =
  | "aguardandoVinculo"
  | "aguardandoCheckin"
  | "checkinRealizado"
  | "emVistoria"
  | "aguardandoAceite";

/** Tipo da tabela independente exibida no corpo da página */
export type TipoTabela = "geral" | "rejeitadas" | "alertasIA";

export type SlaHealth = "healthy" | "warning" | "critical";

/** Agora com apenas 5 propriedades (sem `total` e sem `totalInconformidades`) */
export interface DashboardKpis {
  aguardandoVinculo: number;
  aguardandoCheckin: number;
  checkinRealizado: number;
  emVistoria: number;
  aguardandoAceite: number;
}

export interface DashboardClaim {
  id: string;
  placa: string;
  oficina: string;
  credenciadoId?: string | null;
  severidade:
    | "Leve"
    | "Media"
    | "Grande Monta"
    | "Baixa"
    | "Média"
    | "Alta"
    | "Crítica";
  /** Status macro do sinistro (3 valores definitivos do backend) */
  status: SinistroStatus | string;
  /** Campo exclusivo da tabela "Rejeitadas" */
  motivoRejeicao?: string;
  dataHora?: string;
  transcriptionStatus?: "pending" | "done";
  hasCriticalIaAlert?: boolean;
  daysInStage?: number;
  slaLimitDays?: number;
  slaHealth?: SlaHealth;
}

export interface DashboardAlert {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  /** ISO 8601 timestamp vindo da API (ex: "2026-05-16T14:30:00Z") */
  createdAt?: string;
  /** fallback legível quando a API não retorna createdAt */
  time?: string;
  sinistroId?: string;
}
