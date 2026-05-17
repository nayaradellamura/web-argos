"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Search,
  Plus,
  MapPin,
  Wrench,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  cityOptions: string[];
  specialtyOptions: string[];
  onCreated?: () => void;
}

export function CredenciadosHeader({
  searchQuery,
  onSearchChange,
  cityFilter,
  onCityFilterChange,
  specialtyFilter,
  onSpecialtyFilterChange,
  cityOptions,
  specialtyOptions,
  onCreated,
}: CredenciadosHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cityFilterOpen, setCityFilterOpen] = useState(false);
  const [specialtyFilterOpen, setSpecialtyFilterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [novoCredenciado, setNovoCredenciado] = useState({
    name: "",
    city: cityOptions[0] ?? "",
    specialty: specialtyOptions[0] ?? "",
    cnpj: "",
    telefone: "",
    email: "",
    scoreInicial: "4.0",
    slaMedio: "3.0 dias",
    status: "ativo",
  });

  const cityItems = useMemo(() => ["Todas", ...cityOptions], [cityOptions]);
  const specialtyItems = useMemo(
    () => ["Todas", ...specialtyOptions],
    [specialtyOptions],
  );

  useEffect(() => {
    setNovoCredenciado((prev) => ({
      ...prev,
      city: prev.city || cityOptions[0] || "",
    }));
  }, [cityOptions]);

  useEffect(() => {
    setNovoCredenciado((prev) => ({
      ...prev,
      specialty: prev.specialty || specialtyOptions[0] || "",
    }));
  }, [specialtyOptions]);

  const formatCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 14);

    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    }
    if (digits.length <= 12) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/oficinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: novoCredenciado.name,
          nome: novoCredenciado.name,
          cnpj: novoCredenciado.cnpj,
          city: novoCredenciado.city,
          cidade: novoCredenciado.city,
          specialty: novoCredenciado.specialty,
          especialidade: novoCredenciado.specialty,
          phone: novoCredenciado.telefone,
          telefone: novoCredenciado.telefone,
          email: novoCredenciado.email,
          status: "Ativo",
          score: 5,
          slaAvg: Number.parseFloat(novoCredenciado.slaMedio) || 3,
          slaMedia: Number.parseFloat(novoCredenciado.slaMedio) || 3,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao criar oficina");
      }

      setIsDialogOpen(false);
      setNovoCredenciado({
        name: "",
        city: cityOptions[0] ?? "",
        specialty: specialtyOptions[0] ?? "",
        cnpj: "",
        telefone: "",
        email: "",
        scoreInicial: "4.0",
        slaMedio: "3.0 dias",
        status: "ativo",
      });
      onCreated?.();
    } catch (error) {
      console.error("Erro ao criar credenciado:", error);
    } finally {
      setIsSubmitting(false);
    }
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

        <Popover open={cityFilterOpen} onOpenChange={setCityFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={cityFilterOpen}
              className="w-52 justify-between"
            >
              <span className="flex items-center gap-2 truncate">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{cityFilter}</span>
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar cidade..." />
              <CommandList>
                <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                <CommandGroup>
                  {cityItems.map((city) => (
                    <CommandItem
                      key={city}
                      value={city}
                      onSelect={() => {
                        onCityFilterChange(city);
                        setCityFilterOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          cityFilter === city ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {city}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover
          open={specialtyFilterOpen}
          onOpenChange={setSpecialtyFilterOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={specialtyFilterOpen}
              className="w-56 justify-between"
            >
              <span className="flex items-center gap-2 truncate">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{specialtyFilter}</span>
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar especialidade..." />
              <CommandList>
                <CommandEmpty>Nenhuma especialidade encontrada.</CommandEmpty>
                <CommandGroup>
                  {specialtyItems.map((specialty) => (
                    <CommandItem
                      key={specialty}
                      value={specialty}
                      onSelect={() => {
                        onSpecialtyFilterChange(specialty);
                        setSpecialtyFilterOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          specialtyFilter === specialty
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {specialty}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
                value={novoCredenciado.name}
                onChange={(event) =>
                  setNovoCredenciado((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Ex.: Elite Motors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credenciado-cnpj">CNPJ</Label>
              <Input
                id="credenciado-cnpj"
                value={novoCredenciado.cnpj}
                onChange={(event) =>
                  setNovoCredenciado((prev) => ({
                    ...prev,
                    cnpj: formatCnpj(event.target.value),
                  }))
                }
                placeholder="00.000.000/0000-00"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Select
                  value={novoCredenciado.city}
                  onValueChange={(value) =>
                    setNovoCredenciado((prev) => ({ ...prev, city: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.map((city) => (
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
                  value={novoCredenciado.specialty}
                  onValueChange={(value) =>
                    setNovoCredenciado((prev) => ({
                      ...prev,
                      specialty: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialtyOptions.map((specialty) => (
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
                      telefone: formatPhone(event.target.value),
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
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Credenciado"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
