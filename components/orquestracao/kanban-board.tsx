"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
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
  upsertVistoriaVinculadaStore,
} from "@/lib/business-rules-store";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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
  damageType?: string;
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

interface DropActionPayload {
  cardId: string;
  sourceStageId: StageId;
  targetStageId: StageId;
  targetIndex?: number;
}

interface ClaimCardSeed {
  id: string;
  vehicle: string;
  plate: string;
  damageType?: string;
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

interface DispatchWorkshop {
  id: string;
  name: string;
  city: string;
  score: number;
  activeClaims: number;
  slaAvg: number;
  status: "ativo" | "pendente" | "suspenso";
}

const dispatchWorkshopsSeed: DispatchWorkshop[] = [
  {
    id: "OFC-001",
    name: "Elite Motors",
    city: "Araras-SP",
    score: 4.9,
    activeClaims: 12,
    slaAvg: 2.8,
    status: "ativo",
  },
  {
    id: "OFC-002",
    name: "AutoPrime Reparos",
    city: "Limeira-SP",
    score: 4.7,
    activeClaims: 8,
    slaAvg: 3.1,
    status: "ativo",
  },
  {
    id: "OFC-003",
    name: "CarTech Solutions",
    city: "Piracicaba-SP",
    score: 4.5,
    activeClaims: 6,
    slaAvg: 3.5,
    status: "ativo",
  },
  {
    id: "OFC-004",
    name: "MasterFix Auto",
    city: "Campinas-SP",
    score: 4.3,
    activeClaims: 15,
    slaAvg: 4.2,
    status: "ativo",
  },
  {
    id: "OFC-006",
    name: "VidroMax Automotivo",
    city: "Araras-SP",
    score: 4.6,
    activeClaims: 4,
    slaAvg: 1.5,
    status: "ativo",
  },
  {
    id: "OFC-008",
    name: "TopCar Funilaria",
    city: "Campinas-SP",
    score: 4.4,
    activeClaims: 11,
    slaAvg: 3.3,
    status: "ativo",
  },
];

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
        damageType: "Colisão frontal",
        workshop: "Auto Center Premium",
        entryDate: "11/04/2026",
        priority: "within-sla",
        daysInStage: 0,
      },
      {
        id: "CLM-126",
        vehicle: "Toyota Corolla",
        plate: "XYZ-5678",
        damageType: "Dano em para-choque traseiro",
        workshop: "Oficina Central",
        entryDate: "11/04/2026",
        priority: "within-sla",
        daysInStage: 0,
      },
      {
        id: "CLM-125",
        vehicle: "VW Golf",
        plate: "DEF-9012",
        damageType: "Avaria lateral",
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
        damageType: "Dano em suspensão",
        workshop: "Auto Rapido",
        entryDate: "09/04/2026",
        priority: "within-sla",
        daysInStage: 2,
      },
      {
        id: "CLM-121",
        vehicle: "Fiat Argo",
        plate: "JKL-7890",
        damageType: "Risco profundo em lataria",
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
        damageType: "Dano em roda e pneu",
        workshop: "Centro Automotivo SP",
        entryDate: "07/04/2026",
        priority: "within-sla",
        daysInStage: 4,
      },
      {
        id: "CLM-117",
        vehicle: "Renault Kwid",
        plate: "PQR-5678",
        damageType: "Dano estrutural traseiro",
        workshop: "Auto Service Plus",
        entryDate: "06/04/2026",
        priority: "delayed",
        daysInStage: 5,
      },
      {
        id: "CLM-116",
        vehicle: "Ford Ka",
        plate: "STU-9012",
        damageType: "Quebra de farol e para-lama",
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
        damageType: "Dano em capô",
        workshop: "Premium Auto",
        entryDate: "05/04/2026",
        priority: "within-sla",
        daysInStage: 6,
      },
      {
        id: "CLM-112",
        vehicle: "Nissan Kicks",
        plate: "YZA-7890",
        damageType: "Porta dianteira amassada",
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
        damageType: "Dano em painel frontal",
        workshop: "Auto Center Premium",
        entryDate: "03/04/2026",
        priority: "within-sla",
        daysInStage: 8,
      },
      {
        id: "CLM-107",
        vehicle: "Citroen C3",
        plate: "EFG-5678",
        damageType: "Dano em suspensão traseira",
        workshop: "Oficina Express",
        entryDate: "02/04/2026",
        priority: "delayed",
        daysInStage: 9,
      },
      {
        id: "CLM-106",
        vehicle: "VW Polo",
        plate: "HIJ-9012",
        damageType: "Dano parcial em lateral",
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
        damageType: "Dano em para-brisa",
        workshop: "Centro Automotivo SP",
        entryDate: "01/04/2026",
        priority: "within-sla",
        daysInStage: 10,
      },
      {
        id: "CLM-102",
        vehicle: "Toyota Yaris",
        plate: "NOP-7890",
        damageType: "Avaria em porta-malas",
        workshop: "Premium Auto",
        entryDate: "31/03/2026",
        priority: "within-sla",
        daysInStage: 11,
      },
      {
        id: "CLM-098",
        vehicle: "Fiat Pulse",
        plate: "QRS-1234",
        damageType: "Dano em para-choque frontal",
        workshop: "Auto Service Plus",
        entryDate: "25/03/2026",
        priority: "within-sla",
        daysInStage: 17,
      },
      {
        id: "CLM-097",
        vehicle: "Chevrolet Tracker",
        plate: "TUV-5678",
        damageType: "Dano em capota",
        workshop: "Repair Masters",
        entryDate: "24/03/2026",
        priority: "within-sla",
        daysInStage: 18,
      },
      {
        id: "CLM-096",
        vehicle: "Hyundai Creta",
        plate: "WXY-9012",
        damageType: "Risco profundo em pintura",
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

function getWorkshopBalanceScore(workshop: DispatchWorkshop) {
  return (
    workshop.score * 100 - workshop.activeClaims * 2 - workshop.slaAvg * 12
  );
}

function getDefaultDamageType(priority: ClaimCard["priority"]) {
  if (priority === "delayed") {
    return "Dano estrutural crítico";
  }

  if (priority === "attention") {
    return "Dano moderado com divergências";
  }

  return "Dano de baixa complexidade";
}

function cloneStages(stages: KanbanStage[]): KanbanStage[] {
  return stages.map((stage) => ({
    ...stage,
    cards: stage.cards.map((card) => ({ ...card })),
  }));
}

function moveCardAcrossStages(
  currentStages: KanbanStage[],
  payload: DropActionPayload,
  cardUpdates?: Partial<Omit<ClaimCard, "id" | "status">>,
) {
  const { cardId, sourceStageId, targetStageId, targetIndex } = payload;

  const sourceStageIndex = currentStages.findIndex(
    (stage) => stage.id === sourceStageId,
  );
  const targetStageIndex = currentStages.findIndex(
    (stage) => stage.id === targetStageId,
  );

  if (sourceStageIndex === -1 || targetStageIndex === -1) {
    return {
      nextStages: currentStages,
      moved: false,
      movedCard: null as ClaimCard | null,
    };
  }

  const isAdjacentTransition =
    Math.abs(targetStageIndex - sourceStageIndex) === 1;

  if (sourceStageId !== targetStageId && !isAdjacentTransition) {
    return {
      nextStages: currentStages,
      moved: false,
      movedCard: null as ClaimCard | null,
    };
  }

  const nextStages = currentStages.map((stage) => ({
    ...stage,
    cards: [...stage.cards],
  }));

  const sourceCards = nextStages[sourceStageIndex].cards;
  const targetCards = nextStages[targetStageIndex].cards;

  const sourceCardIndex = sourceCards.findIndex((card) => card.id === cardId);

  if (sourceCardIndex === -1) {
    return {
      nextStages: currentStages,
      moved: false,
      movedCard: null as ClaimCard | null,
    };
  }

  const [cardToMove] = sourceCards.splice(sourceCardIndex, 1);

  if (!cardToMove) {
    return {
      nextStages: currentStages,
      moved: false,
      movedCard: null as ClaimCard | null,
    };
  }

  let insertionIndex = targetIndex ?? targetCards.length;

  if (sourceStageId === targetStageId && insertionIndex > sourceCardIndex) {
    insertionIndex -= 1;
  }

  insertionIndex = Math.max(0, Math.min(insertionIndex, targetCards.length));

  const movedCard: ClaimCard = {
    ...cardToMove,
    ...cardUpdates,
    status: targetStageId,
  };

  targetCards.splice(insertionIndex, 0, movedCard);

  return {
    nextStages,
    moved: true,
    movedCard,
  };
}

async function patchSinistroStage(
  cardId: string,
  targetStageId: StageId,
  vistoriaPayload?: {
    credenciado?: string;
    localVistoria?: string;
    dataVistoria?: string;
    horaVistoria?: string;
    statusVistoria?: "agendada" | "realizada" | "pendente";
  },
) {
  const response = await fetch(
    `/api/sinistros/${encodeURIComponent(cardId)}/stage`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stage: targetStageId,
        ...vistoriaPayload,
      }),
    },
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
      details?: string;
    } | null;

    const message =
      data?.details || data?.error || "Falha ao salvar atualização de estágio.";

    throw new Error(message);
  }
}

export function KanbanBoard() {
  const [stages, setStages] = useState<KanbanStage[]>(initialStages);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [pendingDropAction, setPendingDropAction] =
    useState<DropActionPayload | null>(null);
  const [pendingDispatchCard, setPendingDispatchCard] =
    useState<ClaimCard | null>(null);
  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false);
  const [isPersistingStage, setIsPersistingStage] = useState(false);
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
  const [dispatchSearchQuery, setDispatchSearchQuery] = useState("");
  const [dispatchForm, setDispatchForm] = useState({
    credenciado: "",
    localVistoria: "",
    dataVistoria: "",
    horaVistoria: "",
    statusVistoria: "agendada" as "agendada" | "realizada" | "pendente",
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

  const availableDispatchWorkshops = useMemo(
    () => dispatchWorkshopsSeed.filter((item) => item.status !== "suspenso"),
    [],
  );

  const filteredDispatchWorkshops = useMemo(() => {
    const query = dispatchSearchQuery.trim().toLowerCase();

    if (!query) {
      return availableDispatchWorkshops;
    }

    return availableDispatchWorkshops.filter((workshop) =>
      `${workshop.name} ${workshop.city}`.toLowerCase().includes(query),
    );
  }, [availableDispatchWorkshops, dispatchSearchQuery]);

  const recommendedWorkshopId = useMemo(() => {
    if (filteredDispatchWorkshops.length === 0) {
      return null;
    }

    return [...filteredDispatchWorkshops].sort(
      (a, b) => getWorkshopBalanceScore(b) - getWorkshopBalanceScore(a),
    )[0]?.id;
  }, [filteredDispatchWorkshops]);

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

  const persistMoveWithOptimisticUi = async (
    payload: DropActionPayload,
    cardUpdates?: Partial<Omit<ClaimCard, "id" | "status">>,
  ) => {
    const movementSnapshot: {
      previousStages: KanbanStage[] | null;
      movedCard: ClaimCard | null;
      moved: boolean;
    } = {
      previousStages: null,
      movedCard: null,
      moved: false,
    };

    setStages((currentStages) => {
      movementSnapshot.previousStages = cloneStages(currentStages);

      const moveResult = moveCardAcrossStages(
        currentStages,
        payload,
        cardUpdates,
      );

      movementSnapshot.moved = moveResult.moved;
      movementSnapshot.movedCard = moveResult.movedCard;

      return moveResult.nextStages;
    });

    setDragOverStageId(null);

    if (!movementSnapshot.moved || !movementSnapshot.movedCard) {
      return;
    }

    const movedCard = movementSnapshot.movedCard;

    setIsPersistingStage(true);
    const savingToast = toast({
      title: "Salvando...",
      description: `Atualizando estágio do ${movedCard.id}.`,
    });

    try {
      await patchSinistroStage(movedCard.id, payload.targetStageId, {
        credenciado: movedCard.credenciado,
        localVistoria: movedCard.localVistoria,
        dataVistoria: movedCard.dataVistoria,
        horaVistoria: movedCard.horaVistoria,
        statusVistoria: movedCard.statusVistoria,
      });

      if (payload.targetStageId === "vistoria" && movedCard.credenciado) {
        upsertVistoriaVinculadaStore({
          sinistroId: movedCard.id,
          veiculo: movedCard.vehicle,
          placa: movedCard.plate,
          credenciado: movedCard.credenciado,
          status: movedCard.statusVistoria || "agendada",
        });
      }

      savingToast.dismiss();
      toast({
        title: "Estágio atualizado",
        description: `${movedCard.id} movido para ${payload.targetStageId.toUpperCase()}.`,
      });
    } catch (error) {
      savingToast.dismiss();

      if (movementSnapshot.previousStages) {
        setStages(movementSnapshot.previousStages);
      }

      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a movimentação.";

      toast({
        title: "Falha ao salvar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsPersistingStage(false);
    }
  };

  const handleDropAction = (
    cardId: string,
    sourceStageId: StageId,
    targetStageId: StageId,
    targetIndex?: number,
  ) => {
    const payload: DropActionPayload = {
      cardId,
      sourceStageId,
      targetStageId,
      targetIndex,
    };

    if (targetStageId === "vistoria" && sourceStageId !== "vistoria") {
      const sourceStage = stages.find((stage) => stage.id === sourceStageId);
      const cardToDispatch =
        sourceStage?.cards.find((card) => card.id === cardId) || null;

      setPendingDropAction(payload);
      setPendingDispatchCard(cardToDispatch);
      setDispatchSearchQuery("");
      setDispatchForm({
        credenciado: "",
        localVistoria: "",
        dataVistoria: "",
        horaVistoria: "",
        statusVistoria: "agendada",
      });
      setIsDispatchDialogOpen(true);
      setDragOverStageId(null);
      return;
    }

    void persistMoveWithOptimisticUi(payload);
  };

  const handleCancelDispatchDialog = () => {
    setIsDispatchDialogOpen(false);
    setPendingDropAction(null);
    setPendingDispatchCard(null);
    setDragOverStageId(null);
  };

  const handleConfirmDispatchDialog = async () => {
    if (!pendingDropAction) {
      return;
    }

    if (
      !dispatchForm.credenciado ||
      !dispatchForm.dataVistoria ||
      !dispatchForm.horaVistoria
    ) {
      toast({
        title: "Despacho incompleto",
        description: "Preencha credenciado, data e hora da vistoria.",
        variant: "destructive",
      });
      return;
    }

    await persistMoveWithOptimisticUi(pendingDropAction, {
      credenciado: dispatchForm.credenciado,
      localVistoria: dispatchForm.localVistoria,
      dataVistoria: dispatchForm.dataVistoria,
      horaVistoria: dispatchForm.horaVistoria,
      statusVistoria: dispatchForm.statusVistoria,
    });

    setIsDispatchDialogOpen(false);
    setPendingDropAction(null);
    setPendingDispatchCard(null);
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
            onCardDrop={handleDropAction}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
          />
        ))}
      </div>

      <Dialog
        open={isDispatchDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDispatchDialog();
            return;
          }

          setIsDispatchDialogOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Despacho de Vistoria</DialogTitle>
            <DialogDescription>
              O sinistro só será movido para VISTORIA TECNICA após confirmar os
              dados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/25 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Contexto do Sinistro
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Veículo</p>
                  <p className="text-sm font-medium text-foreground">
                    {pendingDispatchCard?.vehicle || "Não informado"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Placa</p>
                  <p className="text-sm font-medium text-foreground">
                    {pendingDispatchCard?.plate || "Não informado"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Tipo de Dano
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {pendingDispatchCard?.damageType ||
                      (pendingDispatchCard
                        ? getDefaultDamageType(pendingDispatchCard.priority)
                        : "Não informado")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatch-search">
                Buscar oficina credenciada
              </Label>
              <Input
                id="dispatch-search"
                value={dispatchSearchQuery}
                onChange={(event) => setDispatchSearchQuery(event.target.value)}
                placeholder="Filtrar por nome ou cidade"
              />
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border/60 p-2">
              {filteredDispatchWorkshops.length === 0 && (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  Nenhuma oficina encontrada para o filtro informado.
                </p>
              )}

              {filteredDispatchWorkshops.map((workshop) => {
                const isSelected = dispatchForm.credenciado === workshop.name;
                const isRecommended = workshop.id === recommendedWorkshopId;

                return (
                  <button
                    key={workshop.id}
                    type="button"
                    onClick={() =>
                      setDispatchForm((prev) => ({
                        ...prev,
                        credenciado: workshop.name,
                        localVistoria: prev.localVistoria || workshop.city,
                      }))
                    }
                    className={cn(
                      "w-full rounded-md border border-border/60 bg-card p-3 text-left transition-colors",
                      "hover:border-primary/40 hover:bg-primary/5",
                      isSelected &&
                        "border-primary bg-primary/10 ring-1 ring-primary/40",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {workshop.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {workshop.city}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          ⭐ {workshop.score.toFixed(1)}
                        </Badge>
                        {isRecommended && (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Recomendada
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      🚦 {workshop.activeClaims} ativos | ⏱️ SLA:{" "}
                      {workshop.slaAvg.toFixed(1)} dias
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatch-credenciado">Credenciado</Label>
              <Input
                id="dispatch-credenciado"
                value={dispatchForm.credenciado}
                onChange={(event) =>
                  setDispatchForm((prev) => ({
                    ...prev,
                    credenciado: event.target.value,
                  }))
                }
                placeholder="Nome do credenciado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatch-local">Local da vistoria</Label>
              <Input
                id="dispatch-local"
                value={dispatchForm.localVistoria}
                onChange={(event) =>
                  setDispatchForm((prev) => ({
                    ...prev,
                    localVistoria: event.target.value,
                  }))
                }
                placeholder="Ex.: Oficina Central SP"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dispatch-date">Data da vistoria</Label>
                <Input
                  id="dispatch-date"
                  type="date"
                  value={dispatchForm.dataVistoria}
                  onChange={(event) =>
                    setDispatchForm((prev) => ({
                      ...prev,
                      dataVistoria: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispatch-time">Hora da vistoria</Label>
                <Input
                  id="dispatch-time"
                  type="time"
                  value={dispatchForm.horaVistoria}
                  onChange={(event) =>
                    setDispatchForm((prev) => ({
                      ...prev,
                      horaVistoria: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status inicial da vistoria</Label>
              <Select
                value={dispatchForm.statusVistoria}
                onValueChange={(value) =>
                  setDispatchForm((prev) => ({
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDispatchDialog}
              disabled={isPersistingStage}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDispatchDialog}
              disabled={isPersistingStage}
            >
              Confirmar despacho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
