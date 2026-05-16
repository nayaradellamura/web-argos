import { AppLayout } from "@/components/layout/app-layout";
import { LoadingScreen } from "@/components/layout/loading-screen";

export default function Loading() {
  return (
    <AppLayout>
      <div className="h-full" />
      <LoadingScreen fullScreen message="Carregando ..." />
    </AppLayout>
  );
}
