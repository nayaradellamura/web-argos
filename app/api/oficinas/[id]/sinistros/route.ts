import { NextResponse } from "next/server";
import type { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toMs(value: unknown): number {
  if (!value) return 0;
  if (typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  const parsed = new Date(toText(value)).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapSinistroDoc(doc: QueryDocumentSnapshot<DocumentData>) {
  const data = doc.data();
  const veiculoSnap =
    (data.veiculoSnapshot as Record<string, string> | undefined) ?? {};

  const marca = toText(veiculoSnap.marca);
  const modelo = toText(veiculoSnap.modelo);
  const veiculo =
    [marca, modelo].filter(Boolean).join(" ") || toText(data.vehicle);

  return {
    id: toText(data.protocol) || doc.id,
    placa: toText(veiculoSnap.placa) || toText(data.plate),
    veiculo,
    status: toText(data.status),
    entryDate: toText(data.entryDate),
    priority: toText(data.priority),
  };
}

// ── GET /api/oficinas/[id]/sinistros ─────────────────────────────────────────
// Retorna o histórico de sinistros que passaram pela oficina (credenciadoId == id).
// Parâmetros: page (int), limit (int, máx 50)
// Retorna: { historico, totalCount, page, limit }
//
// Ordenação por entryDate desc é feita em memória para evitar índice composto
// (credenciadoId + entryDate). Para volumes altos, crie o índice e substitua por:
//   baseQuery.orderBy("entryDate", "desc").offset(offset).limit(limit).get()

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const credenciadoId = decodeURIComponent(id ?? "").trim();

    if (!credenciadoId) {
      return NextResponse.json(
        { error: "ID da oficina é obrigatório." },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(
      1,
      parseInt(searchParams.get("page") ?? "1", 10) || 1,
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10),
    );
    const offset = (page - 1) * limit;

    const db = getAdminDb();
    const sinistros = db.collection("sinistro");

    const baseQuery = sinistros.where("credenciadoId", "==", credenciadoId);

    const [countSnap, docsSnap] = await Promise.all([
      baseQuery.count().get(),
      baseQuery.get(),
    ]);

    const totalCount = countSnap.data().count;

    const historico = docsSnap.docs
      .slice()
      .sort((a, b) => toMs(b.data().entryDate) - toMs(a.data().entryDate))
      .slice(offset, offset + limit)
      .map(mapSinistroDoc);

    return NextResponse.json({ historico, totalCount, page, limit });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao buscar histórico de sinistros.";

    return NextResponse.json(
      { error: "Falha ao buscar histórico de sinistros.", details: message },
      { status: 500 },
    );
  }
}
