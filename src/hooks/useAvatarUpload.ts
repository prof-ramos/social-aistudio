import { useEffect, useState } from 'react';
import { userService } from '../services/userService';
import { useToast } from '../components/ui/Toast';

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

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Formato inválido. Use JPG, PNG ou WebP.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Arquivo muito grande. O limite é 2MB.';
  }
  return null;
}

/**
 * Avatar validation, client-side resize, and upload via userService.
 * Keeps the AvatarUpload UI primitive free of direct service I/O.
 */
export function useAvatarUpload(userId: string, onUploadComplete: (url: string) => void) {
  const { addToast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

  return { previewUrl, uploading, processFile };
}
