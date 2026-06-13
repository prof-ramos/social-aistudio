import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName: string;
  userId: string;
  onUploadComplete: (url: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, userName, userId, onUploadComplete }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { previewUrl, uploading, processFile } = useAvatarUpload(userId, onUploadComplete);

  const displayUrl = previewUrl || currentAvatarUrl;

  const handleClick = () => {
    fileInputRef.current?.click();
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