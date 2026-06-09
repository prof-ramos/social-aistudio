import { Briefcase, BookOpen, HelpCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { Card, PageTitle, Breadcrumb } from '../components/ui';
import { PageContainer } from '../components/layout/PageContainer';

export function CarreiraPromocao({ profile }: { profile: UserProfile }) {
  return (
    <PageContainer variant="narrow" className="space-y-6">
      <Breadcrumb items={[{ label: 'Início', href: '/feed' }, { label: 'Carreira e Promoção' }]} />
      <PageTitle as="h1" size="xl">Carreira e Promoção</PageTitle>

      <Card variant="elevated" padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-ice border border-border-gray/50 flex items-center justify-center text-navy">
            <Briefcase className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy">Editais Abertos</h2>
        </div>
        <div className="text-center py-8">
          <Briefcase className="w-12 h-12 mx-auto text-slate opacity-20 mb-3" />
          <p className="text-navy font-bold leading-relaxed">Nenhum edital aberto no momento</p>
          <p className="text-base text-slate mt-1 leading-relaxed">Novos editais serão publicados aqui.</p>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-ice border border-border-gray/50 flex items-center justify-center text-navy">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy">Regras de Promoção</h2>
        </div>
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 mx-auto text-slate opacity-20 mb-3" />
          <p className="text-navy font-bold leading-relaxed">Regras em breve</p>
          <p className="text-base text-slate mt-1 leading-relaxed">As regras e critérios de promoção serão disponibilizados em breve.</p>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-ice border border-border-gray/50 flex items-center justify-center text-navy">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl font-bold text-navy">Perguntas Frequentes</h2>
        </div>
        <div className="text-center py-8">
          <HelpCircle className="w-12 h-12 mx-auto text-slate opacity-20 mb-3" />
          <p className="text-navy font-bold leading-relaxed">FAQ em breve</p>
          <p className="text-base text-slate mt-1 leading-relaxed">As perguntas mais frequentes sobre promoção serão organizadas aqui.</p>
        </div>
      </Card>
    </PageContainer>
  );
}