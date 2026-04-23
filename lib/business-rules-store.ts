export type CredenciadoStatus = "ativo" | "pendente" | "suspenso";

export interface CredenciadoStoreItem {
  id: string;
  name: string;
  status: CredenciadoStatus;
}

export interface VistoriaVinculadaStoreItem {
  sinistroId: string;
  veiculo: string;
  placa: string;
  credenciado: string;
  status: "pendente" | "agendada" | "realizada";
  cliente?: string;
}

export type SinistroStage =
  | "fnol"
  | "validacao"
  | "vistoria"
  | "orcamento"
  | "regulacao"
  | "liquidacao";

export interface SinistroStoreItem {
  id: string;
  vehicle: string;
  plate: string;
  workshop: string;
  entryDate: string;
  priority: "within-sla" | "attention" | "delayed";
  daysInStage: number;
  status: SinistroStage;
  credenciado?: string;
  statusVistoria?: "agendada" | "realizada" | "pendente";
}

const CREDENCIADOS_KEY = "argos:credenciados";
const VISTORIAS_VINCULADAS_KEY = "argos:vistorias-vinculadas";
const SINISTROS_KEY = "argos:sinistros";

const credenciadosPadrao: CredenciadoStoreItem[] = [
  { id: "OFC-001", name: "Elite Motors", status: "ativo" },
  { id: "OFC-002", name: "AutoPrime Reparos", status: "ativo" },
  { id: "OFC-003", name: "CarTech Solutions", status: "ativo" },
  { id: "OFC-004", name: "MasterFix Auto", status: "ativo" },
  { id: "OFC-005", name: "ProRepair Center", status: "pendente" },
  { id: "OFC-006", name: "VidroMax Automotivo", status: "ativo" },
  { id: "OFC-007", name: "SpeedFix Mecanica", status: "suspenso" },
  { id: "OFC-008", name: "TopCar Funilaria", status: "ativo" },
];

function isBrowser() {
  return typeof window !== "undefined";
}

function parseStoredValue<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getCredenciadosStore(): CredenciadoStoreItem[] {
  if (!isBrowser()) {
    return credenciadosPadrao;
  }

  const stored = parseStoredValue<CredenciadoStoreItem[]>(
    window.localStorage.getItem(CREDENCIADOS_KEY),
  );

  if (stored && stored.length > 0) {
    return stored;
  }

  window.localStorage.setItem(
    CREDENCIADOS_KEY,
    JSON.stringify(credenciadosPadrao),
  );
  return credenciadosPadrao;
}

export function setCredenciadosStore(items: CredenciadoStoreItem[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(CREDENCIADOS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("argos:credenciados-updated"));
}

export function getCredenciadosDisponiveisNomes(): string[] {
  return getCredenciadosStore()
    .filter((item) => item.status !== "suspenso")
    .map((item) => item.name);
}

export function getVistoriasVinculadasStore(): VistoriaVinculadaStoreItem[] {
  if (!isBrowser()) {
    return [];
  }

  return (
    parseStoredValue<VistoriaVinculadaStoreItem[]>(
      window.localStorage.getItem(VISTORIAS_VINCULADAS_KEY),
    ) || []
  );
}

export function upsertVistoriaVinculadaStore(item: VistoriaVinculadaStoreItem) {
  if (!isBrowser()) {
    return;
  }

  const currentItems = getVistoriasVinculadasStore();
  const index = currentItems.findIndex(
    (current) => current.sinistroId === item.sinistroId,
  );

  if (index === -1) {
    currentItems.push(item);
  } else {
    currentItems[index] = {
      ...currentItems[index],
      ...item,
    };
  }

  window.localStorage.setItem(
    VISTORIAS_VINCULADAS_KEY,
    JSON.stringify(currentItems),
  );
  window.dispatchEvent(new Event("argos:vistorias-vinculadas-updated"));
}

export function getSinistrosStore(
  initialItems: SinistroStoreItem[] = [],
): SinistroStoreItem[] {
  if (!isBrowser()) {
    return initialItems;
  }

  const stored = parseStoredValue<SinistroStoreItem[]>(
    window.localStorage.getItem(SINISTROS_KEY),
  );

  if (stored && stored.length > 0) {
    return stored;
  }

  if (initialItems.length > 0) {
    window.localStorage.setItem(SINISTROS_KEY, JSON.stringify(initialItems));
  }

  return initialItems;
}

export function setSinistrosStore(items: SinistroStoreItem[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(SINISTROS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("argos:sinistros-updated"));
}
