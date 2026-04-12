"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { RegistrosHeader } from "@/components/registros/registros-header";
import { ClientesTable } from "@/components/registros/clientes-table";
import { VeiculosTable } from "@/components/registros/veiculos-table";
import { UsuariosTable } from "@/components/registros/usuarios-table";
import { TabsContent, Tabs } from "@/components/ui/tabs";

export default function RegistrosPage() {
  const [activeTab, setActiveTab] = useState("clientes");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Gestão de Cadastros e Dados"
          description="Gerencie clientes, veículos e usuários do sistema"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <RegistrosHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <div className="mt-6">
            <TabsContent value="clientes" className="m-0">
              <ClientesTable searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="veiculos" className="m-0">
              <VeiculosTable searchQuery={searchQuery} />
            </TabsContent>

            <TabsContent value="usuarios" className="m-0">
              <UsuariosTable searchQuery={searchQuery} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
