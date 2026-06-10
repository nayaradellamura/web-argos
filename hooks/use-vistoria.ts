"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-client";
import type { LaudoAnalitico } from "@/lib/types/firestore";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface VistoriaDetalhe {
  id: string;
  sinistroId: string | null;
  status: string;
  tipoVistoria: string | null;
  retificacaoAtualId: string | null;
  vistoriaOrigemId: string | null;
  motivoRejeicao: string | null;
  ajustesNecessarios: string | null;
  motivoCancelamento: string | null;
  laudo: string | null;
  pdfLaudoUrl: string | null;
  alertas: unknown;
  laudo_analitico: LaudoAnalitico | null;
  createdAt: string | null;
  updatedAt: string | null;

  // Campos derivados do sinistro pai
  placa: string;
  veiculo: string | null;
  cliente: string;
  credenciado: string;
  local: string | null;
  data: string | null;

  // Mídia
  images:
    | Record<string, unknown>
    | Array<Record<string, unknown> | string>
    | null;
  audios:
    | Record<string, unknown>
    | Array<Record<string, unknown> | string>
    | string[]
    | null;
  chatmessages: ChatMessage[];

  // Subcoleção de áudios com transcrições
  audiosSubcollection: AudioSubcollectionItem[];
}

export interface ChatMessage {
  role: string;
  text: string;
  createdAt: string | null;
}

export interface AudioSubcollectionItem {
  id: string;
  transcricaoOriginal?: string | null;
  transcricaoRevisada?: string | null;
  transcriptionStatus?: string | null;
  reviewStatus?: string | null;
  agentReply?: string | null;
}

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function fetcher(url: string): Promise<VistoriaDetalhe> {
  const res = await apiFetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<VistoriaDetalhe>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVistoria(id: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<VistoriaDetalhe>(
    id ? `/api/vistorias/${id}` : null,
    fetcher,
    {
      // Não revalida automaticamente: dados de vistoria mudam apenas por ação do usuário
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Mantém o dado anterior enquanto recarrega (evita flash de skeleton em reaberturas)
      keepPreviousData: true,
    },
  );

  return {
    vistoria: data ?? null,
    isLoading,
    isError: !!error,
    error: error as Error | undefined,
    reload: mutate,
  };
}
