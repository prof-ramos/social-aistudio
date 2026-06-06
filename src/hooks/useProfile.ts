import { useEffect, useState, FormEvent } from 'react';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { UserProfile, Post } from '../types';

export function useProfile(id: string | undefined, currentProfile: UserProfile) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [editForm, setEditForm] = useState({
    bio: '',
    avatarUrl: '',
    currentPost: '',
  });
  const [saving, setSaving] = useState(false);

  const isOwnProfile = currentProfile.id === id || currentProfile.role === 'ADMIN';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsubscribe = userService.subscribeToProfile(id, async (userData) => {
      if (userData) {
        setUser(userData);
        // Only set the edit form values if they haven't been touched yet or aren't currently editing, 
        // OR simply rely on the first fetch. Here we can update safely if not editing.
        setEditForm(prev => {
          if (!isEditing) {
            return {
              bio: userData.bio || '',
              avatarUrl: userData.avatarUrl || '',
              currentPost: (userData as any).currentPost || '',
            }
          }
          return prev;
        });
        
        if (userData.savedPosts && userData.savedPosts.length > 0) {
          try {
            const posts = await postService.getPostsByIds(userData.savedPosts);
            setSavedPosts(posts);
          } catch (e) {
            console.error(e);
          }
        } else {
          setSavedPosts([]);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, isEditing]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !isOwnProfile) return;
    setSaving(true);
    try {
      await userService.updateUserProfile(id, {
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl,
        ...({ currentPost: editForm.currentPost } as any),
      });
      setUser({ ...user, ...editForm });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  return {
    user,
    loading,
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    saving,
    isOwnProfile,
    handleSave,
    savedPosts,
  };
}
