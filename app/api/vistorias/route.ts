import { NextResponse } from "next/server";
import type { DocumentData } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// ── Helpers ───────────────────────────────────────────────────────────────────

function serializeTs(value: unknown): string | null {
  if (!value) return null;
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : null;
}

function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function extractHora(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ── GET /api/vistorias ────────────────────────────────────────────────────────
// Retorna todas as vistorias com dados básicos para preencher os cards da listagem.
// Query param opcional: ?status=EM_ANDAMENTO (filtra por status)
// Resposta: { vistorias: VistoriaListItem[], total: number }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Normaliza para minúsculo antes de consultar o Firestore (dados legados em snake_case)
    const statusFilter = searchParams.get("status")?.toLowerCase() ?? "";

    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db.collection("vistorias");

    if (statusFilter) {
      query = query.where("status", "==", statusFilter);
    }

    const snap = await query.get();

    if (snap.empty) {
      return NextResponse.json({ vistorias: [], total: 0 });
    }

    // Coleta sinistroIds únicos para busca em lote
    const sinistroIdSet = new Set<string>();
    for (const doc of snap.docs) {
      const sid = doc.data().sinistroId as string | undefined;
      if (sid) sinistroIdSet.add(sid);
    }

    // Busca sinistros em chunks de 30 (limite do operador `in` do Firestore)
    const sinistroMap = new Map<string, DocumentData>();
    if (sinistroIdSet.size > 0) {
      const chunks = chunkArray(Array.from(sinistroIdSet), 30);
      const snapshots = await Promise.all(
        chunks.map((chunk) =>
          db.collection("sinistro").where("__name__", "in", chunk).get(),
        ),
      );
      for (const sSnap of snapshots) {
        for (const sDoc of sSnap.docs) sinistroMap.set(sDoc.id, sDoc.data());
      }
    }

    // Monta e ordena por createdAt desc
    const vistorias = snap.docs
      .map((doc) => {
        const v = doc.data();
        const sinistroId = String(v.sinistroId ?? "");
        const sData = sinistroMap.get(sinistroId) ?? {};

        const veiculoSnap = sData.veiculoSnapshot as Record<string, unknown> | undefined;
        const clienteSnap = sData.clienteSnapshot as Record<string, unknown> | undefined;
        const credSnap    = sData.credenciadoSnapshot as Record<string, unknown> | undefined;

        const createdAt = serializeTs(v.createdAt);

        return {
          id:          doc.id,
          sinistroId,
          // Normaliza para MAIÚSCULO — o frontend espera enums em SCREAMING_SNAKE_CASE
          status:      String(v.status ?? "").toUpperCase(),
          createdAt,
          updatedAt:   serializeTs(v.updatedAt),
          _ts:         toMs(v.createdAt),

          // Derivados do sinistro pai
          veiculo:     [veiculoSnap?.marca, veiculoSnap?.modelo].filter(Boolean).join(" "),
          placa:       String(veiculoSnap?.placa ?? sData.placa ?? ""),
          cliente:     String(clienteSnap?.nomeCompleto ?? clienteSnap?.nome ?? ""),
          credenciado: String(credSnap?.name ?? ""),
          local:       [credSnap?.city, credSnap?.uf].filter(Boolean).join(" - "),
          data:        createdAt ? createdAt.split("T")[0] : "",
          hora:        extractHora(createdAt),
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts: _, ...rest }) => rest);

    return NextResponse.json({ vistorias, total: vistorias.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao buscar vistorias.", details: message },
      { status: 500 },
    );
  }
}
