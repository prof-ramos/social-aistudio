import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldAlert, ChevronRight } from 'lucide-react';
import { Card, PageTitle, StatusBadge, Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';
import { PageContainer } from '../components/layout/PageContainer';
import { useAdminMembers } from '../hooks/useAdminMembers';
import { useAdminModeration } from '../hooks/useAdminModeration';

export default function AdminHub() {
  const { requests } = useAdminMembers();
  const { pendingReports } = useAdminModeration();

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const reportCount = pendingReports.length;

  return (
    <PageContainer variant="feed" className="space-y-8 pb-12">
      <div>
        <PageTitle as="h1" size="xl">Painel Administrativo</PageTitle>
        <p className="text-slate leading-relaxed">Gerencie membros e modere conteúdo da plataforma.</p>
      </div>

      <Tabs defaultValue="membros" className="space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="membros" className="flex-1">Membros</TabsTrigger>
          <TabsTrigger value="moderacao" className="flex-1">Moderação</TabsTrigger>
        </TabsList>
        <TabsContent value="membros">
          <Link to="/admin/membros" className="group block">
            <Card variant="elevated" padding="lg" className="h-full transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-ice flex items-center justify-center">
                  <Users className="w-6 h-6 text-navy" />
                </div>
                {pendingCount > 0 && (
                  <StatusBadge status="warning">{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</StatusBadge>
                )}
              </div>
              <PageTitle as="h2" size="lg" className="mb-2">Gerenciar Membros</PageTitle>
              <p className="text-base text-slate mb-4 leading-relaxed">
                Aprove ou rejeite solicitações de acesso de novos associados.
              </p>
              <div className="flex items-center text-base font-medium text-navy group-hover:text-sky-dark transition-colors">
                Acessar <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Card>
          </Link>
        </TabsContent>
        <TabsContent value="moderacao">
          <Link to="/admin/moderacao" className="group block">
            <Card variant="elevated" padding="lg" className="h-full transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-ice flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-navy" />
                </div>
                {reportCount > 0 && (
                  <StatusBadge status="error">{reportCount} denúncia{reportCount > 1 ? 's' : ''}</StatusBadge>
                )}
              </div>
              <PageTitle as="h2" size="lg" className="mb-2">Moderação de Conteúdo</PageTitle>
              <p className="text-base text-slate mb-4 leading-relaxed">
                Analise e resolva denúncias de conteúdo publicado na plataforma.
              </p>
              <div className="flex items-center text-base font-medium text-navy group-hover:text-sky-dark transition-colors">
                Acessar <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Card>
          </Link>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
