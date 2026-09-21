"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// pdf.js precisa de um worker rodando fora da thread principal. Aponta pro
// CDN na mesma versão que o react-pdf empacota — evita ter que configurar
// bundling de worker no Next.js/Turbopack.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.2;
const SCALE_STEP = 0.15;
const CONTAINER_PADDING = 32; // p-4 nos dois lados

export function PdfViewer({ url, className }: { url: string; className?: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fitWidth = Math.max(containerWidth - CONTAINER_PADDING, 200);

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border/60 bg-muted/20",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-card px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {numPages ? `${numPages} página${numPages > 1 ? "s" : ""} — role para ler` : "Carregando…"}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={scale <= MIN_SCALE}
            onClick={() => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[42px] text-center text-xs font-medium text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={scale >= MAX_SCALE}
            onClick={() => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* overflow-y: rolagem contínua entre páginas (é o que ajuda a
          "navegar" um arquivo grande). overflow-x: hidden como segunda
          trava — a principal é o max-width:100% forçado no canvas abaixo,
          que garante que a página NUNCA estoura o container mesmo se a
          largura calculada em JS estiver errada. */}
      <div
        ref={scrollRef}
        className={[
          "min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4",
          "[&::-webkit-scrollbar]:w-2.5",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border",
          "[&_.react-pdf__Page]:mx-auto [&_.react-pdf__Page]:!bg-transparent",
          "[&_.react-pdf__Page+.react-pdf__Page]:mt-4",
          "[&_.react-pdf__Page canvas]:!h-auto [&_.react-pdf__Page canvas]:!max-w-full [&_.react-pdf__Page canvas]:rounded-md [&_.react-pdf__Page canvas]:shadow-md",
        ].join(" ")}
      >
        <Document
          file={url}
          onLoadSuccess={({ numPages: total }) => setNumPages(total)}
          loading={
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          }
          error={
            <p className="py-16 text-center text-sm text-destructive">
              Não foi possível carregar o PDF.
            </p>
          }
        >
          {containerWidth > 0 &&
            Array.from({ length: numPages ?? 0 }, (_, i) => i + 1).map((pageNumber) => (
              <Page
                key={pageNumber}
                pageNumber={pageNumber}
                width={fitWidth * scale}
                loading={
                  <div className="flex items-center justify-center py-16">
                    <Spinner className="h-6 w-6 text-primary" />
                  </div>
                }
              />
            ))}
        </Document>
      </div>
    </div>
  );
}
