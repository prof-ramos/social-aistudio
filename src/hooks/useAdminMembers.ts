import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { useToast } from '../components/ui/Toast';

export function useAdminMembers() {
  const [requests, setRequests] = useState<any[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const unsub = adminService.subscribeToAllRequests((reqs) => {
      setRequests(reqs);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (req: any) => {
    try {
      await adminService.updateRequestStatus(req.id, 'APPROVED');
      addToast('Solicitação aprovada. O associado poderá se registrar.', 'success');
    } catch (e) {
      console.error(e);
      addToast('Erro ao aprovar solicitação.', 'error');
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      await adminService.rejectRequestWithReason(id, reason || 'Rejeitado pelo administrador');
      addToast('Solicitação rejeitada.', 'success');
    } catch (e) {
      console.error(e);
      addToast('Erro ao rejeitar solicitação.', 'error');
    }
  };

  return {
    requests,
    handleApprove,
    handleReject
  };
}
