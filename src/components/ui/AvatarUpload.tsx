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

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 200;

async function resizeImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(MAX_DIMENSION / bitmap.width, MAX_DIMENSION / bitmap.height, 1);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, file.type || 'image/jpeg', 0.9)
  );

  if (!blob) return file;
  return new File([blob], file.name, { type: file.type || 'image/jpeg' });
}

export function AvatarUpload({ currentAvatarUrl, userName, userId, onUploadComplete }: AvatarUploadProps) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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

  const processFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      addToast(validationError, 'error');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setUploading(true);
      const resized = await resizeImage(file);
      const publicUrl = await userService.uploadAvatar(userId, resized);
      await userService.updateUserProfile(userId, { avatarUrl: publicUrl });
      onUploadComplete(publicUrl);
      addToast('Foto de perfil atualizada com sucesso.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao enviar foto de perfil.', 'error');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  return (
    <div
      className={`flex flex-col items-center gap-3 ${dragOver ? 'ring-2 ring-navy ring-offset-2' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="relative group w-32 h-32 bg-ice border-4 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:bg-border-gray disabled:cursor-not-allowed"
        aria-label="Mudar foto de perfil"
      >
        {displayUrl ? (
          <img src={displayUrl} alt={userName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl font-bold text-navy uppercase">{userName.charAt(0)}</span>
        )}
        <div className="absolute inset-0 bg-navy/60 flex flex-col items-center justify-center text-white transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none">
          <Camera className="w-6 h-6 mb-1" />
          <span className="text-sm uppercase font-bold text-center px-2 tracking-wider">Mudar Foto</span>
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>
      <p className="text-sm text-slate font-medium leading-relaxed text-center">
        Clique ou arraste uma imagem (JPG, PNG ou WebP, até 2MB)
      </p>
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