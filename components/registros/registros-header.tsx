"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const [clienteForm, setClienteForm] = useState({
    nome: "",
    cpfCnpj: "",
    telefone: "",
    email: "",
    riscoHistorico: "baixo",
    status: "ativo",
  });

  const [veiculoForm, setVeiculoForm] = useState({
    placa: "",
    modelo: "",
    anoFabricacao: "",
    proprietario: "",
    tipoCobertura: "basica",
    status: "ativo",
  });

  const [usuarioForm, setUsuarioForm] = useState({
    nome: "",
    email: "",
    cargo: "",
    departamento: "",
    perfil: "analista",
    status: "ativo",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsDialogOpen(false);
  };

  const getDialogTitle = () => {
    if (activeTab === "clientes") return "Novo Cliente";
    if (activeTab === "veiculos") return "Novo Veículo";
    return "Novo Usuário";
  };

  const getDialogDescription = () => {
    if (activeTab === "clientes") {
      return "Preencha os dados para cadastrar um novo cliente.";
    }
    if (activeTab === "veiculos") {
      return "Preencha os dados para cadastrar um novo veículo.";
    }
    return "Preencha os dados para cadastrar um novo usuário interno.";
  };

  const renderFormFields = () => {
    if (activeTab === "clientes") {
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="cliente-nome">Nome completo</Label>
            <Input
              id="cliente-nome"
              value={clienteForm.nome}
              onChange={(event) =>
                setClienteForm((prev) => ({
                  ...prev,
                  nome: event.target.value,
                }))
              }
              placeholder="Ex.: João da Silva"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cliente-cpf-cnpj">CPF/CNPJ</Label>
              <Input
                id="cliente-cpf-cnpj"
                value={clienteForm.cpfCnpj}
                onChange={(event) =>
                  setClienteForm((prev) => ({
                    ...prev,
                    cpfCnpj: event.target.value,
                  }))
                }
                placeholder="000.000.000-00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente-telefone">Telefone</Label>
              <Input
                id="cliente-telefone"
                value={clienteForm.telefone}
                onChange={(event) =>
                  setClienteForm((prev) => ({
                    ...prev,
                    telefone: event.target.value,
                  }))
                }
                placeholder="(11) 99999-9999"
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
              onChange={(event) =>
                setClienteForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              placeholder="cliente@email.com"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Risco histórico</Label>
              <Select
                value={clienteForm.riscoHistorico}
                onValueChange={(value) =>
                  setClienteForm((prev) => ({ ...prev, riscoHistorico: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={clienteForm.status}
                onValueChange={(value) =>
                  setClienteForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      );
    }

    if (activeTab === "veiculos") {
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="veiculo-placa">Placa</Label>
              <Input
                id="veiculo-placa"
                value={veiculoForm.placa}
                onChange={(event) =>
                  setVeiculoForm((prev) => ({
                    ...prev,
                    placa: event.target.value,
                  }))
                }
                placeholder="ABC-1234"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="veiculo-ano">Ano de fabricação</Label>
              <Input
                id="veiculo-ano"
                type="number"
                value={veiculoForm.anoFabricacao}
                onChange={(event) =>
                  setVeiculoForm((prev) => ({
                    ...prev,
                    anoFabricacao: event.target.value,
                  }))
                }
                placeholder="2024"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="veiculo-modelo">Modelo</Label>
            <Input
              id="veiculo-modelo"
              value={veiculoForm.modelo}
              onChange={(event) =>
                setVeiculoForm((prev) => ({
                  ...prev,
                  modelo: event.target.value,
                }))
              }
              placeholder="Ex.: Toyota Corolla"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="veiculo-proprietario">Proprietário</Label>
            <Input
              id="veiculo-proprietario"
              value={veiculoForm.proprietario}
              onChange={(event) =>
                setVeiculoForm((prev) => ({
                  ...prev,
                  proprietario: event.target.value,
                }))
              }
              placeholder="Ex.: João Silva Santos"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de cobertura</Label>
              <Select
                value={veiculoForm.tipoCobertura}
                onValueChange={(value) =>
                  setVeiculoForm((prev) => ({ ...prev, tipoCobertura: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basica">Básica</SelectItem>
                  <SelectItem value="completa">Completa</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={veiculoForm.status}
                onValueChange={(value) =>
                  setVeiculoForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="sinistrado">Sinistrado</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="usuario-nome">Nome completo</Label>
          <Input
            id="usuario-nome"
            value={usuarioForm.nome}
            onChange={(event) =>
              setUsuarioForm((prev) => ({ ...prev, nome: event.target.value }))
            }
            placeholder="Ex.: Maria Oliveira"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="usuario-email">E-mail corporativo</Label>
          <Input
            id="usuario-email"
            type="email"
            value={usuarioForm.email}
            onChange={(event) =>
              setUsuarioForm((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder="usuario@argos.com.br"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="usuario-cargo">Cargo</Label>
            <Input
              id="usuario-cargo"
              value={usuarioForm.cargo}
              onChange={(event) =>
                setUsuarioForm((prev) => ({
                  ...prev,
                  cargo: event.target.value,
                }))
              }
              placeholder="Ex.: Analista de Sinistros"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="usuario-departamento">Departamento</Label>
            <Input
              id="usuario-departamento"
              value={usuarioForm.departamento}
              onChange={(event) =>
                setUsuarioForm((prev) => ({
                  ...prev,
                  departamento: event.target.value,
                }))
              }
              placeholder="Ex.: Regulação"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Perfil de acesso</Label>
            <Select
              value={usuarioForm.perfil}
              onValueChange={(value) =>
                setUsuarioForm((prev) => ({ ...prev, perfil: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="analista">Analista</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={usuarioForm.status}
              onValueChange={(value) =>
                setUsuarioForm((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="veiculos">Veículos</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários Internos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar registros..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 pl-9 bg-card"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{getDialogTitle()}</DialogTitle>
              <DialogDescription>{getDialogDescription()}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {renderFormFields()}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar Registro</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
