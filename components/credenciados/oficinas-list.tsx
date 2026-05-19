"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
  ChevronLeft,
  ChevronRight,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Oficina {
  id: string;
  name: string;
  cnpj: string;
  city: string;
  specialty: string;
  score: number;
  slaAvg: number;
  activeClaims: number;
  totalSinistros: number;
  phone: string;
  telefone?: string;
  email: string;
  status: "Ativo" | "Pendente" | "Suspenso" | "Inativo";
}

interface Sinistro {
  id: string;
  protocol: string;
  placa: string;
  vehicle: string;
  entryDate: string;
  status: string;
}

interface EditFormState {
  name: string;
  cnpj: string;
  city: string;
  specialty: string;
  score: string;
  slaAvg: string;
  status: Oficina["status"];
  phone: string;
  email: string;
}

interface OficinasListProps {
  searchQuery: string;
  cityFilter: string;
  specialtyFilter: string;
}

interface ApiResponse {
  oficinas?: Record<string, unknown>[];
  totalCount?: number;
  data?: Oficina[];
  total?: number;
  page?: number;
  limit?: number;
  historico?: Record<string, unknown>[];
  sinistros?: Sinistro[];
}

function firstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
}

function normalizeStatus(status: unknown): Oficina["status"] {
  const value = String(status ?? "")
    .trim()
    .toLowerCase();

  if (value === "pendente") return "Pendente";
  if (value === "suspenso") return "Suspenso";
  if (value === "inativo") return "Inativo";

  return "Ativo";
}

function mapApiOficina(raw: Record<string, unknown>): Oficina {
  const city = firstNonEmptyString(raw.city, raw.cidade);
  const uf = firstNonEmptyString(raw.uf);
  const cityWithUf = city && uf && !city.includes("-") ? `${city}-${uf}` : city;

  const scoreValue = Number(raw.score);
  const score = Number.isFinite(scoreValue) ? scoreValue : 0;

  const slaNumber = Number(raw.slaAvg ?? raw.slaMedia);
  const slaAvg = Number.isFinite(slaNumber) ? slaNumber : 0;

  const activeClaimsValue = Number(raw.activeClaims);
  const sinistrosArray = Array.isArray(raw.sinistros)
    ? raw.sinistros
    : Array.isArray(raw.historico)
      ? raw.historico
      : [];

  const totalSinistrosValue = Number(raw.totalSinistros);
  const totalSinistros = Number.isFinite(totalSinistrosValue)
    ? totalSinistrosValue
    : sinistrosArray.length;

  return {
    id: String(raw.id ?? "-"),
    name: firstNonEmptyString(raw.name, raw.nome) || "Oficina sem nome",
    cnpj: firstNonEmptyString(raw.cnpj) || "",
    city: cityWithUf || "-",
    specialty:
      firstNonEmptyString(raw.specialty, raw.especialidade) || "Não informado",
    score,
    slaAvg,
    activeClaims: Number.isFinite(activeClaimsValue)
      ? activeClaimsValue
      : sinistrosArray.length,
    totalSinistros,
    phone: firstNonEmptyString(raw.phone, raw.telefone) || "-",
    telefone: firstNonEmptyString(raw.telefone),
    email: firstNonEmptyString(raw.email) || "-",
    status: normalizeStatus(raw.status),
  };
}

function formatSlaDays(value: number) {
  return `${value.toFixed(1)} dias`;
}

function formatCnpj(value: string) {
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
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatSinistros(count: number): string {
  if (count === 1) return "1 sinistro";
  return `${count} sinistros`;
}

function getSinistroStatusBadgeClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("finaliz") || normalized.includes("conclu")) {
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/40";
  }

  if (
    normalized.includes("andamento") ||
    normalized.includes("analise") ||
    normalized.includes("análise")
  ) {
    return "bg-sky-500/10 text-sky-700 border-sky-500/40";
  }

  if (normalized.includes("pend")) {
    return "bg-orange-500/10 text-orange-700 border-orange-500/40";
  }

  if (normalized.includes("rejeit")) {
    return "bg-red-500/10 text-red-700 border-red-500/40";
  }

  return "bg-muted text-muted-foreground border-border";
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
    case "Ativo":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
          Ativo
        </Badge>
      );
    case "Pendente":
      return (
        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
          Pendente
        </Badge>
      );
    case "Suspenso":
      return (
        <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
          Suspenso
        </Badge>
      );
    case "Inativo":
      return (
        <Badge className="bg-gray-500/10 text-gray-600 hover:bg-gray-500/20">
          Inativo
        </Badge>
      );
  }
}

export function OficinasList({
  searchQuery,
  cityFilter,
  specialtyFilter,
}: OficinasListProps) {
  const { toast } = useToast();
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [selectedOficina, setSelectedOficina] = useState<Oficina | null>(null);
  const [sinistros, setSinistros] = useState<Sinistro[]>([]);
  const [isLoadingSinistros, setIsLoadingSinistros] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    name: "",
    cnpj: "",
    city: "",
    specialty: "",
    score: "5.0",
    slaAvg: "3.0",
    status: "Ativo",
    phone: "",
    email: "",
  });

  const LIMIT = 8;

  const handleCopyPhone = async (phone?: string) => {
    const value = (phone ?? "").trim();

    if (!value || value === "-") {
      toast({
        title: "Erro",
        description: "Número de telefone não disponível",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast({
        description: "Telefone copiado para a área de transferência!",
      });
    } catch (error) {
      console.error("Erro ao copiar telefone:", error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o telefone",
        variant: "destructive",
      });
    }
  };

  const handleCopyEmail = async (email: string) => {
    const value = email.trim();

    if (!value || value === "-") {
      toast({
        title: "Erro",
        description: "E-mail não disponível",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast({
        description: "E-mail copiado para a área de transferência!",
      });
    } catch (error) {
      console.error("Erro ao copiar e-mail:", error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o e-mail",
        variant: "destructive",
      });
    }
  };

  // Fetch oficinas
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, cityFilter, specialtyFilter]);

  useEffect(() => {
    fetchOficinas();
  }, [debouncedSearchQuery]);

  const fetchOficinas = async () => {
    setIsLoading(true);
    try {
      const apiLimit = 50;
      const firstParams = new URLSearchParams({
        page: "1",
        limit: String(apiLimit),
        search: debouncedSearchQuery,
      });

      const firstResponse = await fetch(
        `/api/oficinas?${firstParams.toString()}`,
      );
      if (!firstResponse.ok) throw new Error("Falha ao carregar oficinas");

      const firstPageRes: ApiResponse = await firstResponse.json();
      const totalCount = firstPageRes.totalCount ?? 0;
      const totalApiPages = Math.max(1, Math.ceil(totalCount / apiLimit));

      const additionalPages =
        totalApiPages > 1
          ? await Promise.all(
              Array.from({ length: totalApiPages - 1 }, (_, index) => {
                const page = index + 2;
                const params = new URLSearchParams({
                  page: String(page),
                  limit: String(apiLimit),
                  search: debouncedSearchQuery,
                });
                return fetch(`/api/oficinas?${params.toString()}`).then(
                  (res) => {
                    if (!res.ok) {
                      throw new Error("Falha ao carregar oficinas");
                    }
                    return res.json() as Promise<ApiResponse>;
                  },
                );
              }),
            )
          : [];

      const allRawOficinas = [
        ...(firstPageRes.oficinas ?? []),
        ...additionalPages.flatMap((pageRes) => pageRes.oficinas ?? []),
      ];

      const mappedOficinas = allRawOficinas.map((oficina) =>
        mapApiOficina(oficina),
      );

      setOficinas(mappedOficinas);
    } catch (error) {
      console.error("Erro ao buscar oficinas:", error);
      setOficinas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSinistros = async (oficinaId: string) => {
    setIsLoadingSinistros(true);
    try {
      const response = await fetch(
        `/api/oficinas/${oficinaId}/sinistros?limit=10`,
      );
      if (!response.ok) throw new Error("Falha ao carregar sinistros");

      const data: ApiResponse = await response.json();
      const historico = data.historico ?? [];

      setSinistros(
        historico.map((item) => ({
          id: String(item.id ?? "-"),
          protocol: String(item.id ?? item.protocol ?? "-"),
          placa: String(item.placa ?? "-"),
          vehicle: String(item.veiculo ?? item.vehicle ?? "-"),
          entryDate: String(item.entryDate ?? ""),
          status: String(item.status || "-"),
        })),
      );
    } catch (error) {
      console.error("Erro ao buscar sinistros:", error);
      setSinistros([]);
    } finally {
      setIsLoadingSinistros(false);
    }
  };

  const handleOpenEdit = (oficina: Oficina) => {
    setSelectedOficina(oficina);
    setEditForm({
      name: oficina.name,
      cnpj: oficina.cnpj,
      city: oficina.city,
      specialty: oficina.specialty,
      score: oficina.score.toFixed(1),
      slaAvg: oficina.slaAvg.toFixed(1),
      status: oficina.status,
      phone: oficina.phone,
      email: oficina.email,
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenHistory = async (oficina: Oficina) => {
    setSelectedOficina(oficina);
    setIsHistoryDialogOpen(true);
    await fetchSinistros(oficina.id);
  };

  const handleOpenSuspend = (oficina: Oficina) => {
    setSelectedOficina(oficina);
    setIsSuspendDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOficina) return;

    try {
      const response = await fetch(`/api/oficinas/${selectedOficina.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          nome: editForm.name,
          cnpj: editForm.cnpj,
          city: editForm.city,
          cidade: editForm.city,
          specialty: editForm.specialty,
          especialidade: editForm.specialty,
          score: Number.parseFloat(editForm.score) || 0,
          slaAvg: Number.parseFloat(editForm.slaAvg) || 0,
          slaMedia: Number.parseFloat(editForm.slaAvg) || 0,
          status: editForm.status,
          phone: editForm.phone,
          telefone: editForm.phone,
          email: editForm.email,
        }),
      });

      if (!response.ok) throw new Error("Falha ao atualizar oficina");

      setOficinas((prev) =>
        prev.map((o) =>
          o.id === selectedOficina.id
            ? {
                ...o,
                name: editForm.name,
                cnpj: editForm.cnpj,
                city: editForm.city,
                specialty: editForm.specialty,
                score: Number.parseFloat(editForm.score) || 0,
                slaAvg: Number.parseFloat(editForm.slaAvg) || 0,
                status: editForm.status,
                phone: editForm.phone,
                email: editForm.email,
              }
            : o,
        ),
      );

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar oficina:", error);
    }
  };

  const handleConfirmSuspend = async () => {
    if (!selectedOficina) return;

    try {
      const newStatus =
        selectedOficina.status === "Ativo" ? "Suspenso" : "Ativo";
      const response = await fetch(`/api/oficinas/${selectedOficina.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Falha ao alterar status");

      setOficinas((prev) =>
        prev.map((o) =>
          o.id === selectedOficina.id
            ? { ...o, status: newStatus as Oficina["status"] }
            : o,
        ),
      );

      setIsSuspendDialogOpen(false);
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const filteredOficinas = useMemo(
    () =>
      oficinas.filter((oficina) => {
        const cityMatch = cityFilter === "Todas" || oficina.city === cityFilter;
        const specialtyMatch =
          specialtyFilter === "Todas" || oficina.specialty === specialtyFilter;

        return cityMatch && specialtyMatch;
      }),
    [oficinas, cityFilter, specialtyFilter],
  );

  const totalItems = filteredOficinas.length;
  const totalPages = Math.ceil(totalItems / LIMIT);

  const paginatedOficinas = useMemo(() => {
    const start = (currentPage - 1) * LIMIT;
    return filteredOficinas.slice(start, start + LIMIT);
  }, [filteredOficinas, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {totalItems} oficinas encontradas
        </h3>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(LIMIT)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedOficinas.map((oficina) => (
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
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => handleOpenEdit(oficina)}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleOpenHistory(oficina)}
                        >
                          Ver Histórico de Sinistros
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={
                            oficina.status === "Ativo"
                              ? "text-destructive focus:text-destructive"
                              : undefined
                          }
                          onSelect={() => handleOpenSuspend(oficina)}
                        >
                          {oficina.status === "Ativo" ? "Suspender" : "Ativar"}
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
                      <span className="font-medium">
                        {formatSlaDays(oficina.slaAvg)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">
                        {formatSinistros(oficina.totalSinistros ?? 0)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3 flex items-center gap-2">
                    {getStatusBadge(oficina.status)}
                  </div>

                  <div className="flex items-center gap-2 border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() =>
                        handleCopyPhone(oficina.phone || oficina.telefone)
                      }
                    >
                      <Phone className="mr-1.5 h-3.5 w-3.5" />
                      Telefone
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleCopyEmail(oficina.email)}
                    >
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
              <h3 className="text-lg font-medium">
                Nenhuma oficina encontrada
              </h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros de busca
              </p>
            </div>
          )}
        </>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            if (
              Math.abs(page - currentPage) > 1 &&
              page !== 1 &&
              page !== totalPages
            ) {
              return null;
            }
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modal de Editar */}
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
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cnpj">CNPJ</Label>
              <Input
                id="edit-cnpj"
                value={editForm.cnpj}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    cnpj: formatCnpj(e.target.value),
                  }))
                }
                placeholder="00.000.000/0000-00"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-city">Cidade</Label>
                <Input
                  id="edit-city"
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-specialty">Especialidade</Label>
                <Input
                  id="edit-specialty"
                  value={editForm.specialty}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      specialty: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      phone: formatPhone(e.target.value),
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-score">Score inicial</Label>
                <Input
                  id="edit-score"
                  value={editForm.score}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, score: e.target.value }))
                  }
                  placeholder="4.0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sla">SLA médio</Label>
                <Input
                  id="edit-sla"
                  value={editForm.slaAvg}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, slaAvg: e.target.value }))
                  }
                  placeholder="3.0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({
                      ...prev,
                      status: value as EditFormState["status"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

      {/* Modal de Histórico de Sinistros */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Histórico de Sinistros</DialogTitle>
            <DialogDescription>
              {selectedOficina
                ? `Sinistros atendidos pela oficina ${selectedOficina.name}.`
                : "Sinistros atendidos pela oficina selecionada."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingSinistros ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Carregando sinistros...</p>
            </div>
          ) : sinistros.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Data de Entrada</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sinistros.map((sinistro) => (
                    <TableRow key={sinistro.id}>
                      <TableCell className="font-medium">
                        {sinistro.protocol}
                      </TableCell>
                      <TableCell>{sinistro.placa}</TableCell>
                      <TableCell>{sinistro.vehicle}</TableCell>
                      <TableCell>
                        {new Date(sinistro.entryDate).toLocaleDateString(
                          "pt-BR",
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getSinistroStatusBadgeClass(
                            sinistro.status,
                          )}
                        >
                          {sinistro.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Nenhum sinistro encontrado para esta oficina.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={() => setIsHistoryDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Suspender */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedOficina?.status === "Ativo"
                ? "Suspender Credenciado"
                : "Ativar Credenciado"}
            </DialogTitle>
            <DialogDescription>
              {selectedOficina
                ? `Confirma a alteração de status da oficina ${selectedOficina.name}?`
                : "Confirma a alteração de status da oficina selecionada?"}
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
              variant={
                selectedOficina?.status === "Ativo" ? "destructive" : "default"
              }
              onClick={handleConfirmSuspend}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
