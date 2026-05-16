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
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
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
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Clock3,
  },
  ativo: {
    label: "Ativo",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  bloqueado: {
    label: "Bloqueado",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: Ban,
  },
} satisfies Record<ParceiroStatus, { label: string; className: string; icon: typeof Clock3 }>;

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

function normalizeTipoAcesso(value: unknown, provider: string, authUid: string): TipoAcesso {
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

  async function handleLogoutAdmin() {
    await signOut(auth);
    setAuthUser(null);
    setIsAdmin(false);
    setParceiros([]);
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
        ? (JSON.parse(rawResponse) as { error?: string; details?: string; [key: string]: unknown })
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
          : data?.error ?? `Erro ${response.status} ao aprovar parceiro por e-mail.`,
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

  async function updatePartnerStatus(parceiro: Parceiro, status: ParceiroStatus) {
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

      const label = parceiro.nome || parceiro.displayName || parceiro.email || "parceiro";
      setFeedback(`Acesso de ${label} atualizado para ${status}.`);
    } catch (updateError) {
      console.error("Erro ao atualizar parceiro:", updateError);
      setError(updateError instanceof Error ? updateError.message : "Não foi possível atualizar o parceiro.");
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
          const tipoAcesso = normalizeTipoAcesso(docData.tipoAcesso, provider, authUid);

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
        setError("Não foi possível carregar a coleção users. Verifique as regras do Firestore.");
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
      { pendente: 0, ativo: 0, bloqueado: 0, todos: 0 } as Record<StatusFilter, number>,
    );
  }, [parceiros]);

  const filteredParceiros = useMemo(() => {
    const query = normalizeText(searchQuery);

    return parceiros.filter((parceiro) => {
      const matchesStatus = statusFilter === "todos" || parceiro.status === statusFilter;
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

  const totalPages = Math.max(1, Math.ceil(filteredParceiros.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedParceiros = filteredParceiros.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (checkingAdmin) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Verificando permissão administrativa...
        </CardContent>
      </Card>
    );
  }

  if (!authUser) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-start gap-4 py-10">
          <div>
            <h3 className="text-lg font-semibold">Acesso administrativo necessário</h3>
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
          <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            Acesso negado
          </Badge>
          <div>
            <h3 className="text-lg font-semibold">Sua conta não está liberada para administrar parceiros.</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Para produção, habilite a validação em admins/uid. Para desenvolvimento, mantenha BYPASS_ADMIN_CHECK como true.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Conta atual: {authUser.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogoutAdmin}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Painel de acesso de parceiros</p>
              <p className="text-sm text-muted-foreground">
                Lendo somente a coleção users · SSO e e-mail/senha centralizados no mesmo lugar
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["pendente", "ativo", "bloqueado", "todos"] as StatusFilter[]).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "todos" ? "Todos" : statusConfig[status].label}
                <Badge variant="secondary" className="ml-2">
                  {statusCounts[status]}
                </Badge>
              </Button>
            ))}

            <Button variant="ghost" size="sm" onClick={handleLogoutAdmin}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
        Solicitações de <strong>e-mail/senha</strong> ficam temporariamente em users/email. Ao aprovar, o painel cria o usuário no Authentication, cria users/uid e remove o documento temporário.
      </div>

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
              <TableHead className="font-semibold">Tipo de acesso</TableHead>
              <TableHead className="font-semibold">Provider</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Criado em</TableHead>
              <TableHead className="font-semibold">Último acesso</TableHead>
              <TableHead className="font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingParceiros ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                  Carregando parceiros...
                </TableCell>
              </TableRow>
            ) : paginatedParceiros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                  Nenhum parceiro encontrado.
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
                          {parceiro.photoURL && <AvatarImage src={parceiro.photoURL} alt={parceiro.nome || parceiro.email || "Parceiro"} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {getInitials(parceiro.nome || parceiro.displayName || parceiro.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{parceiro.nome || parceiro.displayName || "Sem nome"}</p>
                          <p className="text-sm text-muted-foreground">{parceiro.email || "Sem e-mail"}</p>
                          <p className="text-xs text-muted-foreground">
                            {pendingEmailPassword ? "Documento temporário por e-mail" : `UID: ${parceiro.authUid || parceiro.uid || parceiro.id}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {parceiro.tipoAcesso === "sso_google" ? (
                          <>
                            <KeyRound className="h-3 w-3" />
                            SSO Google
                          </>
                        ) : (
                          <>
                            <Mail className="h-3 w-3" />
                            E-mail/senha
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {parceiro.provider || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusConfig[status].className}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig[status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(parceiro.criadoEm)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(parceiro.ultimoAcesso ?? parceiro.ultimoLoginEm)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {status !== "ativo" && (
                          <Button
                            size="sm"
                            onClick={() => updatePartnerStatus(parceiro, "ativo")}
                            disabled={updatingId === parceiro.id}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {pendingEmailPassword ? "Aprovar e enviar acesso" : "Aprovar"}
                          </Button>
                        )}

                        {status !== "bloqueado" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updatePartnerStatus(parceiro, "bloqueado")}
                            disabled={updatingId === parceiro.id}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Bloquear
                          </Button>
                        )}

                        {status !== "pendente" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updatePartnerStatus(parceiro, "pendente")}
                            disabled={updatingId === parceiro.id}
                          >
                            <Clock3 className="mr-2 h-4 w-4" />
                            Pendente
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
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredParceiros.length === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredParceiros.length)} de {filteredParceiros.length} parceiros
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
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
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
        </div>
      </Card>
    </div>
  );
}
