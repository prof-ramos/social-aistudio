import { supabase } from '../lib/supabase';

export const reportService = {
  createReport: async (type: string, contentId: string, preview: string, reporterId: string, reason: string) => {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        type,
        content_id: contentId,
        preview: preview.substring(0, 100),
        reported_by: reporterId,
        reason,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      throw error;
    }

    return data;
  }
};
