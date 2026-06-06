import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';

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

  const handleResolve = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      alert("É necessário inserir uma nota de moderação.");
      return;
    }
    
    setLoading(true);
    try {
      await adminService.updateReportStatus(id, action);
      
      setResolvingId(null);
      setNotes('');
    } catch (e) {
      console.error(e);
      alert('Erro ao resolver denúncia.');
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
