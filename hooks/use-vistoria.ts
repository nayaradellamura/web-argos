"use client";

import useSWR from "swr";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface VistoriaDetalhe {
  id: string;
  sinistroId: string | null;
  status: string;
  motivoRejeicao: string | null;
  laudo: string | null;
  pdfLaudoUrl: string | null;
  alertas: unknown;
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
}

export interface ChatMessage {
  role: string;
  text: string;
  createdAt: string | null;
}

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function fetcher(url: string): Promise<VistoriaDetalhe> {
  const res = await fetch(url);
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
