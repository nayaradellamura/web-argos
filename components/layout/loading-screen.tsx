import { Spinner } from "@/components/ui/spinner";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  message = "Carregando...",
  fullScreen = false,
}: LoadingScreenProps) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-screen items-center justify-center bg-background"
          : "flex w-full items-center justify-center rounded-lg border border-border bg-card py-12"
      }
    >
      <div className="flex items-center gap-3 text-muted-foreground">
        <Spinner className="size-5" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
