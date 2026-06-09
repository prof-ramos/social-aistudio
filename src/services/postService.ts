import { Post, PostCategory, UserProfile, PostComment } from '../types';
import { postRepository } from './postRepository';
import { reactionRepository } from './reactionRepository';
import { notifyMentions } from './notificationOrchestrator';

export const postService = {
  getPostsByIds: postRepository.getPostsByIds,
  getPostsByAuthor: postRepository.getPostsByAuthor,
  subscribeToFeed: postRepository.subscribeToFeed,
  fetchMorePosts: postRepository.fetchMorePosts,

  createPost: async (title: string, bodyHTML: string, category: PostCategory | string, profile: UserProfile) => {
    const post = await postRepository.createPost(title, bodyHTML, category, profile);
    notifyMentions(bodyHTML, 'MENTION_POST', post.id, profile.name, profile.id);
    return post;
  },

  getPost: postRepository.getPost,
  subscribeToPost: postRepository.subscribeToPost,
  subscribeToComments: postRepository.subscribeToComments,

  createComment: async (postId: string, body: string, profile: UserProfile) => {
    const comment = await postRepository.createComment(postId, body, profile);
    notifyMentions(body, 'MENTION_COMMENT', postId, profile.name, profile.id);
    return comment;
  },

  toggleReaction: reactionRepository.toggleReaction,
  softDeletePost: postRepository.softDeletePost,
  softDeleteComment: postRepository.softDeleteComment,
  updatePost: postRepository.updatePost,
  getPostCountByAuthor: postRepository.getPostCountByAuthor,
};
