import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { userService } from '../../services/userService';
import { useToast } from './Toast';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName: string;
  userId: string;
  onUploadComplete: (url: string) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function AvatarUpload({ currentAvatarUrl, userName, userId, onUploadComplete }: AvatarUploadProps) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayUrl = previewUrl || currentAvatarUrl;

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Formato inválido. Use JPG, PNG ou WebP.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. O limite é 2MB.';
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      addToast(validationError, 'error');
      e.target.value = '';
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setUploading(true);
      const publicUrl = await userService.uploadAvatar(userId, file);
      onUploadComplete(publicUrl);
      addToast('Foto de perfil atualizada com sucesso.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao enviar foto de perfil.', 'error');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="relative group w-32 h-32 bg-ice border-4 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-50"
        aria-label="Mudar foto de perfil"
      >
        {displayUrl ? (
          <img src={displayUrl} alt={userName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl font-bold text-navy uppercase">{userName.charAt(0)}</span>
        )}
        <div className="absolute inset-0 bg-navy/60 flex flex-col items-center justify-center text-white transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none">
          <Camera className="w-6 h-6 mb-1" />
          <span className="text-xs uppercase font-bold text-center px-2 tracking-wider">Mudar Foto</span>
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}