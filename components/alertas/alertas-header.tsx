"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, Server, CheckCircle } from "lucide-react"

interface AlertasHeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  counts: {
    critico: number
    sla: number
    sistema: number
    lidos: number
  }
}

export function AlertasHeader({ activeTab, onTabChange, counts }: AlertasHeaderProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="bg-card border border-border h-11 p-1 gap-1">
        <TabsTrigger 
          value="critico" 
          className="gap-2 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Críticos</span>
          <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
            {counts.critico}
          </Badge>
        </TabsTrigger>
        <TabsTrigger 
          value="sla" 
          className="gap-2 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600"
        >
          <Clock className="h-4 w-4" />
          <span>Atrasos SLA</span>
          <Badge className="ml-1 h-5 px-1.5 text-xs bg-amber-500/20 text-amber-700 hover:bg-amber-500/20">
            {counts.sla}
          </Badge>
        </TabsTrigger>
        <TabsTrigger 
          value="sistema" 
          className="gap-2 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600"
        >
          <Server className="h-4 w-4" />
          <span>Integração/Sistema</span>
          <Badge className="ml-1 h-5 px-1.5 text-xs bg-blue-500/20 text-blue-700 hover:bg-blue-500/20">
            {counts.sistema}
          </Badge>
        </TabsTrigger>
        <TabsTrigger 
          value="lidos" 
          className="gap-2 data-[state=active]:bg-muted data-[state=active]:text-muted-foreground"
        >
          <CheckCircle className="h-4 w-4" />
          <span>Lidos</span>
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {counts.lidos}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
