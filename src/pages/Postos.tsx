import { Link } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { usePostos } from '../hooks/usePostos';
import { Card, PageTitle } from '../components/ui';
import { PageContainer } from '../components/layout/PageContainer';

export function Postos() {
  const {
    search,
    setSearch,
    regionFilter,
    setRegionFilter,
    filtered,
    regions
  } = usePostos();

  return (
    <PageContainer variant="feed" className="flex h-full flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <PageTitle className="mb-2">Guia de Postos</PageTitle>
          <p className="text-slate text-base font-medium opacity-80 leading-relaxed">Fichas e relatos alimentados pelos Oficiais de Chancelaria</p>
        </div>

        <div className="flex flex-col md:flex-row w-full md:w-auto gap-4">
          <div className="relative w-full md:w-80">
             <Search className="w-5 h-5 absolute left-3 top-3.5 text-navy opacity-80" />
             <label htmlFor="search-postos" className="sr-only">Buscar por nome, país ou região</label>
             <input
               id="search-postos"
               type="text"
               placeholder="Buscar por nome, país ou região..."
               className="w-full h-12 border border-border-gray bg-white pl-10 pr-4 text-slate text-base font-medium focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none transition-all placeholder:text-slate/90"
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
          </div>
          <div className="w-full md:w-48">
            <label htmlFor="region-filter" className="sr-only">Filtrar por região</label>
            <select
              id="region-filter"
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              className="w-full h-12 border border-border-gray bg-white px-3 text-slate text-base font-medium focus:border-navy focus:ring-1 focus:ring-navy focus:outline-none transition-all"
            >
              <option value="">Todas as Regiões</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max pb-8">
        {filtered.map(posto => (
          <Link key={posto.id} to={`/postos/${posto.slug}`} className="block group">
            <Card variant="elevated" padding="md" className="h-full transition-transform hover:-translate-y-1 hover:shadow-lg duration-200 flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-ice border border-border-gray/50 flex items-center justify-center text-navy group-hover:bg-navy group-hover:text-white transition-colors">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>
              <h3 className="font-serif text-2xl text-navy mb-1 leading-tight">{posto.name}</h3>
              <p className="text-sm uppercase tracking-widest text-sky font-bold mb-4 leading-relaxed">{posto.country} • {posto.region}</p>

              <div className="mt-auto pt-4 border-t border-border-gray/50 text-sm text-navy font-bold flex items-center justify-between group-hover:text-sky transition-colors">
                <span>ACESSAR FICHA COMPLETA</span>
                <span className="font-serif text-lg leading-none">→</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
         <Card variant="default" padding="none" className="text-center py-16 text-slate">
           <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20 text-navy" />
           <p className="font-serif text-xl text-navy mb-1 leading-relaxed">Nenhum posto encontrado</p>
           <p className="text-base opacity-80 leading-relaxed">Não encontramos resultados para "{search}". Tente buscar por outro termo.</p>
         </Card>
      )}
    </PageContainer>
  );
}
