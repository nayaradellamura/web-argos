"use client";

import { DragEvent, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        label: "Dentro do SLA",
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formState, setFormState] = useState({
    vehicle: card.vehicle,
    plate: card.plate,
    workshop: card.workshop,
    entryDate: card.entryDate,
    priority: card.priority,
    daysInStage: String(card.daysInStage),
  });

  const formattedStatus = useMemo(
    () => stageId.charAt(0).toUpperCase() + stageId.slice(1),
    [stageId],
  );

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
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onUpdateCard(stageId, card.id, {
      vehicle: formState.vehicle,
      plate: formState.plate,
      workshop: formState.workshop,
      entryDate: formState.entryDate,
      priority: formState.priority,
      daysInStage: Number.parseInt(formState.daysInStage || "0", 10),
    });

    setIsEditOpen(false);
  };

  return (
    <>
      <Card
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onStageDragEnd}
        className="cursor-move border-border/70 bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
      >
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-foreground">
              {card.id}
            </span>
            <div className="flex items-center gap-1">
              <Badge
                className={cn(
                  "text-xs font-medium gap-1",
                  priorityConfig.className,
                )}
              >
                <PriorityIcon className="h-3 w-3" />
                {priorityConfig.label}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Ações do card</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleOpenEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDeleteCard(stageId, card.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Apagar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Car className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{card.vehicle}</span>
              <span className="font-medium text-foreground">{card.plate}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{card.workshop}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{card.entryDate}</span>
              <span className="text-muted-foreground/70">
                ({card.daysInStage}d neste estagio)
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Status: {formattedStatus}
            </p>
          </div>
        </CardContent>
      </Card>

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
