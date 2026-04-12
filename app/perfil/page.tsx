import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { PerfilSettings } from "@/components/configuracoes/perfil-settings";

export default function PerfilPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Meu Perfil"
          description="Gerencie seus dados pessoais e preferências de segurança"
        />

        <PerfilSettings />
      </div>
    </AppLayout>
  );
}
