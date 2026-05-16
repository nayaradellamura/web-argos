"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RegistrosHeaderProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function RegistrosHeader({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: RegistrosHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {activeTab === "clientes" ? "Novo Cliente" : "Novo Veículo"}
                </DialogTitle>
                <DialogDescription>
                  {activeTab === "clientes"
                    ? "A criação de clientes permanece disponível nesta tela."
                    : "A criação de veículos permanece disponível nesta tela."}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                Se quiser, eu posso recolocar aqui o formulário completo depois.
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
