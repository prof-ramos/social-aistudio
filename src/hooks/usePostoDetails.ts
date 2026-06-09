import { useEffect, useState, FormEvent } from 'react';
import { postoService } from '../services/postoService';
import { reportService } from '../services/reportService';
import { STATIC_POSTOS } from '../data/postosData';
import { useToast } from '../components/ui/Toast';
import { ReportTarget } from './usePostDetails';

export interface Review {
  id: string;
  posto_id: string;
  author_id: string;
  body: string;
  rating: number;
  created_at: string;
  authorName?: string | null;
  authorRole?: string | null;
}

export function usePostoDetails(slug: string | undefined, profileId: string) {
  const { addToast } = useToast();
  const [posto, setPosto] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldType, setNewFieldType] = useState('GERAL');
  const [newFieldBody, setNewFieldBody] = useState('');

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  useEffect(() => {
    if (!slug) return;
    let unsubFields = () => {};
    let unsubReviews = () => {};

    const fetchPosto = async () => {
      let p = await postoService.getPostoBySlug(slug);

      if (!p) {
        const staticP = STATIC_POSTOS.find(sp => sp.slug === slug);
        if (staticP) {
          p = { id: staticP.slug, ...staticP };
        }
      }

      if (p) {
        setPosto(p);
        unsubFields = postoService.subscribeToPostoFields(p.id, (fetchedFields) => {
          setFields(fetchedFields);
        });
        unsubReviews = postoService.subscribeToPostoReviews(p.id, (fetchedReviews) => {
          setReviews(fetchedReviews);
        });
      }
      setLoading(false);
    };

    fetchPosto();
    return () => {
      unsubFields();
      unsubReviews();
    };
  }, [slug]);

  const handleAddField = async (e: FormEvent) => {
     e.preventDefault();
     if(!posto) return;
     try {
       await postoService.createPostoField(posto.id, newFieldType, newFieldBody, profileId);
       setIsAddingField(false);
       setNewFieldBody('');
     } catch(err) {
       console.error(err);
     }
  };

  const hasExistingReview = reviews.some(r => r.author_id === profileId);

  const handleCreateReview = async (body: string, rating: number) => {
    if (!posto) return;
    if (hasExistingReview) {
      addToast('Você já avaliou este posto.', 'warning');
      return;
    }
    try {
      await postoService.createReview(posto.id, profileId, body, rating);
      addToast('Avaliação publicada com sucesso.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao publicar avaliação.', 'error');
    }
  };

  const handleReport = (type: string, contentId: string, preview: string) => {
    setReportTarget({ type, contentId, preview });
  };

  const submitReport = async (reason: string, details: string) => {
    if (!reportTarget) return;
    const fullReason = reason === 'Outro' ? details : `${reason}: ${details}`;
    try {
      await reportService.createReport(reportTarget.type, reportTarget.contentId, reportTarget.preview, profileId, fullReason);
      addToast("Denúncia enviada com sucesso para a moderação.", "success");
    } catch (e) {
      console.error(e);
      addToast("Erro ao enviar denúncia.", "error");
    } finally {
      setReportTarget(null);
    }
  };

  return {
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
  };
}
