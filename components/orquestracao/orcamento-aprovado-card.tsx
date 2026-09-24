"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { doc, onSnapshot, type Timestamp } from "firebase/firestore";
import { CheckCircle2, FileWarning } from "lucide-react";

import { db } from "@/lib/firebase";
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

type OrcamentoAprovado = {
  status?: "gerando" | "pronto" | "erro" | "sem_orcamento";
  url?: string;
  valorTotal?: number;
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

function formatCurrency(value?: number) {
  return (value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Aparece só depois que o sinistro é aprovado (finalizar) — é quando a
// Cloud Function onSinistroFinalizado dispara a geração desse PDF. Reflete
// sinistro.orcamentoAprovado em tempo real, mesmo padrão do LaudoTecnicoCard.
export function OrcamentoAprovadoCard({
  sinistroId,
  variant = "card",
}: {
  sinistroId?: string;
  variant?: "card" | "inline";
}) {
  const [orcamento, setOrcamento] = useState<OrcamentoAprovado | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!sinistroId) return;
    const unsubscribe = onSnapshot(doc(db, "sinistro", sinistroId), (snap) => {
      const data = snap.data();
      setOrcamento((data?.orcamentoAprovado as OrcamentoAprovado | undefined) ?? null);
    });
    return () => unsubscribe();
  }, [sinistroId]);

  // Sem orçamento nenhum registrado (mecânico não preencheu em campo) — não
  // vale a pena mostrar um card vazio pra isso, só o "erro" silencioso já
  // documenta o motivo pra quem for investigar.
  if (!sinistroId || !orcamento || orcamento.status === "sem_orcamento") return null;

  const content = (
    <>
      {orcamento.status === "gerando" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="h-4 w-4" />
          Gerando o documento de orçamento aprovado...
        </div>
      )}

      {orcamento.status === "erro" && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Falha ao gerar o orçamento aprovado. {orcamento.erro ? `Detalhe: ${orcamento.erro}` : ""}
          </span>
        </div>
      )}

      {orcamento.status === "pronto" && (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => setViewerOpen(true)}>
            Ver orçamento aprovado
          </Button>
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {formatCurrency(orcamento.valorTotal)}
          </span>
          <span className="text-xs text-muted-foreground">
            Gerado em {formatDate(orcamento.geradoEm)}
          </span>
        </div>
      )}

      {orcamento.status === "pronto" && orcamento.url && (
        <OrcamentoViewerDialog
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          url={orcamento.url}
        />
      )}
    </>
  );

  if (variant === "inline") return content;

  return (
    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/10">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-5 w-5" />
        Orçamento Aprovado
      </h3>
      {content}
    </div>
  );
}

function OrcamentoViewerDialog({
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
          <DialogTitle>Orçamento Aprovado</DialogTitle>
          <DialogDescription>
            Documento de autorização de reparo, com os valores aprovados pra oficina faturar.
          </DialogDescription>
        </DialogHeader>

        <PdfViewer
          url={`/api/laudo-proxy?url=${encodeURIComponent(url)}`}
          className="min-h-0 w-full min-w-0 flex-1"
        />

        <DialogFooter className="shrink-0">
          <a
            href={`/api/laudo-proxy?url=${encodeURIComponent(url)}&download=1`}
            download="orcamento-aprovado.pdf"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Baixar PDF
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
