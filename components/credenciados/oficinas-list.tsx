"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Wrench,
  Clock,
  FileText,
  Phone,
  Mail,
  MoreHorizontal,
  Building2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  CredenciadoStatus,
  getCredenciadosStore,
  setCredenciadosStore,
} from "@/lib/business-rules-store";

interface Oficina {
  id: string;
  name: string;
  city: string;
  specialty: string;
  score: number;
  slaAvg: string;
  activeClaims: number;
  phone: string;
  email: string;
  status: "ativo" | "pendente" | "suspenso";
}

interface EditFormState {
  name: string;
  city: string;
  specialty: string;
  phone: string;
  email: string;
  status: Oficina["status"];
}

const oficinasData: Oficina[] = [
  {
    id: "OFC-001",
    name: "Elite Motors",
    city: "Araras-SP",
    specialty: "Chapeacao Avancada",
    score: 4.9,
    slaAvg: "2.8 dias",
    activeClaims: 12,
    phone: "(19) 3541-2200",
    email: "contato@elitemotors.com.br",
    status: "ativo",
  },
  {
    id: "OFC-002",
    name: "AutoPrime Reparos",
    city: "Limeira-SP",
    specialty: "Mecanica Geral",
    score: 4.7,
    slaAvg: "3.1 dias",
    activeClaims: 8,
    phone: "(19) 3404-5500",
    email: "atendimento@autoprime.com.br",
    status: "ativo",
  },
  {
    id: "OFC-003",
    name: "CarTech Solutions",
    city: "Piracicaba-SP",
    specialty: "Eletrica Automotiva",
    score: 4.5,
    slaAvg: "3.5 dias",
    activeClaims: 6,
    phone: "(19) 3422-8800",
    email: "suporte@cartech.com.br",
    status: "ativo",
  },
  {
    id: "OFC-004",
    name: "MasterFix Auto",
    city: "Campinas-SP",
    specialty: "Funilaria e Pintura",
    score: 4.3,
    slaAvg: "4.2 dias",
    activeClaims: 15,
    phone: "(19) 3289-4400",
    email: "oficina@masterfix.com.br",
    status: "ativo",
  },
  {
    id: "OFC-005",
    name: "ProRepair Center",
    city: "Rio Claro-SP",
    specialty: "Chapeacao Avancada",
    score: 4.1,
    slaAvg: "3.8 dias",
    activeClaims: 9,
    phone: "(19) 3524-7700",
    email: "contato@prorepair.com.br",
    status: "pendente",
  },
  {
    id: "OFC-006",
    name: "VidroMax Automotivo",
    city: "Araras-SP",
    specialty: "Vidracaria",
    score: 4.6,
    slaAvg: "1.5 dias",
    activeClaims: 4,
    phone: "(19) 3541-9900",
    email: "vidromax@email.com.br",
    status: "ativo",
  },
  {
    id: "OFC-007",
    name: "SpeedFix Mecanica",
    city: "Limeira-SP",
    specialty: "Mecanica Geral",
    score: 3.9,
    slaAvg: "4.8 dias",
    activeClaims: 7,
    phone: "(19) 3441-3300",
    email: "speedfix@email.com.br",
    status: "suspenso",
  },
  {
    id: "OFC-008",
    name: "TopCar Funilaria",
    city: "Campinas-SP",
    specialty: "Funilaria e Pintura",
    score: 4.4,
    slaAvg: "3.3 dias",
    activeClaims: 11,
    phone: "(19) 3255-6600",
    email: "topcar@topcar.com.br",
    status: "ativo",
  },
];

interface OficinasListProps {
  searchQuery: string;
  cityFilter: string;
  specialtyFilter: string;
}

function renderStars(score: number) {
  const fullStars = Math.floor(score);
  const hasHalfStar = score % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className="h-4 w-4 fill-yellow-400 text-yellow-400"
        />
      ))}
      {hasHalfStar && (
        <Star className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground/30" />
      ))}
      <span className="ml-1.5 text-sm font-semibold">{score.toFixed(1)}</span>
    </div>
  );
}

function getStatusBadge(status: Oficina["status"]) {
  switch (status) {
    case "ativo":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
          Ativo
        </Badge>
      );
    case "pendente":
      return (
        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
          Pendente
        </Badge>
      );
    case "suspenso":
      return (
        <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
          Suspenso
        </Badge>
      );
  }
}

export function OficinasList({
  searchQuery,
  cityFilter,
  specialtyFilter,
}: OficinasListProps) {
  const [oficinas, setOficinas] = useState(oficinasData);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [selectedOficina, setSelectedOficina] = useState<Oficina | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    city: "",
    specialty: "",
    phone: "",
    email: "",
    status: "ativo",
  });

  useEffect(() => {
    const credenciados = getCredenciadosStore();
    const credenciadoMap = new Map(
      credenciados.map((credenciado) => [credenciado.id, credenciado]),
    );

    setOficinas((current) =>
      current.map((oficina) => {
        const credenciado = credenciadoMap.get(oficina.id);

        if (!credenciado) {
          return oficina;
        }

        return {
          ...oficina,
          name: credenciado.name,
          status: credenciado.status,
        };
      }),
    );
  }, []);

  const handleOpenEdit = (oficina: Oficina) => {
    setSelectedOficina(oficina);
    setEditForm({
      name: oficina.name,
      city: oficina.city,
      specialty: oficina.specialty,
      phone: oficina.phone,
      email: oficina.email,
      status: oficina.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenHistory = (oficina: Oficina) => {
    setSelectedOficina(oficina);
    setIsHistoryDialogOpen(true);
  };

  const handleSaveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedOficina) {
      return;
    }

    setOficinas((currentOficinas) => {
      const updatedOficinas = currentOficinas.map((oficina) =>
        oficina.id === selectedOficina.id
          ? {
              ...oficina,
              name: editForm.name,
              city: editForm.city,
              specialty: editForm.specialty,
              phone: editForm.phone,
              email: editForm.email,
              status: editForm.status as Oficina["status"],
            }
          : oficina,
      );

      setCredenciadosStore(
        updatedOficinas.map((oficina) => ({
          id: oficina.id,
          name: oficina.name,
          status: oficina.status as CredenciadoStatus,
        })),
      );

      return updatedOficinas;
    });

    setIsEditDialogOpen(false);
  };

  const handleOpenSuspend = (oficina: Oficina) => {
    setSelectedOficina(oficina);
    setIsSuspendDialogOpen(true);
  };

  const handleConfirmSuspend = () => {
    if (!selectedOficina) {
      return;
    }

    setOficinas((currentOficinas) => {
      const updatedOficinas = currentOficinas.map((oficina) =>
        oficina.id === selectedOficina.id
          ? { ...oficina, status: "suspenso" as Oficina["status"] }
          : oficina,
      );

      setCredenciadosStore(
        updatedOficinas.map((oficina) => ({
          id: oficina.id,
          name: oficina.name,
          status: oficina.status as CredenciadoStatus,
        })),
      );

      return updatedOficinas;
    });

    setIsSuspendDialogOpen(false);
  };

  const filteredOficinas = oficinas.filter((oficina) => {
    const matchesSearch =
      oficina.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      oficina.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === "Todas" || oficina.city === cityFilter;
    const matchesSpecialty =
      specialtyFilter === "Todas" || oficina.specialty === specialtyFilter;

    return matchesSearch && matchesCity && matchesSpecialty;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {filteredOficinas.length} oficinas encontradas
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredOficinas.map((oficina) => (
          <Card
            key={oficina.id}
            className="relative overflow-hidden transition-shadow hover:shadow-md"
          >
            <CardContent className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold leading-tight">
                      {oficina.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {oficina.id}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleOpenEdit(oficina)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleOpenHistory(oficina)}
                    >
                      Histórico de Sinistro
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      disabled={oficina.status === "suspenso"}
                      onSelect={() => handleOpenSuspend(oficina)}
                    >
                      {oficina.status === "suspenso"
                        ? "Já Suspenso"
                        : "Suspender"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mb-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{oficina.city}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" />
                  <span>{oficina.specialty}</span>
                </div>
              </div>

              <div className="mb-3">{renderStars(oficina.score)}</div>

              <div className="mb-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{oficina.slaAvg}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">
                    {oficina.activeClaims} ativos
                  </span>
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2">
                {getStatusBadge(oficina.status)}
              </div>

              <div className="flex items-center gap-2 border-t pt-3">
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  <Phone className="mr-1.5 h-3.5 w-3.5" />
                  Ligar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  E-mail
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOficinas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">Nenhuma oficina encontrada</h3>
          <p className="text-sm text-muted-foreground">
            Tente ajustar os filtros de busca
          </p>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Credenciado</DialogTitle>
            <DialogDescription>
              Atualize os dados da oficina credenciada selecionada.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oficina-name">Nome</Label>
              <Input
                id="oficina-name"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="oficina-city">Cidade</Label>
                <Input
                  id="oficina-city"
                  value={editForm.city}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      city: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oficina-specialty">Especialidade</Label>
                <Input
                  id="oficina-specialty"
                  value={editForm.specialty}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      specialty: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="oficina-phone">Telefone</Label>
                <Input
                  id="oficina-phone"
                  value={editForm.phone}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oficina-email">E-mail</Label>
                <Input
                  id="oficina-email"
                  type="email"
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="oficina-status">Status</Label>
              <Input
                id="oficina-status"
                value={editForm.status}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    status: event.target.value as Oficina["status"],
                  }))
                }
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico de Sinistro</DialogTitle>
            <DialogDescription>
              {selectedOficina
                ? `Últimos eventos da oficina ${selectedOficina.name}.`
                : "Últimos eventos da oficina selecionada."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-md border p-3">
              <p className="font-medium">SIN-2481 • Concluído</p>
              <p className="text-muted-foreground">
                Atualização há 2 dias • SLA 2.9 dias
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">SIN-2474 • Em Orçamento</p>
              <p className="text-muted-foreground">
                Atualização há 1 dia • SLA parcial 1.8 dias
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium">SIN-2468 • Em Vistoria</p>
              <p className="text-muted-foreground">
                Atualização hoje • Sem atraso
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={() => setIsHistoryDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspender Credenciado</DialogTitle>
            <DialogDescription>
              {selectedOficina
                ? `Confirma a suspensão da oficina ${selectedOficina.name}?`
                : "Confirma a suspensão da oficina selecionada?"}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSuspendDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmSuspend}
            >
              Confirmar Suspensão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
