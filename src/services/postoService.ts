import { supabase } from '../lib/supabase';

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
        .select('*, users_public!author_id(name, role)')
        .eq('posto_id', postoId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      const mapped = (data ?? []).map((r: any) => ({
        ...r,
        authorName: r.users_public?.name ?? null,
        authorRole: r.users_public?.role ?? null,
      }));

      onUpdate(mapped);
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

  createReview: async (postoId: string, authorId: string, body: string, rating: number) => {
    const { data, error } = await supabase.from(REVIEWS_TABLE).insert({
      posto_id: postoId,
      author_id: authorId,
      body,
      rating,
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

  getHighlightedPosto: async (): Promise<{
    name: string;
    slug: string;
    reviewCount: number;
    averageRating: number | null;
  } | null> => {
    const { data, error } = await supabase.rpc('get_highlighted_posto');

    if (error) {
      console.error('Error fetching highlighted posto:', error);
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      const { data: fallback, error: fallbackError } = await supabase
        .from(POSTOS_TABLE)
        .select('name, slug')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackError || !fallback) return null;

      return {
        name: fallback.name,
        slug: fallback.slug,
        reviewCount: 0,
        averageRating: null,
      };
    }

    return {
      name: row.name,
      slug: row.slug,
      reviewCount: Number(row.review_count),
      averageRating: row.average_rating != null ? Number(row.average_rating) : null,
    };
  },

  subscribeToPostoFields: (postoId: string, onUpdate: (fields: any[]) => void) => {
    const fetchFields = async () => {
      const { data, error } = await supabase
        .from(POSTO_FIELDS_TABLE)
        .select('*, users_public!author_id(name, role)')
        .eq('posto_id', postoId)
        .limit(50);

      if (error) {
        console.error('Error fetching posto fields:', error);
        return;
      }

      const mapped = (data ?? []).map((f: any) => ({
        ...f,
        authorName: f.users_public?.name ?? null,
        authorRole: f.users_public?.role ?? null,
      }));

      onUpdate(mapped);
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

  softDeleteField: async (fieldId: string) => {
    const { error } = await supabase
      .from(POSTO_FIELDS_TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', fieldId);
    if (error) {
      console.error('Error soft-deleting posto field:', error);
      throw error;
    }
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
