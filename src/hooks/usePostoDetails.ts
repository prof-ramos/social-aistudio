import { useEffect, useState } from 'react';
import { postoService } from '../services/postoService';
import { reportService } from '../services/reportService';
import { STATIC_POSTOS } from '../data/postosData';

export function usePostoDetails(slug: string | undefined, profileId: string) {
  const [posto, setPosto] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldType, setNewFieldType] = useState('GERAL');
  const [newFieldBody, setNewFieldBody] = useState('');

  useEffect(() => {
    if (!slug) return;
    let unsubFields = () => {};
    
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
      }
      setLoading(false);
    };

    fetchPosto();
    return () => unsubFields();
  }, [slug]);

  const handleAddField = async (e: React.FormEvent) => {
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

  const handleReport = async (type: string, contentId: string, preview: string) => {
    const reason = prompt('Qual o motivo da denúncia?');
    if (!reason || !reason.trim()) return;
    try {
      await reportService.createReport(type, contentId, preview, profileId, reason);
      alert('Denúncia enviada com sucesso para a moderação.');
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar denúncia.');
    }
  };

  return {
    posto,
    fields,
    loading,
    isAddingField,
    setIsAddingField,
    newFieldType,
    setNewFieldType,
    newFieldBody,
    setNewFieldBody,
    handleAddField,
    handleReport
  };
}
