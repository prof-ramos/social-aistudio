import { supabase } from '../lib/supabase';

export const systemService = {
  checkConnection: async () => {
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection check failed:', error.message);
    }
  }
};
