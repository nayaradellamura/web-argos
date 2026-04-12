"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Tema = "claro" | "escuro" | "sistema";

interface TemaOption {
  id: Tema;
  nome: string;
  descricao: string;
  icon: React.ReactNode;
}

export function AparenciaSettings() {
  const [temaSelecionado, setTemaSelecionado] = useState<Tema>("claro");

  const temas: TemaOption[] = [
    {
      id: "claro",
      nome: "Claro",
      descricao: "Tema claro padrão",
      icon: <Sun className="h-6 w-6" />,
    },
    {
      id: "escuro",
      nome: "Escuro",
      descricao: "Tema escuro para ambientes com pouca luz",
      icon: <Moon className="h-6 w-6" />,
    },
    {
      id: "sistema",
      nome: "Sistema",
      descricao: "Seguir as preferências do sistema operacional",
      icon: <Monitor className="h-6 w-6" />,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Tema da Interface</CardTitle>
          <CardDescription>
            Escolha como você deseja visualizar o sistema Argos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {temas.map((tema) => (
              <button
                key={tema.id}
                onClick={() => setTemaSelecionado(tema.id)}
                className={cn(
                  "relative flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all hover:border-primary/50",
                  temaSelecionado === tema.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card",
                )}
              >
                {temaSelecionado === tema.id && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg",
                    temaSelecionado === tema.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tema.icon}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">{tema.nome}</Label>
                  <p className="text-xs text-muted-foreground">
                    {tema.descricao}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Prévia do Tema</CardTitle>
          <CardDescription>
            Veja como o tema selecionado será aplicado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "rounded-lg border p-4",
              temaSelecionado === "escuro"
                ? "bg-zinc-900 border-zinc-700"
                : "bg-background border-border",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  temaSelecionado === "escuro" ? "bg-blue-600" : "bg-primary",
                )}
              >
                <span className="text-primary-foreground font-bold">A</span>
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    temaSelecionado === "escuro"
                      ? "text-zinc-100"
                      : "text-foreground",
                  )}
                >
                  Argos
                </p>
                <p
                  className={cn(
                    "text-xs",
                    temaSelecionado === "escuro"
                      ? "text-zinc-400"
                      : "text-muted-foreground",
                  )}
                >
                  Sistema de gestão pericial de sinistros
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
