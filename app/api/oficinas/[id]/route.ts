import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth, AuthError } from "@/lib/auth-server";

export const runtime = "nodejs";

const COLLECTION = "credenciados";

type RouteContext = { params: Promise<{ id: string }> };

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    nome: toText(data.nome),
    cnpj: toText(data.cnpj),
    cidade: toText(data.cidade),
    especialidade: toText(data.especialidade),
    telefone: toText(data.telefone),
    email: toText(data.email),
    status: toText(data.status) || "Ativo",
    score: toNumber(data.score, 5.0),
    slaMedia: toNumber(data.slaMedia, 3.0),
  };
}

async function resolveId(raw: string) {
  return decodeURIComponent(raw ?? "").trim();
}

// ── GET /api/oficinas/[id] ────────────────────────────────────────────────────
// Retorna: { oficina }

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAuth(request);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: (e as Error).message }, { status: 401 });
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }
  try {

    const { id } = await context.params;
    const oficinalId = await resolveId(id);

    if (!oficinalId) {
      return NextResponse.json(
        { error: "ID da oficina é obrigatório." },
        { status: 400 },
      );
    }

    const docRef = getAdminDb().collection(COLLECTION).doc(oficinalId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Oficina não encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      oficina: mapDoc(snap.id, snap.data() as Record<string, unknown>),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar oficina.";

    return NextResponse.json(
      { error: "Falha ao buscar oficina.", details: message },
      { status: 500 },
    );
  }
}

// ── PUT /api/oficinas/[id] ────────────────────────────────────────────────────
// Atualização completa — valida todos os campos obrigatórios.
// Body: { nome, cnpj, cidade, especialidade?, telefone?, email, status?, score?, slaMedia? }
// Retorna: { success, id }

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAuth(request);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: (e as Error).message }, { status: 401 });
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }
  try {

    const { id } = await context.params;
    const oficinalId = await resolveId(id);

    if (!oficinalId) {
      return NextResponse.json(
        { error: "ID da oficina é obrigatório." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));

    const nome = toText(body.nome);
    const cnpj = toText(body.cnpj);
    const cidade = toText(body.cidade);
    const email = toText(body.email);

    if (!nome || !cnpj || !cidade || !email) {
      return NextResponse.json(
        { error: "Preencha Nome, CNPJ, Cidade/UF e E-mail." },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    const docRef = getAdminDb().collection(COLLECTION).doc(oficinalId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Oficina não encontrada." },
        { status: 404 },
      );
    }

    const payload: Record<string, unknown> = {
      nome,
      nomeSearch: nome.toLowerCase(),
      cnpj,
      cidade,
      especialidade: toText(body.especialidade),
      telefone: toText(body.telefone),
      email,
      atualizadoEm: FieldValue.serverTimestamp(),
    };

    if (body.status !== undefined) {
      payload.status = toText(body.status);
    }

    if (body.score !== undefined) {
      payload.score = toNumber(body.score, 5.0);
    }

    if (body.slaMedia !== undefined) {
      payload.slaMedia = toNumber(body.slaMedia, 3.0);
    }

    await docRef.set(payload, { merge: true });

    return NextResponse.json({ success: true, id: oficinalId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar oficina.";

    return NextResponse.json(
      { error: "Falha ao atualizar oficina.", details: message },
      { status: 500 },
    );
  }
}

// ── PATCH /api/oficinas/[id] ──────────────────────────────────────────────────
// Atualização parcial — só os campos enviados no body são alterados.
// Útil para toggles de status (ex: { status: "Suspenso" }) sem reenviar o form completo.
// Retorna: { success, id }

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAuth(request);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: (e as Error).message }, { status: 401 });
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }
  try {

    const { id } = await context.params;
    const oficinalId = await resolveId(id);

    if (!oficinalId) {
      return NextResponse.json(
        { error: "ID da oficina é obrigatório." },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));

    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo enviado para atualização." },
        { status: 400 },
      );
    }

    const docRef = getAdminDb().collection(COLLECTION).doc(oficinalId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Oficina não encontrada." },
        { status: 404 },
      );
    }

    // Remove campos que nunca devem ser sobrescritos via patch
    const { id: _id, criadoEm: _criadoEm, ...rest } = body as Record<
      string,
      unknown
    >;

    const payload: Record<string, unknown> = {
      ...rest,
      atualizadoEm: FieldValue.serverTimestamp(),
    };

    // Mantém nomeSearch sincronizado quando nome é alterado via patch
    if (typeof payload.nome === "string") {
      payload.nomeSearch = payload.nome.toLowerCase();
    }

    await docRef.set(payload, { merge: true });

    return NextResponse.json({ success: true, id: oficinalId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar oficina.";

    return NextResponse.json(
      { error: "Falha ao atualizar oficina.", details: message },
      { status: 500 },
    );
  }
}

// ── DELETE /api/oficinas/[id] ─────────────────────────────────────────────────
// Soft-delete: altera o status para "Inativo" em vez de excluir o documento.
// Preserva o histórico de sinistros que referenciam este credenciadoId.
// Retorna: { success, id }

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireAuth(request);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: (e as Error).message }, { status: 401 });
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }
  try {

    const { id } = await context.params;
    const oficinalId = await resolveId(id);

    if (!oficinalId) {
      return NextResponse.json(
        { error: "ID da oficina é obrigatório." },
        { status: 400 },
      );
    }

    const docRef = getAdminDb().collection(COLLECTION).doc(oficinalId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Oficina não encontrada." },
        { status: 404 },
      );
    }

    // .update() altera apenas os campos especificados e garante persistência atômica.
    // Lança exceção se o documento sumir entre o .get() e o .update() (race condition),
    // que o catch abaixo captura e devolve como 500.
    await docRef.update({
      status: "Inativo",
      atualizadoEm: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: oficinalId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir oficina.";

    return NextResponse.json(
      { error: "Falha ao excluir oficina.", details: message },
      { status: 500 },
    );
  }
}
