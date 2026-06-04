"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/api-client";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface VistoriaListItem {
  id: string;
  sinistroId: string;
  status: string;
  tipoVistoria: string | null;
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
  const res = await apiFetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<VistoriasListResponse>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVistoriasList(options?: { status?: string; tipoVistoria?: string }) {
  const params = new URLSearchParams();
  if (options?.status) params.set("status", options.status);
  if (options?.tipoVistoria) params.set("tipoVistoria", options.tipoVistoria);
  const qs = params.toString();
  const url = qs ? `/api/vistorias?${qs}` : "/api/vistorias";

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
