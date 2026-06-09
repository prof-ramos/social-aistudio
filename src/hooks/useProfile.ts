import { useEffect, useState, FormEvent } from 'react';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { UserProfile, Post } from '../types';
import { useToast } from '../components/ui/Toast';

export function useProfile(id: string | undefined, currentProfile: UserProfile) {
  const { addToast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
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

  const isOwnProfile = currentProfile.id === id;
  const isViewingOwnProfile = currentProfile.id === id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsubscribe = userService.subscribeToProfile(
      id,
      async (userData) => {
        if (userData) {
          setUser(userData);
          setEditForm(prev => {
            if (!isEditing) {
              return {
                bio: userData.bio || '',
                avatarUrl: userData.avatarUrl || '',
                currentPost: userData.currentPost || '',
                interests: userData.interests || '',
                phone: userData.phone || '',
                phoneIsWhatsapp: userData.phoneIsWhatsapp || false,
                showPhone: userData.showPhone || false,
                showEmail: userData.showEmail || false,
              };
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

          try {
            const authored = await postService.getPostsByAuthor(id);
            setUserPosts(authored);
          } catch (e) {
            console.error(e);
            setUserPosts([]);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      { includePrivate: isViewingOwnProfile }
    );

    return () => unsubscribe();
  }, [id, isEditing, isViewingOwnProfile]);

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
      setUser(prev => (prev ? { ...prev, ...editForm } : prev));
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar perfil.', 'error');
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
    userPosts,
  };
}