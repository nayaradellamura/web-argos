"use client";

import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  message = "Carregando...",
  fullScreen = false,
}: LoadingScreenProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50">
        <div className="flex flex-col items-center gap-6 rounded-lg bg-white p-8 shadow-lg">
          {/* Logo ARGOS */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
              <Image
                src="/icon.svg"
                alt="ARGOS"
                width={24}
                height={24}
                className="h-6 w-6"
              />
            </div>
            <span className="text-lg font-bold text-foreground">ARGOS</span>
          </div>

          {/* Spinner */}
          <Spinner className="size-6 text-primary" />

          {/* Message */}
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-lg border border-border bg-card py-12">
      <div className="flex flex-col items-center gap-6">
        {/* Logo ARGOS */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <Image
              src="/icon.svg"
              alt="ARGOS"
              width={24}
              height={24}
              className="h-6 w-6"
            />
          </div>
          <span className="text-lg font-bold text-foreground">ARGOS</span>
        </div>

        {/* Spinner */}
        <Spinner className="size-6 text-primary" />

        {/* Message */}
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}
