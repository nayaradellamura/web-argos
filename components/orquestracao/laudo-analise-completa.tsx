"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LaudoAnalitico } from "@/lib/types/firestore";

// Espelha o JSON que o Gemini devolve em services/laudo-service/lib/gemini.js —
// é o que fica salvo em sinistro.laudoTecnico.achados a partir do laudo em PDF.
export type LaudoTecnicoAchados = {
  resumoExecutivo?: string;
  danosIdentificados?: Array<{
    localizacao?: string;
    descricao: string;
    gravidade?: "leve" | "moderada" | "grave";
    fotoReferencia?: number | null;
  }>;
  classificacaoContran?: string;
  justificativaClassificacao?: string;
  nivelConfianca?: "alto" | "médio" | "baixo";
  incongruenciaDetectada?: boolean;
  detalhesIncongruencia?: string;
  evidenciasSuficientes?: boolean;
  observacoesAdicionais?: string;
  recomendacoes?: string;
};

type AnaliseView = {
  severidade?: string;
  incongruenciaDetectada: boolean;
  detalhesIncongruencia?: string;
  evidenciasSuficientes: boolean;
  confiancaLabel?: string;
  resumo?: string;
  analiseAudio?: string;
  justificativa?: string;
  observacoes?: string;
  recomendacao?: string;
  danos: Array<{ titulo?: string; descricao: string }>;
};

function buildAnaliseView(
  achados?: LaudoTecnicoAchados,
  legacy?: LaudoAnalitico,
): AnaliseView | null {
  // Achados do pipeline novo (Gemini + PDF) tem prioridade — é a fonte mais
  // recente. O laudo_analitico antigo (chat + ADK) só entra como fallback
  // pra vistorias de antes da troca de agente, que nunca vão ganhar achados.
  if (achados) {
    return {
      severidade: achados.classificacaoContran,
      incongruenciaDetectada: !!achados.incongruenciaDetectada,
      detalhesIncongruencia: achados.detalhesIncongruencia,
      evidenciasSuficientes: !!achados.evidenciasSuficientes,
      confiancaLabel: achados.nivelConfianca,
      resumo: achados.resumoExecutivo,
      justificativa: achados.justificativaClassificacao,
      observacoes: achados.observacoesAdicionais,
      recomendacao: achados.recomendacoes,
      danos: (achados.danosIdentificados ?? []).map((d) => ({
        titulo: d.localizacao,
        descricao: d.gravidade ? `${d.descricao} (${d.gravidade})` : d.descricao,
      })),
    };
  }
  if (legacy) {
    return {
      severidade: legacy.severidade_contran !== "N/A" ? legacy.severidade_contran : undefined,
      incongruenciaDetectada: legacy.incongruencia_detectada,
      detalhesIncongruencia: legacy.detalhes_incongruencia,
      evidenciasSuficientes: legacy.evidencias_suficientes,
      confiancaLabel: `${legacy.indice_confianca_ia}/100`,
      resumo: legacy.analise_visual,
      analiseAudio: legacy.analise_audio,
      recomendacao: legacy.recomendacao_auditoria,
      danos: (legacy.pecas_visivelmente_afetadas ?? []).map((peca) => ({ descricao: peca })),
    };
  }
  return null;
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {titulo}
      </p>
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{children}</p>
    </div>
  );
}

// Prévia unificada da análise de IA de uma vistoria — badges de resumo +
// accordion "Ver análise completa" com o texto integral. Funciona tanto com
// os achados do laudo em PDF (pipeline novo) quanto com o laudo_analitico
// antigo (pipeline por chat, pré-migração pro agente ADK), o que vier.
export function LaudoAnaliseCompleta({
  achados,
  legacy,
  children,
}: {
  achados?: LaudoTecnicoAchados;
  legacy?: LaudoAnalitico;
  /** Conteúdo extra mostrado só quando a análise está expandida — ex: o
   * botão de abrir o PDF, que não faz sentido aparecer antes do clique. */
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const analise = buildAnaliseView(achados, legacy);

  if (!analise) return null;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-1.5">
        {analise.severidade && (
          <Badge
            variant="secondary"
            className="border border-slate-200 bg-slate-100 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          >
            {analise.severidade}
          </Badge>
        )}
        <Badge
          variant="secondary"
          className={cn(
            "border text-xs",
            analise.incongruenciaDetectada
              ? "border-red-200 bg-red-100 text-red-700 dark:border-red-900/50 dark:bg-red-900/35 dark:text-red-300"
              : "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/35 dark:text-emerald-300",
          )}
        >
          {analise.incongruenciaDetectada ? "Incongruência detectada" : "Sem incongruências"}
        </Badge>
        <Badge
          variant="secondary"
          className={cn(
            "border text-xs",
            analise.evidenciasSuficientes
              ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/35 dark:text-emerald-300"
              : "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/35 dark:text-amber-300",
          )}
        >
          {analise.evidenciasSuficientes ? "Evidências ✓" : "Evidências insuficientes"}
        </Badge>
        {analise.confiancaLabel && (
          <Badge
            variant="secondary"
            className="border border-slate-200 bg-slate-100 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          >
            Confiança: {analise.confiancaLabel}
          </Badge>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 flex w-full items-center justify-between border-t border-border/40 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        <span className="text-xs text-muted-foreground">Ver análise completa</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-border/40 py-3">
          {analise.resumo && <Secao titulo="Resumo / Análise Visual">{analise.resumo}</Secao>}
          {analise.analiseAudio && <Secao titulo="Análise de Áudio">{analise.analiseAudio}</Secao>}
          {analise.justificativa && (
            <Secao titulo="Justificativa da Classificação">{analise.justificativa}</Secao>
          )}
          {analise.detalhesIncongruencia && (
            <Secao titulo="Detalhes da Incongruência">{analise.detalhesIncongruencia}</Secao>
          )}
          {analise.observacoes && (
            <Secao titulo="Observações Adicionais">{analise.observacoes}</Secao>
          )}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Peças / Danos Identificados
            </p>
            {analise.danos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma peça identificada</p>
            ) : (
              <ul className="space-y-1">
                {analise.danos.map((dano, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                    <span>
                      {dano.titulo && <strong className="font-medium">{dano.titulo}: </strong>}
                      {dano.descricao}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {analise.recomendacao && <Secao titulo="Recomendação">{analise.recomendacao}</Secao>}
          {children && <div className="border-t border-border/40 pt-3">{children}</div>}
        </div>
      )}
    </div>
  );
}
