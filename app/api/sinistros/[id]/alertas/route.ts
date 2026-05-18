import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// GET /api/sinistros/[id]/alertas
// Retorna todos os alertas vinculados ao sinistro.
// Ausência de alertas é sucesso: retorna 200 com array vazio.

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
  return new Date(value as string).getTime();
}

function tipoToType(tipo: unknown): "critical" | "warning" | "info" {
  const val = String(tipo ?? "").toLowerCase();
  if (val === "critico" || val === "critical") return "critical";
  if (val === "sla" || val === "warning") return "warning";
  return "info";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getAdminDb();

    // Sem orderBy para evitar necessidade de índice composto.
    // Ordenação feita em memória.
    const alertasSnap = await db
      .collection("alertas")
      .where("sinistroId", "==", id)
      .get();

    const alertas = alertasSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          sinistroId: (data.sinistroId as string | undefined) ?? id,
          type: tipoToType(data.tipo),
          title: (data.titulo as string | undefined) ?? "",
          description: (data.descricao as string | undefined) ?? "",
          categoria: (data.categoria as string | undefined) ?? "",
          lido: Boolean(data.lido),
          createdAt: serializeTs(data.dataHora),
          _ts: toMs(data.dataHora),
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts: _, ...rest }) => rest);

    return NextResponse.json({ sinistroId: id, alertas, total: alertas.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json(
      { error: "Falha ao buscar alertas.", details: message },
      { status: 500 },
    );
  }
}
