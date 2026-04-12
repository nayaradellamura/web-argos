import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanBoard } from "@/components/orquestracao/kanban-board";

export default function OrquestracaoPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Fluxo de Regulação"
          description="Gerencie todos os sinistros atraves do pipeline de regulacao"
        />

        <div className="flex-1">
          <KanbanBoard />
        </div>
      </div>
    </AppLayout>
  );
}
