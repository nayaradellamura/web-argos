"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, AlertTriangle, Clock, Mail, MessageSquare, Smartphone } from "lucide-react"

interface NotificacaoItem {
  id: string
  titulo: string
  descricao: string
  icon: React.ReactNode
  ativo: boolean
}

export function NotificacoesSettings() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([
    {
      id: "sla-violado",
      titulo: "Notificar quando SLA for violado",
      descricao: "Receba um alerta imediato quando um sinistro ultrapassar o prazo definido",
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      ativo: true
    },
    {
      id: "fraude-ia",
      titulo: "Alerta imediato de possível fraude (IA)",
      descricao: "Notificação em tempo real quando a IA detectar inconsistências graves",
      icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
      ativo: true
    },
    {
      id: "resumo-diario",
      titulo: "E-mail diário com resumo de FNOLs despachados",
      descricao: "Relatório automático enviado todo dia às 18h com o resumo do dia",
      icon: <Mail className="h-5 w-5 text-primary" />,
      ativo: false
    },
    {
      id: "novos-sinistros",
      titulo: "Notificar novos sinistros atribuídos",
      descricao: "Seja alertado quando um novo sinistro for atribuído a você",
      icon: <Bell className="h-5 w-5 text-primary" />,
      ativo: true
    },
    {
      id: "mensagens-oficina",
      titulo: "Mensagens de oficinas credenciadas",
      descricao: "Receba notificações de comunicações das oficinas parceiras",
      icon: <MessageSquare className="h-5 w-5 text-muted-foreground" />,
      ativo: true
    },
    {
      id: "push-mobile",
      titulo: "Notificações push no celular",
      descricao: "Habilitar notificações push no aplicativo móvel Argos",
      icon: <Smartphone className="h-5 w-5 text-muted-foreground" />,
      ativo: false
    }
  ])

  const toggleNotificacao = (id: string) => {
    setNotificacoes(prev => 
      prev.map(n => n.id === id ? { ...n, ativo: !n.ativo } : n)
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Preferências de Notificação</CardTitle>
          <CardDescription>
            Configure quais alertas e notificações você deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {notificacoes.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-0.5">{item.icon}</div>
                  <div className="space-y-1">
                    <Label 
                      htmlFor={item.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {item.titulo}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {item.descricao}
                    </p>
                  </div>
                </div>
                <Switch
                  id={item.id}
                  checked={item.ativo}
                  onCheckedChange={() => toggleNotificacao(item.id)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
