import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserProfile } from '../types';
import { ChevronLeft, Plus, AlertTriangle, Star } from 'lucide-react';
import { usePostoDetails } from '../hooks/usePostoDetails';
import { Card, PageTitle, Button, Alert } from '../components/ui';
import { ReportDialog } from '../components/ui/ReportDialog';
import { PageContainer } from '../components/layout/PageContainer';

export function PostoDetails({ profile }: { profile: UserProfile }) {
  const { slug } = useParams();
  const {
    posto,
    fields,
    reviews,
    averageRating,
    hasExistingReview,
    loading,
    isAddingField,
    setIsAddingField,
    newFieldType,
    setNewFieldType,
    newFieldBody,
    setNewFieldBody,
    handleAddField,
    handleCreateReview,
    handleReport,
    reportTarget,
    setReportTarget,
    submitReport
  } = usePostoDetails(slug, profile.id);

  const [isAddingReview, setIsAddingReview] = useState(false);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0 || !reviewBody.trim()) return;
    handleCreateReview(reviewBody.trim(), reviewRating);
    setReviewBody('');
    setReviewRating(0);
    setHoverRating(0);
    setIsAddingReview(false);
  };

  const renderStars = (rating: number, size: string = 'w-4 h-4') => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${i < Math.round(rating) ? 'text-gold fill-gold' : 'text-slate/30'}`}
      />
    ));
  };

  const canReview = profile.role !== 'PENDENTE' && !hasExistingReview;

  if (loading) {
    return (
      <PageContainer variant="detail" className="animate-pulse">
        <div className="w-40 h-5 bg-slate/10 mb-6" />
        <Card variant="elevated" padding="lg" className="mb-8">
          <div className="w-64 h-10 bg-slate/10 mb-3" />
          <div className="w-48 h-6 bg-slate/10" />
        </Card>
        <div className="flex justify-between items-center mb-6">
          <div className="w-48 h-8 bg-slate/10" />
          <div className="w-40 h-10 bg-slate/10" />
        </div>
        <div className="space-y-6">
          {[1, 2].map(i => (
            <Card key={i} variant="default" padding="md">
              <div className="w-24 h-6 bg-slate/10 mb-4" />
              <div className="w-full h-4 bg-slate/10 mb-2" />
              <div className="w-3/4 h-4 bg-slate/10" />
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }
  if (!posto) return <PageContainer variant="detail" className="py-12 text-center text-slate">Posto não encontrado.</PageContainer>;

  return (
    <PageContainer variant="detail">
      <Link to="/postos" className="inline-flex items-center gap-2 text-navy hover:underline font-medium mb-6">
        <ChevronLeft className="w-4 h-4" /> Voltar para Postos
      </Link>

      <Card variant="elevated" padding="lg" className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <PageTitle className="mb-0">{posto.name}</PageTitle>
          {averageRating !== null && (
            <div className="flex items-center gap-1">{renderStars(averageRating, 'w-5 h-5')}<span className="text-base text-slate ml-1">({reviews.length})</span></div>
          )}
        </div>
        <p className="text-lg text-slate leading-relaxed">{posto.country} • {posto.region}</p>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageTitle as="h2" size="md">Ficha do Posto</PageTitle>
        <Button
          variant="primary"
          size="md"
          className="gap-2"
          onClick={() => setIsAddingField(!isAddingField)}
        >
          <Plus className="w-4 h-4" /> Adicionar Relato
        </Button>
      </div>

      {isAddingField && (
        <Card variant="outlined" padding="md" className="mb-8">
           <form onSubmit={handleAddField}>
              <h3 className="font-bold text-navy mb-4">Novo Relato de Experiência</h3>
              <div className="mb-4">
                <label htmlFor="field-type" className="block text-base font-medium text-slate mb-1">Tópico</label>
                <select id="field-type" className="w-full h-11 border border-border-gray rounded-none bg-white px-3 focus:ring-2 focus:ring-navy focus:outline-none" value={newFieldType} onChange={e=>setNewFieldType(e.target.value)}>
                   <option value="GERAL">Geral</option>
                   <option value="SEGURANCA">Segurança</option>
                   <option value="CUSTO_VIDA">Custo de Vida</option>
                   <option value="SAUDE">Saúde</option>
                   <option value="EDUCACAO">Educação</option>
                   <option value="MORADIA">Moradia</option>
                   <option value="TRANSPORTE">Transporte</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="field-body" className="block text-base font-medium text-slate mb-1">Sua percepção</label>
                <textarea id="field-body" required className="w-full min-h-[120px] border border-border-gray rounded-none p-3 focus:ring-2 focus:ring-navy focus:outline-none" value={newFieldBody} onChange={e=>setNewFieldBody(e.target.value)}></textarea>
                <p className="text-sm text-slate/90 font-medium mt-1 leading-relaxed">Por padrão, gravaremos seu período de experiência declarado no seu perfil.</p>
              </div>
              <div className="flex justify-end gap-3">
                 <Button type="button" variant="ghost" size="md" onClick={()=>setIsAddingField(false)}>Cancelar</Button>
                 <Button type="submit" variant="primary" size="md" isLoading={isAddingField}>Salvar</Button>
              </div>
           </form>
        </Card>
      )}

      <div className="space-y-6">
        {fields.length === 0 ? (
          <Card variant="default" padding="none" className="flex flex-col items-center justify-center py-16 px-6 text-center border-dashed">
            <AlertTriangle className="w-12 h-12 mb-4 opacity-20 text-navy" />
            <p className="font-serif text-xl text-navy mb-2 leading-relaxed">Ficha em Branco</p>
            <p className="text-base text-slate opacity-80 max-w-md mx-auto leading-relaxed">Nenhuma contribuição nesta ficha ainda. Seja o primeiro a compartilhar sua experiência com os colegas!</p>
          </Card>
        ) : (
          fields.map(field => (
             <Card key={field.id} variant="default" padding="md">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-sky text-navy text-sm font-bold px-2 py-1 uppercase">{field.fieldType}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate/30 hover:text-danger p-2 min-h-[44px] min-w-[44px]"
                    onClick={() => handleReport('POSTO_FIELD', field.id, field.body)}
                    title="Denunciar Relato"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-slate leading-relaxed mb-4">{field.body}</p>
                <div className="text-sm text-slate opacity-80 border-t border-border-gray pt-3">
                   Relato de {field.authorName ?? 'Membro'}
                </div>
             </Card>
          ))
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-12">
        <PageTitle as="h2" size="md">Avaliações</PageTitle>
        {canReview && (
          <Button
            variant="primary"
            size="md"
            className="gap-2"
            onClick={() => setIsAddingReview(!isAddingReview)}
          >
            <Plus className="w-4 h-4" /> Avaliar Posto
          </Button>
        )}
      </div>

      {isAddingReview && (
        <Card variant="outlined" padding="md" className="mb-8">
          <form onSubmit={handleSubmitReview}>
            <h3 className="font-bold text-navy mb-4">Nova Avaliação</h3>
            <div className="mb-4">
              <label className="block text-base font-medium text-slate mb-2">Nota</label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => {
                  const starValue = i + 1;
                  return (
                    <button
                      key={i}
                      type="button"
                      className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      onClick={() => setReviewRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${starValue} estrela${starValue > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          starValue <= (hoverRating || reviewRating)
                            ? 'text-gold fill-gold'
                            : 'text-slate/30'
                        }`}
                      />
                    </button>
                  );
                })}
                {reviewRating > 0 && (
                  <span className="text-base text-slate ml-2">{reviewRating} de 5</span>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="review-body" className="block text-base font-medium text-slate mb-1">Sua avaliação</label>
              <textarea
                id="review-body"
                required
                className="w-full min-h-[120px] border border-border-gray rounded-none p-3 focus:ring-2 focus:ring-navy focus:outline-none"
                value={reviewBody}
                onChange={e => setReviewBody(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" size="md" onClick={() => { setIsAddingReview(false); setReviewRating(0); setReviewBody(''); }}>Cancelar</Button>
              <Button type="submit" variant="primary" size="md" disabled={reviewRating === 0 || !reviewBody.trim()}>Publicar Avaliação</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <Card variant="default" padding="none" className="flex flex-col items-center justify-center py-16 px-6 text-center border-dashed">
            <Star className="w-12 h-12 mb-4 opacity-20 text-navy" />
            <p className="font-serif text-xl text-navy mb-2 leading-relaxed">Sem Avaliações</p>
            <p className="text-base text-slate opacity-80 max-w-md mx-auto leading-relaxed">Nenhuma avaliação para este posto ainda. Seja o primeiro a compartilhar sua percepção!</p>
          </Card>
        ) : (
          reviews.map(review => (
            <Card key={review.id} variant="default" padding="md">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-navy">{review.authorName ?? 'Membro'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <span className="text-sm text-slate opacity-80">
                  {new Date(review.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <p className="text-slate leading-relaxed">{review.body}</p>
            </Card>
          ))
        )}
      </div>

      <ReportDialog
        isOpen={reportTarget !== null}
        onCancel={() => setReportTarget(null)}
        onSubmitted={(reason, details) => submitReport(reason, details)}
      />
    </PageContainer>
  );
}
