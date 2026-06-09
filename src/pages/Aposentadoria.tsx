import { FileText, Calculator, Newspaper } from 'lucide-react';
import { UserProfile } from '../types';
import { Card, PageTitle, Breadcrumb } from '../components/ui';
import { PageContainer } from '../components/layout/PageContainer';

export function Aposentadoria({ profile }: { profile: UserProfile }) {
  return (
    <PageContainer variant="narrow" className="space-y-6">
      <Breadcrumb items={[{ label: 'Início', href: '/feed' }, { label: 'Aposentadoria' }]} />
      <PageTitle as="h1" size="xl">Aposentadoria</PageTitle>

      <Card variant="elevated" padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-ice border border-border-gray/50 flex items-center justify-center text-navy">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy">Guias e Documentos</h2>
        </div>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-slate opacity-20 mb-3" />
          <p className="text-navy font-bold">Documentos em breve</p>
          <p className="text-sm text-slate mt-1">Guias e documentos sobre o processo de aposentadoria serão publicados aqui.</p>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-ice border border-border-gray/50 flex items-center justify-center text-navy">
            <Calculator className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy">Simulador</h2>
        </div>
        <div className="text-center py-8">
          <Calculator className="w-12 h-12 mx-auto text-slate opacity-20 mb-3" />
          <p className="text-navy font-bold">Simulador em breve</p>
          <p className="text-sm text-slate mt-1">O simulador de aposentadoria estará disponível em breve.</p>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-ice border border-border-gray/50 flex items-center justify-center text-navy">
            <Newspaper className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy">Notícias</h2>
        </div>
        <div className="text-center py-8">
          <Newspaper className="w-12 h-12 mx-auto text-slate opacity-20 mb-3" />
          <p className="text-navy font-bold">Notícias em breve</p>
          <p className="text-sm text-slate mt-1">Notícias e atualizações sobre aposentadoria serão divulgadas aqui.</p>
        </div>
      </Card>
    </PageContainer>
  );
}