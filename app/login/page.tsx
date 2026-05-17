"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, loginWithGoogle } from "@/lib/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getLoginErrorMessage = (err: unknown) => {
    if (!(err instanceof FirebaseError)) {
      return "Não foi possível entrar agora. Tente novamente.";
    }

    switch (err.code) {
      case "auth/invalid-email":
        return "O formato do e-mail é inválido.";
      case "auth/user-disabled":
        return "Sua conta está desativada.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      case "auth/network-request-failed":
        return "Falha de conexão. Verifique sua internet.";
      case "auth/invalid-credential":
      case "auth/invalid-login-credentials":
        return "E-mail ou senha incorretos, ou esta conta usa login com Google.";
      default:
        return "Não foi possível entrar agora. Tente novamente.";
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch {
      setError("Não foi possível entrar com Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(30,99,236,0.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(0,196,140,0.14),transparent_22%),linear-gradient(180deg,#f7f9fc_0%,#eef3f9_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(30,99,236,0.08),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(0,196,140,0.08),transparent_22%),linear-gradient(180deg,#1a1f2e_0%,#141820_100%)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="absolute -left-32 top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 -right-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <section className="flex w-full justify-center">
          <Card className="w-full max-w-md rounded-3xl border-white/70 bg-white/88 dark:border-white/10 dark:bg-slate-900/60 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <CardHeader className="px-8 pt-8 pb-6">
              <div className="flex items-center justify-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                  <img
                    src="/eye_argos.svg"
                    alt="Logo ARGOS"
                    className="h-12 w-12 object-contain"
                  />
                </div>

                <img
                  src="/display_argos.svg"
                  alt="ARGOS"
                  className="h-auto w-40 object-contain sm:w-44 dark:invert"
                />
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-2">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    className="h-11 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="h-11 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mensagem de erro */}
                {error && (
                  <p className="text-sm font-medium text-red-500">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20"
                >
                  {loading ? "Entrando..." : "Entrar"}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="h-11 w-full rounded-xl text-sm font-semibold"
                >
                  Entrar com Google
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
