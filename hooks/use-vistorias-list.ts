"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { collection, onSnapshot } from "firebase/firestore";
import { apiFetch } from "@/lib/api-client";
import { db } from "@/lib/firebase";

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
      // O listener abaixo já revalida na hora que algo muda no Firestore —
      // esse intervalo é só uma rede de segurança.
      refreshInterval: 60_000,
    },
  );

  // Antes ficava só no poll de 30s (janela de até 30s pra uma mudança de
  // status aparecer). Ouvir a coleção direto do Firestore torna isso quase
  // instantâneo, sem aumentar o número de leituras — só dispara quando um
  // documento muda de verdade.
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "vistorias"),
      () => {
        mutate();
      },
      (err) => {
        console.error("[useVistoriasList] listener de vistorias falhou:", err);
      },
    );
    return () => unsubscribe();
  }, [mutate]);

  return {
    vistorias: data?.vistorias ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error: error as Error | undefined,
    reload: mutate,
  };
}
