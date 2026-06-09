import { useEffect, useState, FormEvent } from 'react';
import { postService } from '../services/postService';
import { reportService } from '../services/reportService';
import { UserProfile } from '../types';
import { useToast } from '../components/ui/Toast';

export interface ReportTarget {
  type: string;
  contentId: string;
  preview: string;
}

export function usePostDetails(id: string | undefined, profile: UserProfile) {
  const { addToast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  useEffect(() => {
    if (!id) return;
    
    // Subscribe to post details
    const unsubPost = postService.subscribeToPost(id, (p) => {
      setPost(p);
      setLoading(false);
    });

    // Subscribe to comments
    const unsubComments = postService.subscribeToComments(id, (fetchedComments) => {
      setComments(fetchedComments);
    });

    return () => {
      unsubPost();
      unsubComments();
    };
  }, [id]);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim() || !id) return;
    setIsPosting(true);
    try {
      await postService.createComment(id, newCommentBody, profile);
      setNewCommentBody('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleReport = (type: string, contentId: string, preview: string) => {
    setReportTarget({ type, contentId, preview });
  };

  const submitReport = async (reason: string, details: string) => {
    if (!reportTarget) return;
    const fullReason = reason === 'Outro' ? details : `${reason}: ${details}`;
    try {
      await reportService.createReport(reportTarget.type, reportTarget.contentId, reportTarget.preview, profile.id, fullReason);
      addToast("Denúncia enviada com sucesso para a moderação.", "success");
    } catch (e) {
      console.error(e);
      addToast("Erro ao enviar denúncia.", "error");
    } finally {
      setReportTarget(null);
    }
  };

  const handleDeletePost = async () => {
    if (!id) return;
    try {
      await postService.softDeletePost(id);
      addToast('Publicação removida com sucesso.', 'success');
    } catch (e) {
      console.error(e);
      addToast('Erro ao remover publicação.', 'error');
      throw e;
    }
  };

  return {
    post,
    setPost,
    comments,
    newCommentBody,
    setNewCommentBody,
    loading,
    isPosting,
    handleAddComment,
    handleReport,
    reportTarget,
    setReportTarget,
    submitReport,
    handleDeletePost
  };
}
