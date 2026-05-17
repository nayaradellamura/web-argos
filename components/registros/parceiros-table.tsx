"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db, googleProvider } from "@/lib/firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ITEMS_PER_PAGE = 8;
const USERS_COLLECTION = "users";
const BYPASS_ADMIN_CHECK = true; // Desenvolvimento: ignora a validação em admins/{uid}.

type ParceiroStatus = "pendente" | "ativo" | "bloqueado";
type StatusFilter = ParceiroStatus | "todos";
type TipoAcesso = "sso_google" | "email_senha" | "desconhecido";

interface Parceiro {
  id: string;
  uid: string;
  authUid: string;
  nome: string;
  displayName: string;
  email: string;
  photoURL: string;
  provider: string;
  tipoAcesso: TipoAcesso;
  status: ParceiroStatus;
  criadoEm: Timestamp | null;
  atualizadoEm: Timestamp | null;
  aprovadoEm: Timestamp | null;
  aprovadoPor: string | null;
  bloqueadoEm: Timestamp | null;
  bloqueadoPor: string | null;
  ultimoAcesso: Timestamp | null;
  ultimoLoginEm: Timestamp | null;
  origem: string;
}

interface ParceirosTableProps {
  searchQuery: string;
}

const statusConfig = {
  pendente: {
    label: "Pendente",
    filterLabel: "Pendentes",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock3,
  },
  ativo: {
    label: "Ativo",
    filterLabel: "Ativos",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  bloqueado: {
    label: "Bloqueado",
    filterLabel: "Bloqueados",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: Ban,
  },
} satisfies Record<
  ParceiroStatus,
  {
    label: string;
    filterLabel: string;
    className: string;
    icon: typeof Clock3;
  }
>;

function getInitials(nameOrEmail?: string) {
  const value = nameOrEmail?.trim();

  if (!value) return "--";

  return value
    .replace("@", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(value?: Timestamp | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(value.toDate());
  } catch {
    return "—";
  }
}

function normalizeText(value?: string | null) {
  return value?.toLowerCase().trim() ?? "";
}

function normalizeStatus(value: unknown): ParceiroStatus {
  if (value === "ativo" || value === "bloqueado" || value === "pendente") {
    return value;
  }

  return "pendente";
}

function normalizeTipoAcesso(
  value: unknown,
  provider: string,
  authUid: string,
): TipoAcesso {
  if (value === "sso_google" || value === "email_senha") {
    return value;
  }

  if (provider === "google") return "sso_google";
  if (provider === "password" || !authUid) return "email_senha";

  return "desconhecido";
}

function isEmailPasswordPending(parceiro: Parceiro) {
  return parceiro.tipoAcesso === "email_senha" && !parceiro.authUid;
}

function getStatusFilterLabel(status: StatusFilter) {
  if (status === "todos") return "Todos";
  return statusConfig[status].filterLabel;
}

function getAccessHint(parceiro: Parceiro) {
  if (isEmailPasswordPending(parceiro)) {
    return "Aguardando criação de senha";
  }

  if (parceiro.tipoAcesso === "sso_google") {
    return "Acesso via Google";
  }

  if (parceiro.tipoAcesso === "email_senha") {
    return "Acesso por e-mail e senha";
  }

  return "Tipo de acesso não identificado";
}

function getEmptyMessage(statusFilter: StatusFilter) {
  switch (statusFilter) {
    case "pendente":
      return "Nenhum parceiro pendente de aprovação.";
    case "ativo":
      return "Nenhum parceiro ativo encontrado.";
    case "bloqueado":
      return "Nenhum parceiro bloqueado encontrado.";
    default:
      return "Nenhum parceiro encontrado.";
  }
}

function SkeletonStyles() {
  return (
    <style>{`
      @keyframes argos-skeleton-shimmer {
        100% {
          transform: translateX(100%);
        }
      }

      .argos-skeleton {
        position: relative;
        overflow: hidden;
        background: hsl(var(--muted));
      }

      .argos-skeleton::after {
        content: "";
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.68),
          transparent
        );
        animation: argos-skeleton-shimmer 1.35s ease-in-out infinite;
      }

      .dark .argos-skeleton::after {
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.08),
          transparent
        );
      }
    `}</style>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`argos-skeleton rounded-md ${className}`} />;
}

function ParceirosTableSkeleton() {
  return (
    <>
      {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-36" />
                <SkeletonBlock className="h-3 w-48" />
                <SkeletonBlock className="h-3 w-40" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <SkeletonBlock className="h-6 w-28 rounded-full" />
          </TableCell>
          <TableCell>
            <SkeletonBlock className="h-6 w-24 rounded-full" />
          </TableCell>
          <TableCell>
            <SkeletonBlock className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <SkeletonBlock className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <div className="flex justify-end gap-2">
              <SkeletonBlock className="h-9 w-28 rounded-md" />
              <SkeletonBlock className="h-9 w-20 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function ParceirosTable({ searchQuery }: ParceirosTableProps) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loadingParceiros, setLoadingParceiros] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pendente");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLoginAdmin() {
    setError(null);
    setFeedback(null);
    await signInWithPopup(auth, googleProvider);
  }

  async function checkAdminPermission(user: User) {
    setCheckingAdmin(true);
    setError(null);

    if (BYPASS_ADMIN_CHECK) {
      console.warn(
        `Validação de administrador ignorada para desenvolvimento: ${user.email ?? user.uid}`,
      );
      setIsAdmin(true);
      setCheckingAdmin(false);
      return;
    }

    // Quando quiser fechar a segurança em produção, consulte admins/{uid} aqui.
    setIsAdmin(false);
    setCheckingAdmin(false);
  }

  async function parseApiResponse(response: Response) {
    const rawResponse = await response.text();

    try {
      return rawResponse
        ? (JSON.parse(rawResponse) as {
            error?: string;
            details?: string;
            [key: string]: unknown;
          })
        : null;
    } catch {
      const htmlHint = rawResponse.trim().startsWith("<!DOCTYPE")
        ? "A API retornou HTML em vez de JSON. Confira se app/api/parceiros/aprovar-email/route.ts está no caminho correto e reinicie o pnpm dev."
        : rawResponse.slice(0, 300);

      throw new Error(
        `Resposta inválida da API. Status: ${response.status}. ${htmlHint}`,
      );
    }
  }

  async function approveEmailPasswordPartner(parceiro: Parceiro) {
    if (!parceiro.email) {
      throw new Error("Este parceiro não possui e-mail cadastrado.");
    }

    const idToken = await auth.currentUser?.getIdToken();

    const response = await fetch("/api/parceiros/aprovar-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ email: parceiro.email }),
    });

    const data = await parseApiResponse(response);

    if (!response.ok) {
      throw new Error(
        data?.details
          ? `${data.error ?? "Erro ao aprovar parceiro."} Detalhes: ${data.details}`
          : (data?.error ??
              `Erro ${response.status} ao aprovar parceiro por e-mail.`),
      );
    }

    if (!data) {
      throw new Error(
        "A aprovação retornou uma resposta vazia. Confira a rota /api/parceiros/aprovar-email.",
      );
    }

    await sendPasswordResetEmail(auth, parceiro.email);

    return data;
  }

  async function updatePartnerStatus(
    parceiro: Parceiro,
    status: ParceiroStatus,
  ) {
    setUpdatingId(parceiro.id);
    setError(null);
    setFeedback(null);

    try {
      if (status === "ativo" && isEmailPasswordPending(parceiro)) {
        await approveEmailPasswordPartner(parceiro);

        setFeedback(
          `Parceiro ${parceiro.email} aprovado. O Firebase enviou o link para definir a senha.`,
        );
        return;
      }

      await updateDoc(doc(db, USERS_COLLECTION, parceiro.id), {
        status,
        atualizadoEm: serverTimestamp(),
        ...(status === "ativo"
          ? {
              aprovadoEm: serverTimestamp(),
              aprovadoPor: auth.currentUser?.uid ?? null,
            }
          : {}),
        ...(status === "bloqueado"
          ? {
              bloqueadoEm: serverTimestamp(),
              bloqueadoPor: auth.currentUser?.uid ?? null,
            }
          : {}),
      });

      const label =
        parceiro.nome || parceiro.displayName || parceiro.email || "parceiro";
      setFeedback(`Acesso de ${label} atualizado para ${status}.`);
    } catch (updateError) {
      console.error("Erro ao atualizar parceiro:", updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Não foi possível atualizar o parceiro.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setFeedback(null);
      setError(null);

      if (!user) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      await checkAdminPermission(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser || !isAdmin) return;

    setLoadingParceiros(true);
    setError(null);

    const unsubscribe = onSnapshot(
      collection(db, USERS_COLLECTION),
      (snapshot) => {
        const data = snapshot.docs.map((document) => {
          const docData = document.data();
          const uid = String(docData.uid ?? "");
          const authUid = String(docData.authUid ?? uid ?? "");
          const provider = String(docData.provider ?? "");
          const tipoAcesso = normalizeTipoAcesso(
            docData.tipoAcesso,
            provider,
            authUid,
          );

          return {
            id: document.id,
            uid,
            authUid,
            nome: String(docData.nome ?? ""),
            displayName: String(docData.displayName ?? docData.nome ?? ""),
            email: String(docData.email ?? document.id ?? ""),
            photoURL: String(docData.photoURL ?? docData.foto ?? ""),
            provider,
            tipoAcesso,
            status: normalizeStatus(docData.status),
            criadoEm: docData.criadoEm ?? null,
            atualizadoEm: docData.atualizadoEm ?? null,
            aprovadoEm: docData.aprovadoEm ?? null,
            aprovadoPor: docData.aprovadoPor ?? null,
            bloqueadoEm: docData.bloqueadoEm ?? null,
            bloqueadoPor: docData.bloqueadoPor ?? null,
            ultimoAcesso: docData.ultimoAcesso ?? null,
            ultimoLoginEm: docData.ultimoLoginEm ?? null,
            origem: String(docData.origem ?? ""),
          };
        });

        setParceiros(data);
        setLoadingParceiros(false);
      },
      (snapshotError) => {
        console.error("Erro ao carregar users:", snapshotError);
        setError(
          "Não foi possível carregar a coleção users. Verifique as regras do Firestore.",
        );
        setLoadingParceiros(false);
      },
    );

    return () => unsubscribe();
  }, [authUser, isAdmin]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    return parceiros.reduce(
      (acc, parceiro) => {
        acc[parceiro.status] += 1;
        acc.todos += 1;
        return acc;
      },
      { pendente: 0, ativo: 0, bloqueado: 0, todos: 0 } as Record<
        StatusFilter,
        number
      >,
    );
  }, [parceiros]);

  const filteredParceiros = useMemo(() => {
    const query = normalizeText(searchQuery);

    return parceiros.filter((parceiro) => {
      const matchesStatus =
        statusFilter === "todos" || parceiro.status === statusFilter;
      const matchesSearch =
        !query ||
        normalizeText(parceiro.nome).includes(query) ||
        normalizeText(parceiro.displayName).includes(query) ||
        normalizeText(parceiro.email).includes(query) ||
        normalizeText(parceiro.provider).includes(query) ||
        normalizeText(parceiro.tipoAcesso).includes(query) ||
        normalizeText(parceiro.id).includes(query) ||
        normalizeText(parceiro.uid).includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [parceiros, searchQuery, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredParceiros.length / ITEMS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedParceiros = filteredParceiros.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  if (checkingAdmin) {
    return (
      <>
        <SkeletonStyles />
        <Card className="border-0 shadow-sm">
          <CardContent className="space-y-4 py-6">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-52" />
                <SkeletonBlock className="h-3 w-72" />
              </div>
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-10/12" />
              <SkeletonBlock className="h-3 w-8/12" />
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!authUser) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-start gap-4 py-10">
          <div>
            <h3 className="text-lg font-semibold">
              Acesso administrativo necessário
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Entre com Google para aprovar ou bloquear o acesso dos parceiros.
            </p>
          </div>
          <Button onClick={handleLoginAdmin}>
            <LogIn className="mr-2 h-4 w-4" />
            Entrar com Google
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-start gap-4 py-10">
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          >
            Acesso negado
          </Badge>
          <div>
            <h3 className="text-lg font-semibold">
              Sua conta não está liberada para administrar parceiros.
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Para produção, habilite a validação em admins/uid. Para
              desenvolvimento, mantenha BYPASS_ADMIN_CHECK como true.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Conta atual: {authUser.email}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SkeletonStyles />
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Acessos de parceiros</p>
              <p className="text-sm text-muted-foreground">
                Aprove, recuse ou bloqueie usuários parceiros.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              ["pendente", "ativo", "bloqueado", "todos"] as StatusFilter[]
            ).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="gap-2"
              >
                {getStatusFilterLabel(status)}
                <Badge variant="secondary">{statusCounts[status]}</Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
          {feedback}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <Card className="overflow-hidden border-0 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Parceiro</TableHead>
              <TableHead className="font-semibold">Acesso</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Criado em</TableHead>
              <TableHead className="font-semibold">Último acesso</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingParceiros ? (
              <ParceirosTableSkeleton />
            ) : paginatedParceiros.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-28 text-center text-muted-foreground"
                >
                  {getEmptyMessage(statusFilter)}
                </TableCell>
              </TableRow>
            ) : (
              paginatedParceiros.map((parceiro) => {
                const status = parceiro.status;
                const StatusIcon = statusConfig[status].icon;
                const pendingEmailPassword = isEmailPasswordPending(parceiro);

                return (
                  <TableRow key={parceiro.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {parceiro.photoURL && (
                            <AvatarImage
                              src={parceiro.photoURL}
                              alt={
                                parceiro.nome || parceiro.email || "Parceiro"
                              }
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(
                              parceiro.nome ||
                                parceiro.displayName ||
                                parceiro.email,
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {parceiro.nome ||
                              parceiro.displayName ||
                              "Sem nome"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {parceiro.email || "Sem e-mail"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getAccessHint(parceiro)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {parceiro.tipoAcesso === "sso_google" ? (
                          <>
                            <KeyRound className="h-3 w-3" />
                            Google
                          </>
                        ) : (
                          <>
                            <Mail className="h-3 w-3" />
                            E-mail/senha
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusConfig[status].className}
                      >
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig[status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(parceiro.criadoEm)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(
                        parceiro.ultimoAcesso ?? parceiro.ultimoLoginEm,
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {status === "pendente" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                updatePartnerStatus(parceiro, "ativo")
                              }
                              disabled={updatingId === parceiro.id}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              {pendingEmailPassword
                                ? "Aprovar e enviar acesso"
                                : "Aprovar acesso"}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() =>
                                updatePartnerStatus(parceiro, "bloqueado")
                              }
                              disabled={updatingId === parceiro.id}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Recusar
                            </Button>
                          </>
                        )}

                        {status === "ativo" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() =>
                              updatePartnerStatus(parceiro, "bloqueado")
                            }
                            disabled={updatingId === parceiro.id}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Bloquear acesso
                          </Button>
                        )}

                        {status === "bloqueado" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              updatePartnerStatus(parceiro, "ativo")
                            }
                            disabled={updatingId === parceiro.id}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Reativar acesso
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {loadingParceiros ? (
            <>
              <SkeletonBlock className="h-4 w-56" />
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-8 w-8 rounded-md" />
                <SkeletonBlock className="h-8 w-8 rounded-md" />
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-8 w-8 rounded-md" />
                <SkeletonBlock className="h-8 w-8 rounded-md" />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredParceiros.length === 0 ? 0 : startIndex + 1} a{" "}
                {Math.min(startIndex + ITEMS_PER_PAGE, filteredParceiros.length)} de{" "}
                {filteredParceiros.length} parceiros
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="sr-only">Primeira página</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Página anterior</span>
                </Button>
                <span className="px-3 text-sm text-muted-foreground">
                  Página {safeCurrentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={safeCurrentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Próxima página</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                  <span className="sr-only">Última página</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
