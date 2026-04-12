"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageHeader } from "@/components/layout/page-header"
import { AlertasHeader } from "@/components/alertas/alertas-header"
import { AlertasFeed, type Alerta } from "@/components/alertas/alertas-feed"
import { useRouter } from "next/navigation"

const alertasData: Alerta[] = [
  {
    id: "ALT-001",
    tipo: "critico",
    titulo: "Sinistro #CLM-1024: IA sinalizou inconsistência grave foto vs. áudio",
    descricao: "A análise multimodal detectou divergência significativa entre as fotos do veículo e a descrição de áudio do segurado. Padrão compatível com fraude documentada.",
    sinistroId: "CLM-1024",
    dataHora: "há 5 min",
    categoria: "Possível Fraude",
    lido: false
  },
  {
    id: "ALT-002",
    tipo: "critico",
    titulo: "Sinistro #CLM-1089: Dano oculto identificado pela visão computacional",
    descricao: "Sistema de IA detectou danos estruturais não reportados no chassi do veículo. Severidade reclassificada de Média para Grande Monta.",
    sinistroId: "CLM-1089",
    dataHora: "há 12 min",
    categoria: "Dano Oculto Detectado",
    lido: false
  },
  {
    id: "ALT-003",
    tipo: "critico",
    titulo: "Sinistro #CLM-987: Inconsistência em documentação CRLV",
    descricao: "Verificação automática identificou possível adulteração no documento CRLV anexado. Requer análise manual imediata.",
    sinistroId: "CLM-987",
    dataHora: "há 28 min",
    categoria: "Inconsistência Documental",
    lido: false
  },
  {
    id: "ALT-004",
    tipo: "sla",
    titulo: "Sinistro #CLM-1056: SLA de vistoria técnica violado",
    descricao: "O prazo de 48h para conclusão da vistoria técnica foi excedido. Sinistro aguardando há 52 horas na oficina Elite Motors.",
    sinistroId: "CLM-1056",
    dataHora: "há 1 hora",
    categoria: "SLA Violado",
    lido: false
  },
  {
    id: "ALT-005",
    tipo: "sla",
    titulo: "Sinistro #CLM-1078: Prazo de regulamentação em risco",
    descricao: "Faltam apenas 4 horas para o vencimento do SLA de regulamentação técnica. Prioridade de ação recomendada.",
    sinistroId: "CLM-1078",
    dataHora: "há 2 horas",
    categoria: "SLA Crítico",
    lido: false
  },
  {
    id: "ALT-006",
    tipo: "sla",
    titulo: "Sinistro #CLM-1034: Atraso na etapa de orçamentação",
    descricao: "Oficina AutoPrime não enviou orçamento dentro do prazo estipulado. Contato automático enviado.",
    sinistroId: "CLM-1034",
    dataHora: "há 3 horas",
    categoria: "Atraso Regulação",
    lido: false
  },
  {
    id: "ALT-007",
    tipo: "sistema",
    titulo: "Falha na integração com API da Detran-SP",
    descricao: "Timeout na consulta de dados veiculares. Sistema tentará reconexão automática em 15 minutos.",
    dataHora: "há 45 min",
    categoria: "Falha API",
    lido: false
  },
  {
    id: "ALT-008",
    tipo: "sistema",
    titulo: "Erro de sincronização com sistema ERP",
    descricao: "A sincronização de dados financeiros com o sistema ERP falhou. Dados de liquidação podem estar desatualizados.",
    dataHora: "há 2 horas",
    categoria: "Erro Integração",
    lido: false
  },
  {
    id: "ALT-009",
    tipo: "sistema",
    titulo: "Timeout no serviço de análise de imagens",
    descricao: "O microserviço de visão computacional está apresentando latência acima do esperado. Time de infraestrutura notificado.",
    dataHora: "há 4 horas",
    categoria: "Timeout Sistema",
    lido: false
  },
  {
    id: "ALT-010",
    tipo: "lido",
    titulo: "Sinistro #CLM-956: Análise de fraude concluída",
    descricao: "Investigação finalizada. Sinistro confirmado como legítimo após análise detalhada.",
    sinistroId: "CLM-956",
    dataHora: "ontem",
    categoria: "Possível Fraude",
    lido: true
  },
  {
    id: "ALT-011",
    tipo: "lido",
    titulo: "Sinistro #CLM-912: SLA normalizado",
    descricao: "Atraso resolvido após intervenção manual. Processo retomado dentro do prazo.",
    sinistroId: "CLM-912",
    dataHora: "ontem",
    categoria: "SLA Violado",
    lido: true
  },
  {
    id: "ALT-012",
    tipo: "lido",
    titulo: "Integração Detran-RJ restabelecida",
    descricao: "Conexão com a API da Detran-RJ foi normalizada após manutenção programada.",
    dataHora: "há 2 dias",
    categoria: "Falha API",
    lido: true
  }
]

export default function AlertasPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("critico")
  const [alertas, setAlertas] = useState(alertasData)

  const counts = {
    critico: alertas.filter(a => a.tipo === "critico" && !a.lido).length,
    sla: alertas.filter(a => a.tipo === "sla" && !a.lido).length,
    sistema: alertas.filter(a => a.tipo === "sistema" && !a.lido).length,
    lidos: alertas.filter(a => a.lido).length
  }

  const filteredAlertas = alertas.filter(alerta => {
    if (activeTab === "lidos") return alerta.lido
    return alerta.tipo === activeTab && !alerta.lido
  })

  const handleMarcarLido = (id: string) => {
    setAlertas(prev => prev.map(a => 
      a.id === id ? { ...a, lido: true, tipo: "lido" as const } : a
    ))
  }

  const handleIrParaAnalise = (sinistroId: string) => {
    router.push(`/orquestracao?sinistro=${sinistroId}`)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Central de Inteligência e Alertas"
          description="Monitore anomalias, violações de SLA e notificações do sistema em tempo real"
        />

        {/* Tabs Filter */}
        <AlertasHeader 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          counts={counts}
        />

        {/* Alerts Feed */}
        <AlertasFeed 
          alertas={filteredAlertas}
          onMarcarLido={handleMarcarLido}
          onIrParaAnalise={handleIrParaAnalise}
        />
      </div>
    </AppLayout>
  )
}
