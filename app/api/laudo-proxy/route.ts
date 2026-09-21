import { NextResponse } from "next/server";

export const runtime = "nodejs";

// GET /api/laudo-proxy?url=<download URL do Firebase Storage>
//
// O endpoint de download do Firebase Storage não manda cabeçalhos de CORS,
// então o fetch() que o pdf.js/react-pdf usa pra ler o PDF é bloqueado pelo
// navegador quando chamado direto (ao contrário de um <iframe> ou <img>, que
// não passam por CORS). Esse proxy busca o arquivo no servidor — sem CORS
// entre servidores — e devolve pro navegador já na mesma origem.
//
// Restrito a URLs do bucket do Storage do próprio projeto, pra não virar um
// proxy aberto pra qualquer URL.
const ALLOWED_PREFIX =
  "https://firebasestorage.googleapis.com/v0/b/fho-argos.firebasestorage.app/o/";

function filenameFromStorageUrl(target: string): string {
  try {
    const encodedPath = new URL(target).pathname.split("/o/")[1] ?? "";
    const decoded = decodeURIComponent(encodedPath).split("/").pop();
    return decoded || "laudo-tecnico.pdf";
  } catch {
    return "laudo-tecnico.pdf";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");
  const forceDownload = requestUrl.searchParams.get("download") === "1";

  if (!target || !target.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json(
      { error: "URL inválida ou fora do bucket permitido." },
      { status: 400 },
    );
  }

  const upstream = await fetch(target, {
    headers: request.headers.get("range")
      ? { Range: request.headers.get("range")! }
      : undefined,
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: "Falha ao buscar o arquivo no Storage." },
      { status: upstream.status },
    );
  }

  const headers = new Headers();
  for (const key of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
  ]) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }
  headers.set("cache-control", "private, max-age=300");

  if (forceDownload) {
    const filename = filenameFromStorageUrl(target);
    headers.set(
      "content-disposition",
      `attachment; filename="laudo-tecnico.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
