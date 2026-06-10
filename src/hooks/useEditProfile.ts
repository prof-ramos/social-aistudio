import { useEffect, useState, FormEvent } from 'react';
import { userService } from '../services/userService';
import { UserProfile } from '../types';
import { useToast } from '../components/ui/Toast';

export function useEditProfile(user: UserProfile | null, id: string | undefined, isOwnProfile: boolean) {
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    avatarUrl: '',
    currentPost: '',
    interests: '',
    phone: '',
    phoneIsWhatsapp: false,
    showPhone: false,
    showEmail: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || isEditing) return;
    setEditForm({
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      currentPost: user.currentPost || '',
      interests: user.interests || '',
      phone: user.phone || '',
      phoneIsWhatsapp: user.phoneIsWhatsapp || false,
      showPhone: user.showPhone || false,
      showEmail: user.showEmail || false,
    });
  }, [user, isEditing]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !isOwnProfile) return;
    setSaving(true);
    try {
      await userService.updateUserProfile(id, {
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl,
        currentPost: editForm.currentPost,
        interests: editForm.interests,
        phone: editForm.phone,
        phoneIsWhatsapp: editForm.phoneIsWhatsapp,
        showPhone: editForm.showPhone,
        showEmail: editForm.showEmail,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return {
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    saving,
    handleSave,
  };
}
