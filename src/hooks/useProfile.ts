import { useEffect, useState, FormEvent } from 'react';
import { userService } from '../services/userService';
import { UserProfile } from '../types';

export function useProfile(id: string | undefined, currentProfile: UserProfile) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    avatarUrl: '',
    currentPost: '',
  });
  const [saving, setSaving] = useState(false);

  const isOwnProfile = currentProfile.id === id || currentProfile.role === 'ADMIN';

  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      try {
        const userData = await userService.getUserProfile(id);
        if (userData) {
          setUser(userData);
          setEditForm({
            bio: userData.bio || '',
            avatarUrl: userData.avatarUrl || '',
            currentPost: (userData as any).currentPost || '',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

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
  };
}
