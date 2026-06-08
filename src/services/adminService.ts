import { supabase } from '../lib/supabase';
import { MemberRequest, Report, UserRole } from '../types';

export const adminService = {
  subscribeToPendingRequests: (onUpdate: (count: number) => void) => {
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('member_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');
      if (error) {
        console.error('Error fetching admin requests:', error);
        return;
      }
      onUpdate(count ?? 0);
    };

    fetchCount();

    const channel = supabase
      .channel('member_requests_pending')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_requests',
          filter: "status=eq.PENDING",
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToAllRequests: (onUpdate: (requests: MemberRequest[]) => void) => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('member_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('Error fetching all requests:', error);
        return;
      }
      onUpdate(data ?? []);
    };

    fetchRequests();

    const channel = supabase
      .channel('member_requests_all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_requests',
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  updateRequestStatus: async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    const { error } = await supabase.from('member_requests').update({ status }).eq('id', requestId);
    if (error) throw error;
  },

  rejectRequestWithReason: async (requestId: string, reason: string) => {
    const { error } = await supabase
      .from('member_requests')
      .update({ status: 'REJECTED', rejection_reason: reason })
      .eq('id', requestId);
    if (error) throw error;
  },

  createUserFromRequest: async (uid: string, requestData: MemberRequest) => {
    const { error } = await supabase.from('users').insert({
      id: uid,
      name: requestData.name,
      email: requestData.email,
      role: requestData.category,
      cpf: requestData.cpf,
      matricula: requestData.matricula,
      current_post: requestData.currentPost,
    });
    if (error) throw error;
  },

  subscribeToReports: (onUpdate: (reports: Report[]) => void) => {
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('Error fetching reports:', error);
        return;
      }
      onUpdate(data ?? []);
    };

    fetchReports();

    const channel = supabase
      .channel('reports_all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  updateReportStatus: async (reportId: string, status: string) => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
    if (error) throw error;
  },
};
