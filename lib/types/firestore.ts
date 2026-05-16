import { Timestamp } from "firebase/firestore";

export type SinistroStage =
  | "fnol" | "validacao" | "vistoria"
  | "orcamento" | "regulacao" | "liquidacao";

export interface Sinistro {
  id: string;
  vehicle: string;
  plate: string;
  workshop: string;
  entryDate: string;
  priority: "within-sla" | "attention" | "delayed";
  daysInStage: number;
  status: SinistroStage;
  credenciado?: string;
  statusVistoria?: "agendada" | "realizada" | "pendente";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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