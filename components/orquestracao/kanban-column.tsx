"use client";

import { DragEvent, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KanbanStage, ClaimCard, StageId } from "./kanban-board";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Car,
  Building2,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  getCredenciadosDisponiveisNomes,
  upsertVistoriaVinculadaStore,
} from "@/lib/business-rules-store";

interface KanbanColumnProps {
  stage: KanbanStage;
  isDragOver: boolean;
  onStageDragOver: () => void;
  onStageDragEnd: () => void;
  onCardDrop: (
    cardId: string,
    sourceStageId: StageId,
    targetStageId: StageId,
    targetIndex?: number,
  ) => void;
  onUpdateCard: (
    stageId: StageId,
    cardId: string,
    updates: Partial<Omit<ClaimCard, "id" | "status">>,
  ) => void;
  onDeleteCard: (stageId: StageId, cardId: string) => void;
}

function getPriorityConfig(priority: ClaimCard["priority"]) {
  switch (priority) {
    case "within-sla":
      return {
        label: "OK",
        variant: "default" as const,
        className:
          "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: CheckCircle2,
      };
    case "attention":
      return {
        label: "Atencao",
        variant: "secondary" as const,
        className:
          "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
        icon: Clock,
      };
    case "delayed":
      return {
        label: "Atrasado",
        variant: "destructive" as const,
        className:
          "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
        icon: AlertTriangle,
      };
  }
}

function ClaimCardComponent({
  card,
  stageId,
  onStageDragEnd,
  onUpdateCard,
  onDeleteCard,
}: {
  card: ClaimCard;
  stageId: StageId;
  onStageDragEnd: () => void;
  onUpdateCard: (
    stageId: StageId,
    cardId: string,
    updates: Partial<Omit<ClaimCard, "id" | "status">>,
  ) => void;
  onDeleteCard: (stageId: StageId, cardId: string) => void;
}) {
  const priorityConfig = getPriorityConfig(card.priority);
  const PriorityIcon = priorityConfig.icon;
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isQuickVistoriaOpen, setIsQuickVistoriaOpen] = useState(false);
  const [credenciadosDisponiveis, setCredenciadosDisponiveis] = useState<
    string[]
  >([]);
  const [quickVistoria, setQuickVistoria] = useState({
    credenciado: card.credenciado || "",
    statusVistoria: (card.statusVistoria || "pendente") as
      | "agendada"
      | "realizada"
      | "pendente",
  });
  const [formState, setFormState] = useState({
    vehicle: card.vehicle,
    plate: card.plate,
    workshop: card.workshop,
    entryDate: card.entryDate,
    priority: card.priority,
    daysInStage: String(card.daysInStage),
    credenciado: card.credenciado || "",
    statusVistoria: (card.statusVistoria || "pendente") as
      | "agendada"
      | "realizada"
      | "pendente",
  });

  const formattedStatus = useMemo(
    () => stageId.charAt(0).toUpperCase() + stageId.slice(1),
    [stageId],
  );

  useEffect(() => {
    const syncCredenciados = () => {
      setCredenciadosDisponiveis(getCredenciadosDisponiveisNomes());
    };

    syncCredenciados();
    window.addEventListener("argos:credenciados-updated", syncCredenciados);

    return () => {
      window.removeEventListener(
        "argos:credenciados-updated",
        syncCredenciados,
      );
    };
  }, []);

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ cardId: card.id, sourceStageId: stageId }),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const handleOpenEdit = () => {
    setFormState({
      vehicle: card.vehicle,
      plate: card.plate,
      workshop: card.workshop,
      entryDate: card.entryDate,
      priority: card.priority,
      daysInStage: String(card.daysInStage),
      credenciado: card.credenciado || "",
      statusVistoria: (card.statusVistoria || "pendente") as
        | "agendada"
        | "realizada"
        | "pendente",
    });
    setIsDetailsOpen(false);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const statusVistoria = formState.statusVistoria as
      | "agendada"
      | "realizada"
      | "pendente";

    onUpdateCard(stageId, card.id, {
      vehicle: formState.vehicle,
      plate: formState.plate,
      workshop: formState.workshop,
      entryDate: formState.entryDate,
      priority: formState.priority,
      daysInStage: Number.parseInt(formState.daysInStage || "0", 10),
      credenciado: formState.credenciado,
      statusVistoria,
    });

    if (formState.credenciado) {
      upsertVistoriaVinculadaStore({
        sinistroId: card.id,
        veiculo: formState.vehicle,
        placa: formState.plate,
        credenciado: formState.credenciado,
        status: statusVistoria,
      });
    }

    setIsEditOpen(false);
  };

  const handleOpenDetails = () => {
    setQuickVistoria({
      credenciado: card.credenciado || "",
      statusVistoria: (card.statusVistoria || "pendente") as
        | "agendada"
        | "realizada"
        | "pendente",
    });
    setIsQuickVistoriaOpen(false);
    setIsDetailsOpen(true);
  };

  const handleSaveQuickVistoria = () => {
    if (!quickVistoria.credenciado) {
      return;
    }

    onUpdateCard(stageId, card.id, {
      credenciado: quickVistoria.credenciado,
      statusVistoria: quickVistoria.statusVistoria,
    });

    upsertVistoriaVinculadaStore({
      sinistroId: card.id,
      veiculo: card.vehicle,
      placa: card.plate,
      credenciado: quickVistoria.credenciado,
      status: quickVistoria.statusVistoria,
    });

    setIsQuickVistoriaOpen(false);
  };

  return (
    <>
      <Card
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onStageDragEnd}
        onClick={handleOpenDetails}
        className="cursor-pointer rounded-lg border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
      >
        <CardContent className="space-y-2 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <span className="block truncate text-base font-semibold leading-none tracking-tight text-foreground">
                {card.id}
              </span>
              <Badge
                className={cn(
                  "inline-flex h-5 max-w-full gap-1 rounded-full px-1.5 py-0 text-[9px] font-semibold",
                  priorityConfig.className,
                )}
              >
                <PriorityIcon className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{priorityConfig.label}</span>
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                  <span className="sr-only">Ações do card</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenEdit();
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Apagar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="overflow-hidden rounded-md border border-border/60 bg-linear-to-br from-muted/65 via-muted/30 to-background px-2 py-1.5">
            <p className="text-[8px] uppercase tracking-widest text-muted-foreground">
              Entrada
            </p>
            <p className="mt-0.5 truncate text-[11px] font-semibold leading-tight text-foreground">
              {card.entryDate}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Sinistro {card.id}</DialogTitle>
            <DialogDescription>
              Informações completas do card selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "inline-flex max-w-full gap-1 text-xs font-medium",
                  priorityConfig.className,
                )}
              >
                <PriorityIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{priorityConfig.label}</span>
              </Badge>
              <Badge variant="outline">Status: {formattedStatus}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Veículo
                </p>
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <Car className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p>{card.vehicle}</p>
                    <p className="font-medium">{card.plate}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Oficina
                </p>
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p>{card.workshop}</p>
                </div>
              </div>

              <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Data de entrada
                </p>
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p>{card.entryDate}</p>
                </div>
              </div>

              <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Permanência
                </p>
                <p className="text-sm font-medium text-foreground">
                  {card.daysInStage} dias neste estágio
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Vistoria</p>
                  <p className="text-sm font-medium text-foreground">
                    Credenciado e status
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuickVistoriaOpen((prev) => !prev)}
                >
                  {card.credenciado
                    ? "Alterar vistoria"
                    : "Adicionar vistoriador"}
                </Button>
              </div>

              {isQuickVistoriaOpen && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`quick-credenciado-${card.id}`}>
                        Credenciado
                      </Label>
                      <Select
                        value={quickVistoria.credenciado}
                        onValueChange={(value) =>
                          setQuickVistoria((prev) => ({
                            ...prev,
                            credenciado: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          id={`quick-credenciado-${card.id}`}
                          className="w-full"
                        >
                          <SelectValue placeholder="Selecione um credenciado" />
                        </SelectTrigger>
                        <SelectContent>
                          {credenciadosDisponiveis.map((credenciado) => (
                            <SelectItem key={credenciado} value={credenciado}>
                              {credenciado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`quick-status-${card.id}`}>Status</Label>
                      <Select
                        value={quickVistoria.statusVistoria}
                        onValueChange={(value) =>
                          setQuickVistoria((prev) => ({
                            ...prev,
                            statusVistoria: value as
                              | "agendada"
                              | "realizada"
                              | "pendente",
                          }))
                        }
                      >
                        <SelectTrigger
                          id={`quick-status-${card.id}`}
                          className="w-full"
                        >
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="agendada">Agendada</SelectItem>
                          <SelectItem value="realizada">Realizada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuickVistoria({
                          credenciado: card.credenciado || "",
                          statusVistoria: (card.statusVistoria ||
                            "pendente") as
                            | "agendada"
                            | "realizada"
                            | "pendente",
                        });
                        setIsQuickVistoriaOpen(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveQuickVistoria}
                      disabled={!quickVistoria.credenciado}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Card {card.id}</DialogTitle>
            <DialogDescription>
              Atualize as informações do sinistro selecionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`vehicle-${card.id}`}>Veículo</Label>
              <Input
                id={`vehicle-${card.id}`}
                value={formState.vehicle}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    vehicle: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`plate-${card.id}`}>Placa</Label>
                <Input
                  id={`plate-${card.id}`}
                  value={formState.plate}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      plate: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`entryDate-${card.id}`}>Data de entrada</Label>
                <Input
                  id={`entryDate-${card.id}`}
                  value={formState.entryDate}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      entryDate: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`workshop-${card.id}`}>Oficina</Label>
              <Input
                id={`workshop-${card.id}`}
                value={formState.workshop}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    workshop: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={formState.priority}
                  onValueChange={(value: ClaimCard["priority"]) =>
                    setFormState((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="within-sla">Dentro do SLA</SelectItem>
                    <SelectItem value="attention">Atenção</SelectItem>
                    <SelectItem value="delayed">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`days-${card.id}`}>Dias no estágio</Label>
                <Input
                  id={`days-${card.id}`}
                  type="number"
                  min={0}
                  value={formState.daysInStage}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      daysInStage: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            {/* Seção de Vistoria */}
            <div className="border-t pt-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                Vistoria
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`credenciado-${card.id}`}>Credenciado</Label>
                  <Select
                    value={formState.credenciado}
                    onValueChange={(value) =>
                      setFormState((prev) => ({ ...prev, credenciado: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um credenciado" />
                    </SelectTrigger>
                    <SelectContent>
                      {credenciadosDisponiveis.map((credenciado) => (
                        <SelectItem key={credenciado} value={credenciado}>
                          {credenciado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`statusVistoria-${card.id}`}>Status</Label>
                  <Select
                    value={formState.statusVistoria}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        statusVistoria: value as
                          | "agendada"
                          | "realizada"
                          | "pendente",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="agendada">Agendada</SelectItem>
                      <SelectItem value="realizada">Realizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja apagar o sinistro{" "}
              <strong>{card.id}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDeleteCard(stageId, card.id);
                setIsDeleteConfirmOpen(false);
              }}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function KanbanColumn({
  stage,
  isDragOver,
  onStageDragOver,
  onStageDragEnd,
  onCardDrop,
  onUpdateCard,
  onDeleteCard,
}: KanbanColumnProps) {
  const getDragPayload = (event: DragEvent<HTMLElement>) => {
    const payload = event.dataTransfer.getData("application/json");
    if (!payload) return null;

    return JSON.parse(payload) as {
      cardId: string;
      sourceStageId: StageId;
    };
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onStageDragOver();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const payload = getDragPayload(event);
    if (!payload) {
      onStageDragEnd();
      return;
    }

    onCardDrop(
      payload.cardId,
      payload.sourceStageId,
      stage.id,
      stage.cards.length,
    );
  };

  const handleCardDrop = (
    event: DragEvent<HTMLDivElement>,
    cardIndex: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const payload = getDragPayload(event);
    if (!payload) {
      onStageDragEnd();
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const isDropBelowCard = event.clientY > bounds.top + bounds.height / 2;
    const insertionIndex = isDropBelowCard ? cardIndex + 1 : cardIndex;

    onCardDrop(payload.cardId, payload.sourceStageId, stage.id, insertionIndex);
  };

  return (
    <div className="min-w-0">
      <Card
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragLeave={onStageDragEnd}
        className={cn(
          "h-full border-border/60 bg-muted/20 shadow-none transition-colors",
          isDragOver && "border-primary/50 bg-primary/5",
        )}
      >
        <CardHeader className="border-b border-border/50 p-3 pb-3">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", stage.color)} />
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {stage.title}
            </CardTitle>
            <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
              {stage.cards.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          {stage.cards.map((card, cardIndex) => (
            <div
              key={card.id}
              onDragOver={handleDragOver}
              onDrop={(event) => handleCardDrop(event, cardIndex)}
            >
              <ClaimCardComponent
                card={card}
                stageId={stage.id}
                onStageDragEnd={onStageDragEnd}
                onUpdateCard={onUpdateCard}
                onDeleteCard={onDeleteCard}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
