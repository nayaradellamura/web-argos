import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import type { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const COLLECTION = "credenciados";

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapDoc(id: string, data: DocumentData) {
  // Campos gravados em inglês no Firestore; mapeados para português na resposta.
  // Fallback para a chave em português caso algum documento futuro use o novo padrão.
  return {
    id,
    nome: toText(data.name) || toText(data.nome),
    cnpj: toText(data.cnpj),
    cidade: toText(data.city) || toText(data.cidade),
    especialidade: toText(data.specialty) || toText(data.especialidade),
    telefone: toText(data.phone) || toText(data.telefone),
    email: toText(data.email),
    status: toText(data.status) || "Ativo",
    score: toNumber(data.score, 5.0),
    slaMedia: toNumber(data.slaMedia, 3.0),
  };
}

function matchesSearch(doc: QueryDocumentSnapshot<DocumentData>, search: string) {
  const data = doc.data();
  // Prioridade: nomeSearch (lowercase pré-computado) → name (inglês) → nome (português)
  const nomeSearch =
    toText(data.nomeSearch) ||
    toText(data.name).toLowerCase() ||
    toText(data.nome).toLowerCase();
  return nomeSearch.startsWith(search);
}

// ── GET /api/oficinas ─────────────────────────────────────────────────────────
// Parametros: page (int), limit (int, max 50), search (string, prefixo no nome)
// Retorna: { oficinas, totalCount, page, limit }
//
// Filtragem, ordenacao e paginacao sao feitas em memoria para evitar qualquer
// dependencia de indices compostos no Firestore. Documentos criados manualmente
// (sem campo criadoEm ou nomeSearch) aparecem normalmente.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(
      1,
      parseInt(searchParams.get("page") ?? "1", 10) || 1,
    );
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10),
    );
    const search = toText(searchParams.get("search")).toLowerCase();
    const offset = (page - 1) * limit;

    // Busca pura, sem orderBy ou where, para nao excluir documentos que nao
    // possuem os campos de indice (criadoEm, nomeSearch, etc.).
    const snap = await getAdminDb().collection(COLLECTION).get();

    let docs = snap.docs as QueryDocumentSnapshot<DocumentData>[];

    // Exclui documentos marcados como inativos (soft-delete).
    // Comparação case-insensitive cobre variações de capitalização no banco.
    docs = docs.filter(
      (doc) => toText(doc.data().status).toLowerCase() !== "inativo",
    );

    if (search) {
      docs = docs.filter((doc) => matchesSearch(doc, search));
    }

    // Ordena alfabeticamente pelo nome de exibição (aceita name ou nome)
    docs = docs.slice().sort((a, b) => {
      const nameA = (toText(a.data().name) || toText(a.data().nome)).toLowerCase();
      const nameB = (toText(b.data().name) || toText(b.data().nome)).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const totalCount = docs.length;
    const pageDocs = docs.slice(offset, offset + limit);

    const sinistros = getAdminDb().collection("sinistro");

    // Conta sinistros vinculados apenas para os documentos da página atual.
    // count() não lê os documentos, apenas retorna o total — operação leve.
    // Todas as contagens rodam em paralelo para minimizar latência.
    const sinistrosCounts = await Promise.all(
      pageDocs.map((doc) =>
        sinistros.where("credenciadoId", "==", doc.id).count().get(),
      ),
    );

    const oficinas = pageDocs.map((doc, i) => ({
      ...mapDoc(doc.id, doc.data()),
      totalSinistros: sinistrosCounts[i].data().count,
    }));

    return NextResponse.json({ oficinas, totalCount, page, limit });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar oficinas.";

    return NextResponse.json(
      { error: "Falha ao listar oficinas.", details: message },
      { status: 500 },
    );
  }
}

// ── POST /api/oficinas ────────────────────────────────────────────────────────
// Body: { nome, cnpj, cidade, especialidade?, telefone?, email, slaMedia? }
// Retorna: 201 { success, oficina }

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const nome = toText(body.nome);
    const cnpj = toText(body.cnpj);
    const cidade = toText(body.cidade);
    const especialidade = toText(body.especialidade);
    const telefone = toText(body.telefone);
    const email = toText(body.email);
    const slaMedia = toNumber(body.slaMedia, 3.0);

    if (!nome || !cnpj || !cidade || !email) {
      return NextResponse.json(
        { error: "Preencha Nome, CNPJ, Cidade/UF e E-mail." },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    const payload = {
      nome,
      nomeSearch: nome.toLowerCase(),
      cnpj,
      cidade,
      especialidade,
      telefone,
      email,
      status: "Ativo",
      score: 5.0,
      slaMedia,
      criadoEm: FieldValue.serverTimestamp(),
      atualizadoEm: FieldValue.serverTimestamp(),
    };

    const docRef = await getAdminDb().collection(COLLECTION).add(payload);

    return NextResponse.json(
      { success: true, oficina: { id: docRef.id, ...payload } },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar oficina.";

    return NextResponse.json(
      { error: "Falha ao criar oficina.", details: message },
      { status: 500 },
    );
  }
}
