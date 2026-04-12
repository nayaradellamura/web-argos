"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye } from "lucide-react";
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/dashboard");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(30,99,236,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(0,196,140,0.14),_transparent_22%),linear-gradient(180deg,_#f7f9fc_0%,_#eef3f9_100%)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="absolute left-[-8rem] top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-0 right-[-6rem] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <section className="flex w-full justify-center">
          <Card className="w-full max-w-md rounded-3xl border-white/70 bg-white/88 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
            <CardHeader className="space-y-6 p-8 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                  <Eye className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-3xl tracking-tight text-slate-950">ARGOS</CardTitle>
                </div>
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
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu.email@empresa.com"
                    className="h-11 rounded-xl bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite sua senha"
                    className="h-11 rounded-xl bg-white"
                    required
                  />
                </div>
                <Button type="submit" className="h-11 w-full rounded-xl text-sm font-semibold shadow-lg shadow-primary/20">
                  Entrar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
