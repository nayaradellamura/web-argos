import { Timestamp } from "firebase/firestore";

// Coleção `sinistros` — campo `status`
export type SinistroStatus = "PENDENTE" | "EM_ANDAMENTO" | "FINALIZADO";

// Coleção `vistorias` — campo `status`
export type VistoriaStatus =
  | "EM_ANDAMENTO"
  | "EM_ANALISE_OPERACIONAL"
  | "FINALIZADA"
  | "REJEITADA"
  | "CANCELADA";

// Estágios do Kanban gerencial (campo `stage`) — mantido para compatibilidade
export type SinistroStage =
  | "fnol" | "validacao" | "vistoria"
  | "orcamento" | "regulacao" | "liquidacao";

export interface ClienteSnapshot {
  nome?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
}

export interface VeiculoSnapshot {
  placa?: string;
  marca?: string;
  modelo?: string;
  ano?: string | number;
  chassi?: string;
  cor?: string;
}

export interface SeguradoraSnapshot {
  name?: string;
  cnpj?: string;
}

export interface CredenciadoSnapshot {
  name?: string;
  cnpj?: string;
  cidade?: string;
  telefone?: string;
}

export interface Sinistro {
  id: string;
  protocol: string;
  status: SinistroStatus;
  priority: string;
  claimType?: string;
  damageDescription?: string;
  observations?: string;
  clienteId: string;
  veiculoId: string;
  seguradoraId: string;
  credenciadoId?: string | null;
  checkInAt?: Timestamp | null;
  entryDate?: Timestamp | string;
  clienteSnapshot?: ClienteSnapshot;
  veiculoSnapshot?: VeiculoSnapshot;
  seguradorasSnapshot?: SeguradoraSnapshot;
  credenciadoSnapshot?: CredenciadoSnapshot | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Vistoria {
  id: string;
  sinistroId: string;
  status: VistoriaStatus;
  tipoVistoria?: "ORIGINAL" | "RETIFICACAO";
  retificacaoAtualId?: string;
  vistoriaOrigemId?: string;
  motivoRejeicao?: string;
  ajustesNecessarios?: string;
  motivoCancelamento?: string;
  laudo_analitico?: LaudoAnalitico;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface LaudoAnalitico {
  analise_audio: string;
  analise_visual: string;
  detalhes_incongruencia: string;
  evidencias_suficientes: boolean;
  incongruencia_detectada: boolean;
  indice_confianca_ia: number;
  pecas_visivelmente_afetadas: string[];
  recomendacao_auditoria: string;
  severidade_contran: string;
}

export interface AudioSubcollectionItem {
  id: string;
  transcricaoOriginal?: string | null;
  transcricaoRevisada?: string | null;
  transcriptionStatus?: string | null;
  reviewStatus?: string | null;
  agentReply?: string | null;
}

export interface Credenciado {
  id: string;
  name: string;
  status: "ativo" | "pendente" | "suspenso";
  cidade?: string;
  especialidade?: string;
  qualityScore?: number;
  cnpj?: string;
}

export interface Alerta {
  id: string;
  tipo: "critico" | "sla" | "info";
  titulo: string;
  descricao: string;
  sinistroId: string;
  dataHora: Timestamp;
  categoria: string;
  lido: boolean;
  uid?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  status: "ativo" | "inativo";
}

export interface Veiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  clienteId: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
}