import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';

export function useAdminMembers() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    // Only pending requests usually, but let's grab all for admin view
    const unsub = adminService.subscribeToAllRequests((reqs) => {
      setRequests(reqs);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (req: any) => {
    if (!window.confirm(`Aprovar ${req.name}?`)) return;
    
    try {
      await adminService.updateRequestStatus(req.id, 'APPROVED');
      alert('Solicitação aprovada. O associado poderá se registrar com este e-mail.');
    } catch (e) {
      console.error(e);
      alert('Erro ao aprovar.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Justificativa da rejeição:");
    if (reason === null) return;

    try {
      await adminService.rejectRequestWithReason(id, reason);
    } catch (e) {
      console.error(e);
      alert('Erro ao rejeitar.');
    }
  };

  return {
    requests,
    handleApprove,
    handleReject
  };
}
