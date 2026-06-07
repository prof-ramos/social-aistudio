import { useEffect, useState, FormEvent } from 'react';
import { postService } from '../services/postService';
import { reportService } from '../services/reportService';
import { UserProfile } from '../types';
import { useToast } from '../components/ui/Toast';

export function usePostDetails(id: string | undefined, profile: UserProfile) {
  const { addToast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

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

  const handleReport = async (type: string, contentId: string, preview: string) => {
    const reason = prompt('Qual o motivo da denúncia?');
    if (!reason || !reason.trim()) return;
    try {
      await reportService.createReport(type, contentId, preview, profile.id, reason);
      addToast("Denúncia enviada com sucesso para a moderação.", "success");
    } catch (e) {
      console.error(e);
      addToast("Erro ao enviar denúncia.", "error");
    }
  };

  return {
    post,
    comments,
    newCommentBody,
    setNewCommentBody,
    loading,
    isPosting,
    handleAddComment,
    handleReport
  };
}
