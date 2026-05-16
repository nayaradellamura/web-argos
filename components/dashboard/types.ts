export type DashboardFilter =
  | "total"
  | "semVinculo"
  | "aguardandoCheckin"
  | "andamento"
  | "inconformidades";

export type SlaHealth = "healthy" | "warning" | "critical";

export interface DashboardKpis {
  total: number;
  semVinculo: number;
  aguardandoCheckin: number;
  andamento: number;
  inconformidades: number;
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
  status:
    | "Aberto"
    | "Em Analise"
    | "Em andamento"
    | "Pendente"
    | "Concluído"
    | "Liquidado";
  dataHora?: string;
  vistoriaStatus?:
    | "Aguardando vínculo"
    | "Aguardando check-in"
    | "aguardando check-in"
    | "Pendente"
    | "pendente"
    | "Agendada"
    | "Em andamento"
    | "Em check-in"
    | "Realizada"
    | "Abandonada";
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
