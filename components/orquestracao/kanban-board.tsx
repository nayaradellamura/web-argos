"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { KanbanColumn } from "./kanban-column";
import {
  getSinistrosStore,
  setSinistrosStore,
  SinistroStoreItem,
} from "@/lib/business-rules-store";

export type StageId =
  | "fnol"
  | "validacao"
  | "vistoria"
  | "orcamento"
  | "regulacao"
  | "liquidacao";

export interface ClaimCard {
  id: string;
  vehicle: string;
  plate: string;
  workshop: string;
  entryDate: string;
  priority: "within-sla" | "attention" | "delayed";
  daysInStage: number;
  status: StageId;
  // Vistoria fields
  credenciado?: string;
  localVistoria?: string;
  dataVistoria?: string;
  horaVistoria?: string;
  statusVistoria?: "agendada" | "realizada" | "pendente";
}

export interface KanbanStage {
  id: StageId;
  title: string;
  color: string;
  cards: ClaimCard[];
}

interface ClaimCardSeed {
  id: string;
  vehicle: string;
  plate: string;
  workshop: string;
  entryDate: string;
  priority: "within-sla" | "attention" | "delayed";
  daysInStage: number;
}

interface KanbanStageSeed {
  id: StageId;
  title: string;
  color: string;
  cards: ClaimCardSeed[];
}

const initialStagesSeed: KanbanStageSeed[] = [
  {
    id: "fnol",
    title: "ENTRADA (FNOL)",
    color: "bg-blue-500",
    cards: [
      {
        id: "CLM-127",
        vehicle: "Honda Civic",
        plate: "ABC-1234",
        workshop: "Auto Center Premium",
        entryDate: "11/04/2026",
        priority: "within-sla",
        daysInStage: 0,
      },
      {
        id: "CLM-126",
        vehicle: "Toyota Corolla",
        plate: "XYZ-5678",
        workshop: "Oficina Central",
        entryDate: "11/04/2026",
        priority: "within-sla",
        daysInStage: 0,
      },
      {
        id: "CLM-125",
        vehicle: "VW Golf",
        plate: "DEF-9012",
        workshop: "Repair Masters",
        entryDate: "10/04/2026",
        priority: "attention",
        daysInStage: 1,
      },
    ],
  },
  {
    id: "validacao",
    title: "VALIDACAO E TRIAGEM",
    color: "bg-purple-500",
    cards: [
      {
        id: "CLM-122",
        vehicle: "Hyundai HB20",
        plate: "GHI-3456",
        workshop: "Auto Rapido",
        entryDate: "09/04/2026",
        priority: "within-sla",
        daysInStage: 2,
      },
      {
        id: "CLM-121",
        vehicle: "Fiat Argo",
        plate: "JKL-7890",
        workshop: "Oficina Express",
        entryDate: "08/04/2026",
        priority: "attention",
        daysInStage: 3,
      },
    ],
  },
  {
    id: "vistoria",
    title: "VISTORIA TECNICA",
    color: "bg-amber-500",
    cards: [
      {
        id: "CLM-118",
        vehicle: "Chevrolet Onix",
        plate: "MNO-1234",
        workshop: "Centro Automotivo SP",
        entryDate: "07/04/2026",
        priority: "within-sla",
        daysInStage: 4,
      },
      {
        id: "CLM-117",
        vehicle: "Renault Kwid",
        plate: "PQR-5678",
        workshop: "Auto Service Plus",
        entryDate: "06/04/2026",
        priority: "delayed",
        daysInStage: 5,
      },
      {
        id: "CLM-116",
        vehicle: "Ford Ka",
        plate: "STU-9012",
        workshop: "Oficina Central",
        entryDate: "08/04/2026",
        priority: "within-sla",
        daysInStage: 3,
      },
    ],
  },
  {
    id: "orcamento",
    title: "ORCAMENTO",
    color: "bg-cyan-500",
    cards: [
      {
        id: "CLM-113",
        vehicle: "Jeep Compass",
        plate: "VWX-3456",
        workshop: "Premium Auto",
        entryDate: "05/04/2026",
        priority: "within-sla",
        daysInStage: 6,
      },
      {
        id: "CLM-112",
        vehicle: "Nissan Kicks",
        plate: "YZA-7890",
        workshop: "Repair Masters",
        entryDate: "04/04/2026",
        priority: "attention",
        daysInStage: 7,
      },
    ],
  },
  {
    id: "regulacao",
    title: "REGULACAO",
    color: "bg-orange-500",
    cards: [
      {
        id: "CLM-108",
        vehicle: "Peugeot 208",
        plate: "BCD-1234",
        workshop: "Auto Center Premium",
        entryDate: "03/04/2026",
        priority: "within-sla",
        daysInStage: 8,
      },
      {
        id: "CLM-107",
        vehicle: "Citroen C3",
        plate: "EFG-5678",
        workshop: "Oficina Express",
        entryDate: "02/04/2026",
        priority: "delayed",
        daysInStage: 9,
      },
      {
        id: "CLM-106",
        vehicle: "VW Polo",
        plate: "HIJ-9012",
        workshop: "Auto Rapido",
        entryDate: "03/04/2026",
        priority: "attention",
        daysInStage: 8,
      },
    ],
  },
  {
    id: "liquidacao",
    title: "LIQUIDACAO",
    color: "bg-emerald-500",
    cards: [
      {
        id: "CLM-103",
        vehicle: "Honda HR-V",
        plate: "KLM-3456",
        workshop: "Centro Automotivo SP",
        entryDate: "01/04/2026",
        priority: "within-sla",
        daysInStage: 10,
      },
      {
        id: "CLM-102",
        vehicle: "Toyota Yaris",
        plate: "NOP-7890",
        workshop: "Premium Auto",
        entryDate: "31/03/2026",
        priority: "within-sla",
        daysInStage: 11,
      },
      {
        id: "CLM-098",
        vehicle: "Fiat Pulse",
        plate: "QRS-1234",
        workshop: "Auto Service Plus",
        entryDate: "25/03/2026",
        priority: "within-sla",
        daysInStage: 17,
      },
      {
        id: "CLM-097",
        vehicle: "Chevrolet Tracker",
        plate: "TUV-5678",
        workshop: "Repair Masters",
        entryDate: "24/03/2026",
        priority: "within-sla",
        daysInStage: 18,
      },
      {
        id: "CLM-096",
        vehicle: "Hyundai Creta",
        plate: "WXY-9012",
        workshop: "Oficina Central",
        entryDate: "23/03/2026",
        priority: "within-sla",
        daysInStage: 19,
      },
    ],
  },
];

const initialStages: KanbanStage[] = initialStagesSeed.map((stage) => ({
  ...stage,
  cards: stage.cards.map((card) => ({ ...card, status: stage.id })),
}));

const initialSinistrosStoreItems: SinistroStoreItem[] = initialStages.flatMap(
  (stage) =>
    stage.cards.map((card) => ({
      id: card.id,
      vehicle: card.vehicle,
      plate: card.plate,
      workshop: card.workshop,
      entryDate: card.entryDate,
      priority: card.priority,
      daysInStage: card.daysInStage,
      status: card.status,
      credenciado: card.credenciado,
      statusVistoria: card.statusVistoria,
    })),
);

function buildStagesFromSinistros(
  sinistros: SinistroStoreItem[],
): KanbanStage[] {
  const emptyStages = initialStagesSeed.map((stage) => ({
    id: stage.id,
    title: stage.title,
    color: stage.color,
    cards: [] as ClaimCard[],
  }));

  const stageById = new Map(emptyStages.map((stage) => [stage.id, stage]));

  sinistros.forEach((sinistro) => {
    const stage = stageById.get(sinistro.status);
    if (!stage) {
      return;
    }

    stage.cards.push({
      ...sinistro,
      status: sinistro.status,
    });
  });

  return emptyStages;
}

function getNextClaimId(stages: KanbanStage[]) {
  const maxId = stages.reduce((currentMax, stage) => {
    const stageMax = stage.cards.reduce((cardMax, card) => {
      const match = card.id.match(/^CLM-(\d+)$/);
      const parsed = match ? Number.parseInt(match[1], 10) : 0;
      return Math.max(cardMax, parsed);
    }, 0);

    return Math.max(currentMax, stageMax);
  }, 0);

  return `CLM-${String(maxId + 1).padStart(3, "0")}`;
}

export function KanbanBoard() {
  const [stages, setStages] = useState<KanbanStage[]>(initialStages);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [newCardForm, setNewCardForm] = useState({
    vehicle: "",
    plate: "",
    workshop: "",
    entryDate: "11/04/2026",
    priority: "within-sla" as ClaimCard["priority"],
    daysInStage: "0",
  });

  useEffect(() => {
    const storedSinistros = getSinistrosStore(initialSinistrosStoreItems);
    setStages(buildStagesFromSinistros(storedSinistros));
  }, []);

  useEffect(() => {
    const flatSinistros: SinistroStoreItem[] = stages.flatMap((stage) =>
      stage.cards.map((card) => ({
        id: card.id,
        vehicle: card.vehicle,
        plate: card.plate,
        workshop: card.workshop,
        entryDate: card.entryDate,
        priority: card.priority,
        daysInStage: card.daysInStage,
        status: card.status,
        credenciado: card.credenciado,
        statusVistoria: card.statusVistoria,
      })),
    );

    setSinistrosStore(flatSinistros);
  }, [stages]);

  const handleCreateCard = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStages((currentStages) => {
      const nextId = getNextClaimId(currentStages);

      return currentStages.map((stage) => {
        if (stage.id !== "fnol") {
          return stage;
        }

        const newCard: ClaimCard = {
          id: nextId,
          vehicle: newCardForm.vehicle,
          plate: newCardForm.plate,
          workshop: newCardForm.workshop,
          entryDate: newCardForm.entryDate,
          priority: newCardForm.priority,
          daysInStage: Number.parseInt(newCardForm.daysInStage || "0", 10),
          status: "fnol",
        };

        return {
          ...stage,
          cards: [newCard, ...stage.cards],
        };
      });
    });

    setNewCardForm({
      vehicle: "",
      plate: "",
      workshop: "",
      entryDate: "11/04/2026",
      priority: "within-sla",
      daysInStage: "0",
    });
    setIsCreateDialogOpen(false);
  };

  const handleUpdateCard = (
    stageId: StageId,
    cardId: string,
    updates: Partial<Omit<ClaimCard, "id" | "status">>,
  ) => {
    setStages((currentStages) =>
      currentStages.map((stage) => {
        if (stage.id !== stageId) {
          return stage;
        }

        return {
          ...stage,
          cards: stage.cards.map((card) =>
            card.id === cardId ? { ...card, ...updates } : card,
          ),
        };
      }),
    );
  };

  const handleDeleteCard = (stageId: StageId, cardId: string) => {
    setStages((currentStages) =>
      currentStages.map((stage) => {
        if (stage.id !== stageId) {
          return stage;
        }

        return {
          ...stage,
          cards: stage.cards.filter((card) => card.id !== cardId),
        };
      }),
    );
  };

  const handleMoveCard = (
    cardId: string,
    sourceStageId: StageId,
    targetStageId: StageId,
    targetIndex?: number,
  ) => {
    setStages((currentStages) => {
      const sourceStageIndex = currentStages.findIndex(
        (stage) => stage.id === sourceStageId,
      );
      const targetStageIndex = currentStages.findIndex(
        (stage) => stage.id === targetStageId,
      );

      if (sourceStageIndex === -1 || targetStageIndex === -1) {
        return currentStages;
      }

      const isAdjacentTransition =
        Math.abs(targetStageIndex - sourceStageIndex) === 1;

      if (sourceStageId !== targetStageId && !isAdjacentTransition) {
        return currentStages;
      }

      const nextStages = currentStages.map((stage) => ({
        ...stage,
        cards: [...stage.cards],
      }));

      const sourceCards = nextStages[sourceStageIndex].cards;
      const targetCards = nextStages[targetStageIndex].cards;

      const sourceCardIndex = sourceCards.findIndex(
        (card) => card.id === cardId,
      );

      if (sourceCardIndex === -1) {
        return currentStages;
      }

      const [cardToMove] = sourceCards.splice(sourceCardIndex, 1);

      if (!cardToMove) {
        return currentStages;
      }

      let insertionIndex = targetIndex ?? targetCards.length;

      if (sourceStageId === targetStageId && insertionIndex > sourceCardIndex) {
        insertionIndex -= 1;
      }

      insertionIndex = Math.max(
        0,
        Math.min(insertionIndex, targetCards.length),
      );

      targetCards.splice(insertionIndex, 0, {
        ...cardToMove,
        status: targetStageId,
      });

      return nextStages;
    });

    setDragOverStageId(null);
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por placa ou ID do sinistro..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="h-10 border-input bg-card pl-10"
          />
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 w-full px-5 sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Sinistro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Card de Sinistro</DialogTitle>
              <DialogDescription>
                O card será criado na etapa de Entrada (FNOL).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateCard} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-card-vehicle">Veículo</Label>
                <Input
                  id="new-card-vehicle"
                  value={newCardForm.vehicle}
                  onChange={(event) =>
                    setNewCardForm((prev) => ({
                      ...prev,
                      vehicle: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Honda Civic"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-card-plate">Placa</Label>
                  <Input
                    id="new-card-plate"
                    value={newCardForm.plate}
                    onChange={(event) =>
                      setNewCardForm((prev) => ({
                        ...prev,
                        plate: event.target.value,
                      }))
                    }
                    placeholder="ABC-1234"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-card-date">Data de entrada</Label>
                  <Input
                    id="new-card-date"
                    value={newCardForm.entryDate}
                    onChange={(event) =>
                      setNewCardForm((prev) => ({
                        ...prev,
                        entryDate: event.target.value,
                      }))
                    }
                    placeholder="11/04/2026"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-card-workshop">Oficina</Label>
                <Input
                  id="new-card-workshop"
                  value={newCardForm.workshop}
                  onChange={(event) =>
                    setNewCardForm((prev) => ({
                      ...prev,
                      workshop: event.target.value,
                    }))
                  }
                  placeholder="Ex.: Auto Center Premium"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={newCardForm.priority}
                    onValueChange={(value: ClaimCard["priority"]) =>
                      setNewCardForm((prev) => ({ ...prev, priority: value }))
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
                  <Label htmlFor="new-card-days">Dias no estágio</Label>
                  <Input
                    id="new-card-days"
                    type="number"
                    min={0}
                    value={newCardForm.daysInStage}
                    onChange={(event) =>
                      setNewCardForm((prev) => ({
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
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Criar Card</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 pb-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            isDragOver={dragOverStageId === stage.id}
            onStageDragOver={() => setDragOverStageId(stage.id)}
            onStageDragEnd={() => setDragOverStageId(null)}
            onCardDrop={handleMoveCard}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
          />
        ))}
      </div>
    </div>
  );
}
