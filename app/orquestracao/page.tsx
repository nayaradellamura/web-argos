import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanBoard } from "@/components/orquestracao/kanban-board";
import { WorkflowHeader } from "@/components/orquestracao/workflow-header";

export default function OrquestracaoPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Fluxo de Regulacao"
          description="Gerencie todos os sinistros atraves do pipeline de regulacao"
        />

        <WorkflowHeader />

        <div className="flex-1">
          <KanbanBoard />
        </div>
      </div>
    </AppLayout>
  );
}
