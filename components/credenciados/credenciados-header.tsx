"use client";

import { useState } from "react";
import { Search, Plus, MapPin, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CredenciadosHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  cityFilter: string;
  onCityFilterChange: (value: string) => void;
  specialtyFilter: string;
  onSpecialtyFilterChange: (value: string) => void;
}

const cities = [
  "Todas",
  "Araras-SP",
  "Limeira-SP",
  "Piracicaba-SP",
  "Campinas-SP",
  "Rio Claro-SP",
];

const specialties = [
  "Todas",
  "Chapeacao Avancada",
  "Mecanica Geral",
  "Funilaria e Pintura",
  "Eletrica Automotiva",
  "Vidracaria",
];

export function CredenciadosHeader({
  searchQuery,
  onSearchChange,
  cityFilter,
  onCityFilterChange,
  specialtyFilter,
  onSpecialtyFilterChange,
}: CredenciadosHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [novoCredenciado, setNovoCredenciado] = useState({
    nome: "",
    cidade: "Araras-SP",
    especialidade: "Chapeacao Avancada",
    telefone: "",
    email: "",
    scoreInicial: "4.0",
    slaMedio: "3.0 dias",
    status: "ativo",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar oficina..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={cityFilter} onValueChange={onCityFilterChange}>
          <SelectTrigger className="w-40">
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={specialtyFilter} onValueChange={onSpecialtyFilterChange}>
          <SelectTrigger className="w-50">
            <Wrench className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Especialidade" />
          </SelectTrigger>
          <SelectContent>
            {specialties.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Novo Credenciado
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo Credenciado</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar uma nova oficina credenciada.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credenciado-nome">Nome da oficina</Label>
              <Input
                id="credenciado-nome"
                value={novoCredenciado.nome}
                onChange={(event) =>
                  setNovoCredenciado((prev) => ({
                    ...prev,
                    nome: event.target.value,
                  }))
                }
                placeholder="Ex.: Elite Motors"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select
                  value={novoCredenciado.cidade}
                  onValueChange={(value) =>
                    setNovoCredenciado((prev) => ({ ...prev, cidade: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities
                      .filter((city) => city !== "Todas")
                      .map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select
                  value={novoCredenciado.especialidade}
                  onValueChange={(value) =>
                    setNovoCredenciado((prev) => ({
                      ...prev,
                      especialidade: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties
                      .filter((specialty) => specialty !== "Todas")
                      .map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="credenciado-telefone">Telefone</Label>
                <Input
                  id="credenciado-telefone"
                  value={novoCredenciado.telefone}
                  onChange={(event) =>
                    setNovoCredenciado((prev) => ({
                      ...prev,
                      telefone: event.target.value,
                    }))
                  }
                  placeholder="(19) 99999-9999"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credenciado-email">E-mail</Label>
                <Input
                  id="credenciado-email"
                  type="email"
                  value={novoCredenciado.email}
                  onChange={(event) =>
                    setNovoCredenciado((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder="contato@oficina.com.br"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="credenciado-score">Score inicial</Label>
                <Input
                  id="credenciado-score"
                  value={novoCredenciado.scoreInicial}
                  onChange={(event) =>
                    setNovoCredenciado((prev) => ({
                      ...prev,
                      scoreInicial: event.target.value,
                    }))
                  }
                  placeholder="4.0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credenciado-sla">SLA médio</Label>
                <Input
                  id="credenciado-sla"
                  value={novoCredenciado.slaMedio}
                  onChange={(event) =>
                    setNovoCredenciado((prev) => ({
                      ...prev,
                      slaMedio: event.target.value,
                    }))
                  }
                  placeholder="3.0 dias"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={novoCredenciado.status}
                  onValueChange={(value) =>
                    setNovoCredenciado((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Credenciado</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
