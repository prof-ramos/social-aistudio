import { useEffect, useState, FormEvent } from 'react';
import { adminService } from '../services/adminService';
import { useToast } from '../components/ui/Toast';

// Extract this interface to types if needed, but for now keeping it self-contained
export interface Report {
  id: string;
  type: string;
  contentId: string;
  preview: string;
  reportedBy: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED_KEPT' | 'RESOLVED_REMOVED' | 'RESOLVED_WARNED';
  notes?: string;
  createdAt: any;
  resolvedAt?: any;
}

export function useAdminModeration() {
  const { addToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState<Report['status']>('RESOLVED_KEPT');

  useEffect(() => {
    const unsub = adminService.subscribeToReports((reps) => {
      setReports(reps as Report[]);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleResolve = async (id: string, e: FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      addToast('É necessário inserir uma nota de moderação.', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      await adminService.updateReportStatus(id, action);
      
      setResolvingId(null);
      setNotes('');
    } catch (e) {
      console.error(e);
      addToast('Erro ao resolver denúncia.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pendingReports = reports.filter(r => r.status === 'PENDING');
  const resolvedReports = reports.filter(r => r.status !== 'PENDING');

  return {
    reports,
    pendingReports,
    resolvedReports,
    loading,
    resolvingId,
    setResolvingId,
    notes,
    setNotes,
    action,
    setAction,
    handleResolve
  };
}
