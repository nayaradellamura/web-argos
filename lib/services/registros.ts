import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── TIPOS ────────────────────────────────────────────────

export interface Cliente {
  id: string;
  nomeCompleto: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  status: string;
  riscoHistorico: string;
  tipoPessoa: string;
  endereco?: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
}

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  marca: string;
  anoFabricacao: number;
  proprietario: string;
  clienteId: string;
  cor: string;
  combustivel: string;
  chassi: string;
  renavam: string;
  tipoCobertura: string;
  status: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  status: string;
  nivelAcesso: string;
  foto?: string;
  telefone?: string;
  ultimoAcesso?: Timestamp;
}

// ─── CLIENTES ─────────────────────────────────────────────

export async function getClientes(): Promise<Cliente[]> {
  const snap = await getDocs(collection(db, "clientes"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Cliente));
}

export async function updateCliente(
  id: string,
  data: Partial<Cliente>
): Promise<void> {
  await updateDoc(doc(db, "clientes", id), { ...data });
}

export async function deleteCliente(id: string): Promise<void> {
  await deleteDoc(doc(db, "clientes", id));
}

// ─── VEÍCULOS ─────────────────────────────────────────────

export async function getVeiculos(): Promise<Veiculo[]> {
  const snap = await getDocs(collection(db, "veiculos"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Veiculo));
}

export async function updateVeiculo(
  id: string,
  data: Partial<Veiculo>
): Promise<void> {
  await updateDoc(doc(db, "veiculos", id), { ...data });
}

export async function deleteVeiculo(id: string): Promise<void> {
  await deleteDoc(doc(db, "veiculos", id));
}



export async function getUsuarios(): Promise<Usuario[]> {
  const snap = await getDocs(collection(db, "usuarios"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Usuario));
}

export async function updateUsuario(
  id: string,
  data: Partial<Usuario>
): Promise<void> {
  await updateDoc(doc(db, "usuarios", id), { ...data });
}

export async function deleteUsuario(id: string): Promise<void> {
  await deleteDoc(doc(db, "usuarios", id));
}