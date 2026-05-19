"use client";

import useSWR from "swr";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface VistoriaListItem {
  id: string;
  sinistroId: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  veiculo: string;
  placa: string;
  cliente: string;
  credenciado: string;
  local: string;
  data: string;
  hora: string;
}

interface VistoriasListResponse {
  vistorias: VistoriaListItem[];
  total: number;
}

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function fetcher(url: string): Promise<VistoriasListResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<VistoriasListResponse>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVistoriasList(status?: string) {
  const url = status ? `/api/vistorias?status=${encodeURIComponent(status)}` : "/api/vistorias";

  const { data, error, isLoading, mutate } = useSWR<VistoriasListResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
      // Revalida a cada 30s para capturar mudanças de status no Firestore
      refreshInterval: 30_000,
    },
  );

  return {
    vistorias: data?.vistorias ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error: error as Error | undefined,
    reload: mutate,
  };
}
