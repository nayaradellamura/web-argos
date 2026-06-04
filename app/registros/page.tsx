"use client";
import { apiFetch } from "@/lib/api-client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { RegistrosHeader } from "../../components/registros/registros-header";
import { ClientesTable } from "@/components/registros/clientes-table";
import { ParceirosTable } from "@/components/registros/parceiros-table";
import { VeiculosTable } from "@/components/registros/veiculos-table";
import {
  type Cliente,
  type Veiculo,
  getClientes,
} from "@/lib/services/registros";
import { TabsContent, Tabs } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

function formatCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function normalizeEmail(value: string) {
  return value.replace(/\s/g, "").toLowerCase();
}

export default function RegistrosPage() {
  const [activeTab, setActiveTab] = useState("parceiros");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdCliente, setCreatedCliente] = useState<Cliente | null>(null);
  const [createdVeiculo, setCreatedVeiculo] = useState<Veiculo | null>(null);
  const [clientesOptions, setClientesOptions] = useState<Cliente[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [clientePickerOpen, setClientePickerOpen] = useState(false);

  const [clienteForm, setClienteForm] = useState({
    nomeCompleto: "",
    cpfCnpj: "",
    telefone: "",
    email: "",
  });

  const [veiculoForm, setVeiculoForm] = useState({
    clienteId: "",
    proprietario: "",
    placa: "",
    marca: "",
    modelo: "",
    ano: "",
    cor: "",
    tipoCobertura: "",
  });

  const resetForms = () => {
    setClienteForm({ nomeCompleto: "", cpfCnpj: "", telefone: "", email: "" });
    setVeiculoForm({
      clienteId: "",
      proprietario: "",
      placa: "",
      marca: "",
      modelo: "",
      ano: "",
      cor: "",
      tipoCobertura: "",
    });
    setClientePickerOpen(false);
    setFormError(null);
  };

  useEffect(() => {
    setClientesLoading(true);
    getClientes()
      .then(setClientesOptions)
      .finally(() => setClientesLoading(false));
  }, []);

  useEffect(() => {
    if (!createdCliente) return;

    setClientesOptions((prev) => {
      if (prev.some((item) => item.id === createdCliente.id)) return prev;
      return [createdCliente, ...prev];
    });
  }, [createdCliente]);

  const selectedClienteNome = useMemo(() => {
    if (!veiculoForm.clienteId) return "";
    return (
      clientesOptions.find((cliente) => cliente.id === veiculoForm.clienteId)
        ?.nomeCompleto ?? ""
    );
  }, [clientesOptions, veiculoForm.clienteId]);

  const handleOpenCreateModal = () => {
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsModalOpen(false);
    resetForms();
  };

  const validateClienteForm = () => {
    if (!clienteForm.nomeCompleto.trim()) return "Nome completo é obrigatório.";
    if (!clienteForm.cpfCnpj.trim()) return "CPF/CNPJ é obrigatório.";
    if (!clienteForm.telefone.trim()) return "Telefone é obrigatório.";
    if (!clienteForm.email.trim()) return "E-mail é obrigatório.";
    if (!clienteForm.email.includes("@")) return "E-mail inválido.";
    return null;
  };

  const validateVeiculoForm = () => {
    if (!veiculoForm.clienteId.trim()) return "Selecione um cliente.";
    if (!veiculoForm.placa.trim()) return "Placa é obrigatória.";
    if (!veiculoForm.marca.trim()) return "Marca é obrigatória.";
    if (!veiculoForm.modelo.trim()) return "Modelo é obrigatório.";
    if (!veiculoForm.ano.trim()) return "Ano é obrigatório.";
    const anoNumber = Number(veiculoForm.ano);
    if (!Number.isInteger(anoNumber) || anoNumber < 1900 || anoNumber > 2100) {
      return "Ano inválido.";
    }
    if (!veiculoForm.cor.trim()) return "Cor é obrigatória.";
    if (!veiculoForm.tipoCobertura.trim()) return "Cobertura é obrigatória.";
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (activeTab === "clientes") {
      const error = validateClienteForm();
      if (error) {
        setFormError(error);
        return;
      }

      const payload = {
        nomeCompleto: clienteForm.nomeCompleto.trim(),
        cpfCnpj: clienteForm.cpfCnpj.trim(),
        telefone: clienteForm.telefone.trim(),
        email: clienteForm.email.trim(),
      };

      setSaving(true);
      try {
        const response = await apiFetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        if (response.status !== 201) {
          setFormError(
            typeof data?.error === "string"
              ? data.error
              : "Não foi possível criar o cliente.",
          );
          return;
        }

        const created = data?.cliente as Cliente | undefined;
        if (created?.id) {
          setCreatedCliente(created);
        }

        handleCloseCreateModal();
      } finally {
        setSaving(false);
      }

      return;
    }

    if (activeTab === "veiculos") {
      const error = validateVeiculoForm();
      if (error) {
        setFormError(error);
        return;
      }

      const payload = {
        clienteId: veiculoForm.clienteId,
        proprietario: veiculoForm.proprietario,
        placa: veiculoForm.placa.trim().toUpperCase(),
        marca: veiculoForm.marca.trim(),
        modelo: veiculoForm.modelo.trim(),
        ano: Number(veiculoForm.ano),
        cor: veiculoForm.cor.trim(),
        tipoCobertura: veiculoForm.tipoCobertura,
      };

      setSaving(true);
      try {
        const response = await apiFetch("/api/veiculos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));
        if (response.status !== 201) {
          setFormError(
            typeof data?.error === "string"
              ? data.error
              : "Não foi possível criar o veículo.",
          );
          return;
        }

        const created = data?.veiculo as Veiculo | undefined;
        if (created?.id) {
          setCreatedVeiculo(created);
        }

        handleCloseCreateModal();
      } finally {
        setSaving(false);
      }
    }
  };

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
            onCreateClick={handleOpenCreateModal}
          />

          <div className="mt-6">
            <TabsContent value="clientes" className="m-0">
              <ClientesTable
                searchQuery={searchQuery}
                createdCliente={createdCliente}
                onConsumeCreatedCliente={() => setCreatedCliente(null)}
              />
            </TabsContent>

            <TabsContent value="veiculos" className="m-0">
              <VeiculosTable
                searchQuery={searchQuery}
                createdVeiculo={createdVeiculo}
                onConsumeCreatedVeiculo={() => setCreatedVeiculo(null)}
              />
            </TabsContent>

            <TabsContent value="parceiros" className="m-0">
              <ParceirosTable searchQuery={searchQuery} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "clientes" ? "Novo Cliente" : "Novo Veículo"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "clientes"
                ? "Preencha os dados do cliente para criar o registro."
                : "Preencha os dados do veículo para criar o registro."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "clientes" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cliente-nome">Nome Completo</Label>
                  <Input
                    id="cliente-nome"
                    value={clienteForm.nomeCompleto}
                    onChange={(e) =>
                      setClienteForm((prev) => ({
                        ...prev,
                        nomeCompleto: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cliente-cpf">CPF/CNPJ</Label>
                    <Input
                      id="cliente-cpf"
                      value={clienteForm.cpfCnpj}
                      onChange={(e) =>
                        setClienteForm((prev) => ({
                          ...prev,
                          cpfCnpj: formatCpfCnpj(e.target.value),
                        }))
                      }
                      maxLength={18}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cliente-telefone">Telefone</Label>
                    <Input
                      id="cliente-telefone"
                      value={clienteForm.telefone}
                      onChange={(e) =>
                        setClienteForm((prev) => ({
                          ...prev,
                          telefone: formatPhone(e.target.value),
                        }))
                      }
                      maxLength={15}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente-email">E-mail</Label>
                  <Input
                    id="cliente-email"
                    type="email"
                    value={clienteForm.email}
                    onChange={(e) =>
                      setClienteForm((prev) => ({
                        ...prev,
                        email: normalizeEmail(e.target.value),
                      }))
                    }
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Popover
                    open={clientePickerOpen}
                    onOpenChange={setClientePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientePickerOpen}
                        className="w-full justify-between"
                      >
                        {selectedClienteNome ||
                          (clientesLoading
                            ? "Carregando clientes..."
                            : "Selecione um cliente")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                      <Command>
                        <CommandInput placeholder="Pesquisar cliente..." />
                        <CommandList>
                          <CommandEmpty>
                            Nenhum cliente encontrado.
                          </CommandEmpty>
                          <CommandGroup>
                            {clientesOptions.map((cliente) => (
                              <CommandItem
                                key={cliente.id}
                                value={`${cliente.nomeCompleto} ${cliente.cpfCnpj} ${cliente.email}`}
                                onSelect={() => {
                                  setVeiculoForm((prev) => ({
                                    ...prev,
                                    clienteId: cliente.id,
                                    proprietario: cliente.nomeCompleto,
                                  }));
                                  setClientePickerOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    veiculoForm.clienteId === cliente.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <span className="truncate">
                                  {cliente.nomeCompleto}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="veiculo-placa">Placa</Label>
                    <Input
                      id="veiculo-placa"
                      value={veiculoForm.placa}
                      onChange={(e) =>
                        setVeiculoForm((prev) => ({
                          ...prev,
                          placa: e.target.value.toUpperCase(),
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="veiculo-marca">Marca</Label>
                    <Input
                      id="veiculo-marca"
                      value={veiculoForm.marca}
                      onChange={(e) =>
                        setVeiculoForm((prev) => ({
                          ...prev,
                          marca: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="veiculo-modelo">Modelo</Label>
                    <Input
                      id="veiculo-modelo"
                      value={veiculoForm.modelo}
                      onChange={(e) =>
                        setVeiculoForm((prev) => ({
                          ...prev,
                          modelo: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="veiculo-ano">Ano</Label>
                    <Input
                      id="veiculo-ano"
                      type="number"
                      min={1900}
                      max={2100}
                      value={veiculoForm.ano}
                      onChange={(e) =>
                        setVeiculoForm((prev) => ({
                          ...prev,
                          ano: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="veiculo-cor">Cor</Label>
                    <Input
                      id="veiculo-cor"
                      value={veiculoForm.cor}
                      onChange={(e) =>
                        setVeiculoForm((prev) => ({
                          ...prev,
                          cor: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cobertura</Label>
                    <Select
                      value={veiculoForm.tipoCobertura}
                      onValueChange={(value) =>
                        setVeiculoForm((prev) => ({
                          ...prev,
                          tipoCobertura: value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a cobertura" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Básica">Básica</SelectItem>
                        <SelectItem value="Intermediária">
                          Intermediária
                        </SelectItem>
                        <SelectItem value="Completa">Completa</SelectItem>
                        <SelectItem value="Compreensiva">
                          Compreensiva
                        </SelectItem>
                        <SelectItem value="Terceiros">Terceiros</SelectItem>
                        <SelectItem value="Roubo e Furto">
                          Roubo e Furto
                        </SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Proteção Total">
                          Proteção Total
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {formError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseCreateModal}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
