"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { RegistrosHeader } from "../../components/registros/registros-header";
import { ClientesTable } from "@/components/registros/clientes-table";
import { ParceirosTable } from "@/components/registros/parceiros-table";
import { VeiculosTable } from "@/components/registros/veiculos-table";
import { TabsContent, Tabs } from "@/components/ui/tabs";

export default function RegistrosPage() {
  const [activeTab, setActiveTab] = useState("parceiros");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Gestão de Cadastros e Acessos"
          description="Gerencie clientes, veículos e liberação de acesso dos parceiros"
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

            <TabsContent value="parceiros" className="m-0">
              <ParceirosTable searchQuery={searchQuery} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
