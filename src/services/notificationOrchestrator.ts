import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

export type MentionType = 'MENTION_POST' | 'MENTION_COMMENT';

export const notifyMentions = async (
  text: string,
  type: MentionType,
  postId: string,
  actorName: string,
  actorId: string
): Promise<void> => {
  try {
    // Extract @mentions from text using Unicode-aware regex
    const mentionRegex = /@([\wÀ-ú]+(?:\s+[\wÀ-ú]+)*)(?![\wÀ-ú])/g;
    const matches = [...text.matchAll(mentionRegex)];
    const mentionedNames = new Set(
      matches.map((m) => m[1].toLowerCase().trim())
    );

    if (mentionedNames.size === 0) return;

    // Busca apenas os users cujos nomes foram mencionados (case-insensitive)
    const orCondition = [...mentionedNames]
      .map((name) => `name.ilike."${name}"`)
      .join(',');

    const { data: users, error: usersError } = await supabase
      .from('users_public')
      .select('id, name')
      .or(orCondition)
      .neq('id', actorId);

    if (usersError || !users) {
      console.error('Error fetching users for mentions:', usersError);
      return;
    }

    const mentionedIds = new Set<string>();
    for (const user of users) {
      if (mentionedNames.has(user.name.toLowerCase().trim())) {
        mentionedIds.add(user.id);
      }
    }

    for (const userId of mentionedIds) {
      await notificationService.createNotification({
        userId,
        type,
        actorName,
        postId,
        message: `${actorName} mencionou você em um ${type === 'MENTION_POST' ? 'post' : 'comentário'}`,
        link: `/feed/${postId}`,
      });
    }
  } catch (err) {
    console.error('Error notifying mentions:', err);
  }
};
