import { render, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { AvatarUpload } from './AvatarUpload';

const addToast = vi.fn();

vi.mock('../../services/userService', () => ({
  userService: {
    uploadAvatar: vi.fn(),
    updateUserProfile: vi.fn(),
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
});