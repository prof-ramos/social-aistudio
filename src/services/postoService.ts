import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

const POSTOS_TABLE = 'postos';
const REVIEWS_TABLE = 'reviews';
const POSTO_FIELDS_TABLE = 'posto_fields';

export const postoService = {
  subscribeToPostos: (onUpdate: (postos: any[]) => void) => {
    const fetchPostos = async () => {
      const { data, error } = await supabase
        .from(POSTOS_TABLE)
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching postos:', error);
        return;
      }

      onUpdate(data ?? []);
    };

    fetchPostos();

    const channel = supabase
      .channel('postos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: POSTOS_TABLE },
        () => {
          fetchPostos();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  },

  subscribeToPostoReviews: (postoId: string, onUpdate: (reviews: any[]) => void) => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from(REVIEWS_TABLE)
        .select('*')
        .eq('posto_id', postoId)
        .limit(50);

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      onUpdate(data ?? []);
    };

    fetchReviews();

    const channel = supabase
      .channel(`reviews-changes-${postoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: REVIEWS_TABLE, filter: `posto_id=eq.${postoId}` },
        () => {
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  },

  createReview: async (postoId: string, profile: UserProfile, category: string, bodyText: string) => {
    const { data, error } = await supabase.from(REVIEWS_TABLE).insert({
      posto_id: postoId,
      author_id: profile.id,
      author_name: profile.name,
      author_role: profile.role,
      category,
      body: bodyText,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  getPostoBySlug: async (slug: string) => {
    const { data, error } = await supabase.from(POSTOS_TABLE).select('*').eq('slug', slug).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  },

  subscribeToPostoFields: (postoId: string, onUpdate: (fields: any[]) => void) => {
    const fetchFields = async () => {
      const { data, error } = await supabase
        .from(POSTO_FIELDS_TABLE)
        .select('*')
        .eq('posto_id', postoId)
        .limit(50);

      if (error) {
        console.error('Error fetching posto fields:', error);
        return;
      }

      onUpdate(data ?? []);
    };

    fetchFields();

    const channel = supabase
      .channel(`posto-fields-changes-${postoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: POSTO_FIELDS_TABLE, filter: `posto_id=eq.${postoId}` },
        () => {
          fetchFields();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  },

  createPostoField: async (postoId: string, fieldType: string, body: string, authorId: string) => {
    const { data, error } = await supabase.from(POSTO_FIELDS_TABLE).insert({
      posto_id: postoId,
      field_type: fieldType,
      body,
      author_id: authorId,
      experience_start: new Date().getTime() - 31536000000,
      experience_end: new Date().getTime(),
    });

    if (error) {
      throw error;
    }

    return data;
  },
};
