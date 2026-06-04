import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { apiFetch } from "@/lib/api-client";

function ensureDocId(id: unknown, entity: string): string {
  if (typeof id === "string" && id.trim()) {
    return id;
  }

  if (typeof id === "number" && Number.isFinite(id)) {
    return String(id);
  }

  throw new Error(`ID inválido para ${entity}: ${String(id)}`);
}

function sanitizeUpdatePayload<T extends { id?: unknown }>(data: Partial<T>) {
  const { id: _id, ...payload } = data;
  return payload;
}

async function assertApiSuccess(response: Response, action: string) {
  if (response.ok) return;

  const body = await response.json().catch(() => ({}));
  const details =
    typeof body?.details === "string"
      ? body.details
      : typeof body?.error === "string"
        ? body.error
        : "Erro desconhecido";

  throw new Error(`Falha ao ${action}: ${details}`);
}

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
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Cliente);
}

export async function updateCliente(
  id: string,
  data: Partial<Cliente>,
): Promise<void> {
  const docId = ensureDocId(id, "cliente");
  const response = await apiFetch(`/api/clientes/${encodeURIComponent(docId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sanitizeUpdatePayload(data)),
  });

  await assertApiSuccess(response, "atualizar cliente");
}

export async function deleteCliente(id: string): Promise<void> {
  const docId = ensureDocId(id, "cliente");
  const response = await apiFetch(`/api/clientes/${encodeURIComponent(docId)}`, {
    method: "DELETE",
  });

  await assertApiSuccess(response, "excluir cliente");
}

// ─── VEÍCULOS ─────────────────────────────────────────────

export async function getVeiculos(): Promise<Veiculo[]> {
  const snap = await getDocs(collection(db, "veiculos"));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Veiculo);
}

export async function updateVeiculo(
  id: string,
  data: Partial<Veiculo>,
): Promise<void> {
  const docId = ensureDocId(id, "veículo");
  const response = await apiFetch(`/api/veiculos/${encodeURIComponent(docId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sanitizeUpdatePayload(data)),
  });

  await assertApiSuccess(response, "atualizar veículo");
}

export async function deleteVeiculo(id: string): Promise<void> {
  const docId = ensureDocId(id, "veículo");
  const response = await apiFetch(`/api/veiculos/${encodeURIComponent(docId)}`, {
    method: "DELETE",
  });

  await assertApiSuccess(response, "excluir veículo");
}

export async function getUsuarios(): Promise<Usuario[]> {
  const snap = await getDocs(collection(db, "usuarios"));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Usuario);
}

export async function updateUsuario(
  id: string,
  data: Partial<Usuario>,
): Promise<void> {
  const docId = ensureDocId(id, "usuário");
  await updateDoc(doc(db, "usuarios", docId), sanitizeUpdatePayload(data));
}

export async function deleteUsuario(id: string): Promise<void> {
  const docId = ensureDocId(id, "usuário");
  await deleteDoc(doc(db, "usuarios", docId));
}
