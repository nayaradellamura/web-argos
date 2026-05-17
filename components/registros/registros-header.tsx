"use client";

import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RegistrosHeaderProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
}

export function RegistrosHeader({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onCreateClick,
}: RegistrosHeaderProps) {
  const showCreateAction = activeTab !== "parceiros";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="veiculos">Veículos</TabsTrigger>
          <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === "parceiros"
                ? "Buscar parceiros..."
                : "Buscar registros..."
            }
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onSearchChange(e.target.value)
            }
            className="w-64 bg-card pl-9"
          />
        </div>

        {showCreateAction && (
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
        )}
      </div>
    </div>
  );
}
