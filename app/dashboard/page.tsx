import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { SeverityChart } from "@/components/dashboard/severity-chart";
import { AlertsFeed } from "@/components/dashboard/alerts-feed";
import { RecentClaimsTable } from "@/components/dashboard/recent-claims-table";

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Painel de controle e monitoramento de sinistros"
        />

        <KpiCards />

        <div className="flex flex-col gap-4 lg:flex-row">
          <SeverityChart />
          <AlertsFeed />
        </div>

        <RecentClaimsTable />
      </div>
    </AppLayout>
  );
}