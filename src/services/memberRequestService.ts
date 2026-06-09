import { supabase } from '../lib/supabase';

export const memberRequestService = {
  createRequest: async (data: any) => {
    const { data: inserted, error } = await supabase
      .from('member_requests')
      .insert({
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        matricula: data.matricula,
        category: data.category,
        current_post: data.currentPost,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member request:', error);
      throw error;
    }

    return inserted;
  }
};
