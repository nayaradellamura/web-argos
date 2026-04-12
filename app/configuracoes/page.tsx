"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { PerfilSettings } from "@/components/configuracoes/perfil-settings";
import { NotificacoesSettings } from "@/components/configuracoes/notificacoes-settings";
import { IASettings } from "@/components/configuracoes/ia-settings";
import { AparenciaSettings } from "@/components/configuracoes/aparencia-settings";
import { cn } from "@/lib/utils";
import { User, Bell, Brain, Palette } from "lucide-react";

type SettingsTab = "perfil" | "notificacoes" | "ia" | "aparencia";

interface MenuItem {
  id: SettingsTab;
  nome: string;
  descricao: string;
  icon: React.ReactNode;
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("perfil");

  const menuItems: MenuItem[] = [
    {
      id: "perfil",
      nome: "Meu Perfil",
      descricao: "Informações pessoais",
      icon: <User className="h-5 w-5" />,
    },
    {
      id: "notificacoes",
      nome: "Notificações e Alertas",
      descricao: "Preferências de avisos",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      id: "ia",
      nome: "Motor de IA",
      descricao: "Triagem inteligente",
      icon: <Brain className="h-5 w-5" />,
    },
    {
      id: "aparencia",
      nome: "Aparência",
      descricao: "Tema da interface",
      icon: <Palette className="h-5 w-5" />,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "perfil":
        return <PerfilSettings />;
      case "notificacoes":
        return <NotificacoesSettings />;
      case "ia":
        return <IASettings />;
      case "aparencia":
        return <AparenciaSettings />;
      default:
        return <PerfilSettings />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Configurações do Sistema"
          description="Gerencie suas preferências, alertas e parâmetros do motor de Inteligência Artificial"
        />

        {/* Layout com Menu Lateral */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Menu Lateral Interno */}
          <nav className="w-full lg:w-64 shrink-0">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card hover:bg-muted text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      activeTab === item.id
                        ? "bg-primary-foreground/20"
                        : "bg-muted",
                    )}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.nome}</p>
                    <p
                      className={cn(
                        "text-xs",
                        activeTab === item.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.descricao}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </nav>

          {/* Área de Conteúdo */}
          <div className="flex-1 min-w-0">{renderContent()}</div>
        </div>
      </div>
    </AppLayout>
  );
}
