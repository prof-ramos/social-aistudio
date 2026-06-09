import { render, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AvatarUpload } from './AvatarUpload';
import { userService } from '../../services/userService';

const addToast = vi.fn();

vi.mock('../../services/userService', () => ({
  userService: {
    uploadAvatar: vi.fn(() => Promise.resolve('https://example.com/avatar.jpg')),
    updateUserProfile: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('./Toast', () => ({
  useToast: () => ({ addToast }),
}));

describe('AvatarUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid file types', () => {
    render(
      <AvatarUpload
        userName="João"
        userId="u1"
        onUploadComplete={vi.fn()}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(addToast).toHaveBeenCalledWith('Formato inválido. Use JPG, PNG ou WebP.', 'error');
  });

  it('rejects file larger than 2MB', () => {
    render(
      <AvatarUpload
        userName="João"
        userId="u1"
        onUploadComplete={vi.fn()}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['x'], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(addToast).toHaveBeenCalledWith('Arquivo muito grande. O limite é 2MB.', 'error');
    expect(userService.uploadAvatar).not.toHaveBeenCalled();
  });

  it('accepts drag and drop on the container and validates file type', () => {
    render(
      <AvatarUpload
        userName="João"
        userId="u1"
        onUploadComplete={vi.fn()}
      />
    );

    const container = screen.getByLabelText('Mudar foto de perfil').parentElement!;
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });

    fireEvent.dragOver(container, { dataTransfer: { files: [file] } });
    fireEvent.drop(container, { dataTransfer: { files: [file] } });

    expect(addToast).toHaveBeenCalledWith('Formato inválido. Use JPG, PNG ou WebP.', 'error');
  });
});
