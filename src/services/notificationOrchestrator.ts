import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

export type MentionType = 'MENTION_POST' | 'MENTION_COMMENT';

/**
 * Regex to extract @mentions from text.
 * Uses Unicode property escapes to handle accented Portuguese names (João, André, etc.).
 * Matches: @João, @André, @O'Connor, @Mary-Jane
 * Does NOT use \b (ASCII-only, breaks on accented chars) or multi-word capture (causes false matches).
 */
/** Lookbehind ensures @ is not mid-word (e.g. email@example.com). */
const MENTION_REGEX = /(?<!\S)@([\p{L}\p{M}\p{N}'-]+)/gu;

/** Extract deduplicated mention names (without @ prefix) from text. */
export function extractMentions(text: string): string[] {
  const matches = [...text.matchAll(MENTION_REGEX)];
  return [...new Set(matches.map(m => m[1]))];
}

export const notifyMentions = async (
  text: string,
  type: MentionType,
  postId: string,
  actorName: string,
  actorId: string
): Promise<void> => {
  try {
    const mentionedNames = extractMentions(text);

    if (mentionedNames.length === 0) return;

    const { data: users, error: usersError } = await supabase
      .from('users_public')
      .select('id, name')
      .in('name', mentionedNames)
      .neq('id', actorId);

    if (usersError || !users) {
      console.error('Error fetching users for mentions:', usersError);
      return;
    }

    for (const user of users) {
      await notificationService.createNotification({
        userId: user.id,
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
