import { supabase } from '../lib/supabase';
import { MemberRequestInput } from '../types';

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
  }
};