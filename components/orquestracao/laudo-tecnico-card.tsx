"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { doc, onSnapshot, type Timestamp } from "firebase/firestore";
import { FileCheck2, FileWarning, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";

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
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
        <LaudoViewerDialog
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          sinistroId={sinistroId}
          url={laudo.url}
        />
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

function LaudoViewerDialog({
  open,
  onOpenChange,
  sinistroId,
  url,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sinistroId: string;
  url: string;
}) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [ajustesNecessarios, setAjustesNecessarios] = useState("");

  const resetAndClose = () => {
    setShowRejectForm(false);
    setMotivoRejeicao("");
    setAjustesNecessarios("");
    onOpenChange(false);
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      const res = await apiFetch(`/api/sinistros/${sinistroId}/finalizar`, {
        method: "PATCH",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Falha ao aprovar vistoria.");

      toast({ title: "Vistoria aprovada", description: "Sinistro finalizado." });
      resetAndClose();
    } catch (err) {
      toast({
        title: "Erro ao aprovar",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!motivoRejeicao.trim() || !ajustesNecessarios.trim()) {
      toast({
        title: "Preencha os campos",
        description: "Motivo e ajustes necessários são obrigatórios para reprovar.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsRejecting(true);
      const res = await apiFetch(`/api/sinistros/${sinistroId}/rejeitar`, {
        method: "PATCH",
        body: JSON.stringify({ motivoRejeicao, ajustesNecessarios }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Falha ao reprovar vistoria.");

      toast({
        title: "Vistoria reprovada",
        description: "A oficina precisará refazer a inspeção.",
      });
      resetAndClose();
    } catch (err) {
      toast({
        title: "Erro ao reprovar",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(next) : resetAndClose())}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Laudo Técnico</DialogTitle>
          <DialogDescription>
            Gerado automaticamente pela IA a partir das evidências coletadas em campo.
            Revise antes de aprovar ou reprovar a vistoria.
          </DialogDescription>
        </DialogHeader>

        <PdfViewer
          url={`/api/laudo-proxy?url=${encodeURIComponent(url)}`}
          className="min-h-0 w-full min-w-0 flex-1"
        />

        {showRejectForm ? (
          <div className="shrink-0 space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="motivoRejeicao">Motivo da reprovação</Label>
              <Textarea
                id="motivoRejeicao"
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Ex: evidências fotográficas não correspondem ao veículo."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ajustesNecessarios">Ajustes necessários</Label>
              <Textarea
                id="ajustesNecessarios"
                value={ajustesNecessarios}
                onChange={(e) => setAjustesNecessarios(e.target.value)}
                placeholder="Ex: solicitar novas fotos do veículo sinistrado."
                rows={2}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter className="shrink-0 items-center sm:justify-between">
          <a
            href={`/api/laudo-proxy?url=${encodeURIComponent(url)}&download=1`}
            download="laudo-tecnico.pdf"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Baixar PDF
          </a>
          <div className="flex flex-wrap gap-2">
            {showRejectForm ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setShowRejectForm(false)}
                  disabled={isRejecting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isRejecting}
                >
                  {isRejecting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar reprovação
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isApproving}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Reprovar
                </Button>
                <Button onClick={handleApprove} disabled={isApproving}>
                  {isApproving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  Aprovar
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
