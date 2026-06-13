import { supabase } from '../lib/supabase';
import { MemberRequestInput } from '../types';

type NotifyAdminResult = { ok: true } | { ok: false; error: string };

async function notifyAdminAboutRequest(data: MemberRequestInput): Promise<NotifyAdminResult> {
  try {
    const response = await fetch('/api/admin/notify-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        matricula: data.matricula,
      }),
    });

    if (response.ok) return { ok: true };

    const body = await response.json().catch(() => null) as { error?: string } | null;
    return { ok: false, error: body?.error || 'Erro ao enviar aviso para a administração.' };
  } catch {
    return { ok: false, error: 'Erro ao enviar aviso para a administração.' };
  }
}

export const memberRequestService = {
  createRequest: async (data: MemberRequestInput) => {
    const { data: inserted, error } = await supabase
      .rpc('insert_member_request', {
        p_name: data.name,
        p_email: data.email,
        p_cpf: data.cpf,
        p_matricula: data.matricula,
        p_category: data.category,
        p_current_post: data.currentPost,
      });

    if (error) {
      console.error('Error creating member request:', error);
      throw error;
    }

    return inserted;
  },

  submitRequest: async (data: MemberRequestInput) => {
    const inserted = await memberRequestService.createRequest(data);
    const notification = await notifyAdminAboutRequest(data);

    return {
      inserted,
      adminNotified: notification.ok,
      notificationError: notification.ok ? null : notification.error,
    };
  },
};
