"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Brain, Sparkles, Zap, ShieldCheck, Info } from "lucide-react"

export function IASettings() {
  const [confiancaMinima, setConfiancaMinima] = useState([85])
  const [aprovacaoAutomatica, setAprovacaoAutomatica] = useState(true)
  const [cruzamentoMultimodal, setCruzamentoMultimodal] = useState(true)
  const [deteccaoFraude, setDeteccaoFraude] = useState(true)

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Motor de IA - Triagem Inteligente</CardTitle>
              <CardDescription>
                Configure os parâmetros do motor de Inteligência Artificial (Gemini)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Slider de Confiança */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Grau de Confiança Mínimo da IA
                </Label>
                <p className="text-xs text-muted-foreground">
                  Nível mínimo para aceitar o laudo cruzado (Foto + Áudio)
                </p>
              </div>
              <Badge variant="secondary" className="text-lg font-semibold px-3">
                {confiancaMinima[0]}%
              </Badge>
            </div>
            <Slider
              value={confiancaMinima}
              onValueChange={setConfiancaMinima}
              max={100}
              min={50}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50% (Permissivo)</span>
              <span>75% (Balanceado)</span>
              <span>100% (Rigoroso)</span>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Toggles de IA */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  <Zap className="h-5 w-5 text-green-500" />
                </div>
                <div className="space-y-1">
                  <Label 
                    htmlFor="aprovacao-auto"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Aprovação Automática de Pequena Monta
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sinistros classificados como pequena monta serão aprovados automaticamente
                  </p>
                </div>
              </div>
              <Switch
                id="aprovacao-auto"
                checked={aprovacaoAutomatica}
                onCheckedChange={setAprovacaoAutomatica}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <Label 
                    htmlFor="cruzamento"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Análise Multimodal (Foto + Áudio)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Habilitar cruzamento inteligente entre imagens e descrição em áudio
                  </p>
                </div>
              </div>
              <Switch
                id="cruzamento"
                checked={cruzamentoMultimodal}
                onCheckedChange={setCruzamentoMultimodal}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  <ShieldCheck className="h-5 w-5 text-destructive" />
                </div>
                <div className="space-y-1">
                  <Label 
                    htmlFor="fraude"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Detecção Ativa de Fraude
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Analise proativa de padrões suspeitos e inconsistências nos sinistros
                  </p>
                </div>
              </div>
              <Switch
                id="fraude"
                checked={deteccaoFraude}
                onCheckedChange={setDeteccaoFraude}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-4">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Powered by Google Gemini
            </p>
            <p className="text-xs text-muted-foreground">
              O motor de IA utiliza modelos avançados de visão computacional e processamento 
              de linguagem natural para análise multimodal de sinistros.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
