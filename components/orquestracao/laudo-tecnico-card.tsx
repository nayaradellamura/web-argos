"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { doc, onSnapshot, type Timestamp } from "firebase/firestore";
import { FileCheck2, FileWarning } from "lucide-react";

import { db } from "@/lib/firebase";

// pdf.js usa APIs de navegador (DOMMatrix, Path2D) que não existem no
// server — precisa ficar fora do SSR do Next.js.
const PdfViewer = dynamic(
  () => import("@/components/orquestracao/pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6 text-primary" />
      </div>
    ),
  },
);
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LaudoAnaliseCompleta, type LaudoTecnicoAchados } from "@/components/orquestracao/laudo-analise-completa";
import type { LaudoAnalitico } from "@/lib/types/firestore";

type LaudoTecnico = {
  status?: "gerando" | "pronto" | "erro";
  url?: string;
  classificacaoContran?: string | null;
  achados?: LaudoTecnicoAchados;
  geradoEm?: Timestamp;
  erro?: string;
};

function formatDate(value?: Timestamp) {
  if (!value) return "-";
  try {
    return value.toDate().toLocaleString("pt-BR");
  } catch {
    return "-";
  }
}

// Reflete sinistro.laudoTecnico em tempo real — sem polling manual, o
// próprio listener do Firestore já "avisa" o front quando o laudo-service
// (Cloud Run) termina de gravar o resultado.
export function LaudoTecnicoCard({
  sinistroId,
  variant = "card",
  legacyAnalise,
}: {
  sinistroId?: string;
  /** "card": card próprio com título (uso padrão). "inline": só o conteúdo,
   * sem moldura nem título — pra embutir dentro de outro card já existente. */
  variant?: "card" | "inline";
  /** laudo_analitico antigo (pipeline por chat, pré-ADK) — usado como
   * fallback quando ainda não existe `achados` do pipeline novo. */
  legacyAnalise?: LaudoAnalitico;
}) {
  const [laudo, setLaudo] = useState<LaudoTecnico | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!sinistroId) return;
    const unsubscribe = onSnapshot(doc(db, "sinistro", sinistroId), (snap) => {
      const data = snap.data();
      setLaudo((data?.laudoTecnico as LaudoTecnico | undefined) ?? null);
    });
    return () => unsubscribe();
  }, [sinistroId]);

  if (!sinistroId) return null;

  const content = (
    <>
      {!laudo && !legacyAnalise && (
        <p className="text-sm text-muted-foreground">
          O laudo é gerado automaticamente quando a vistoria entra em análise
          operacional. Ainda não foi solicitado para este sinistro.
        </p>
      )}

      {laudo?.status === "gerando" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Laudo sendo processado pela IA — isso costuma levar menos de um
          minuto. Esta tela atualiza sozinha quando terminar.
        </div>
      )}

      {laudo?.status === "erro" && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Falha ao gerar o laudo. {laudo.erro ? `Detalhe: ${laudo.erro}` : ""}
          </span>
        </div>
      )}

      {(laudo?.achados || legacyAnalise) && (
        <LaudoAnaliseCompleta achados={laudo?.achados} legacy={legacyAnalise}>
          {laudo?.status === "pronto" && (
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={() => setViewerOpen(true)}>
                Ver laudo técnico
              </Button>
              <span className="text-xs text-muted-foreground">
                Gerado em {formatDate(laudo.geradoEm)}
              </span>
            </div>
          )}
        </LaudoAnaliseCompleta>
      )}

      {/* Sem análise disponível ainda — mostra o botão direto, sem accordion pra esconder atrás. */}
      {laudo?.status === "pronto" && !laudo.achados && !legacyAnalise && (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => setViewerOpen(true)}>
            Ver laudo técnico
          </Button>
          <span className="text-xs text-muted-foreground">
            Gerado em {formatDate(laudo.geradoEm)}
          </span>
        </div>
      )}

      {laudo?.status === "pronto" && laudo.url && (
        <LaudoViewerDialog open={viewerOpen} onOpenChange={setViewerOpen} url={laudo.url} />
      )}
    </>
  );

  if (variant === "inline") return content;

  return (
    <div className="mb-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
        <FileCheck2 className="h-5 w-5" />
        Laudo Técnico (IA)
      </h3>
      {content}
    </div>
  );
}

// Só visualização — aprovar/reprovar a vistoria vive num único lugar (o
// modal de aprovação do kanban), pra não ter duas ações fazendo a mesma
// coisa com nomes diferentes. Ver conversa que motivou isso: o dialog aqui
// tinha Aprovar/Reprovar próprios, redundantes com "Finalizar Vistoria" e
// "Rejeitar Vistoria" do kanban — confuso, removido de propósito.
export function LaudoViewerDialog({
  open,
  onOpenChange,
  url,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Laudo Técnico</DialogTitle>
          <DialogDescription>
            Gerado automaticamente pela IA a partir das evidências coletadas em campo.
          </DialogDescription>
        </DialogHeader>

        <PdfViewer
          url={`/api/laudo-proxy?url=${encodeURIComponent(url)}`}
          className="min-h-0 w-full min-w-0 flex-1"
        />

        <DialogFooter className="shrink-0">
          <a
            href={`/api/laudo-proxy?url=${encodeURIComponent(url)}&download=1`}
            download="laudo-tecnico.pdf"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Baixar PDF
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
