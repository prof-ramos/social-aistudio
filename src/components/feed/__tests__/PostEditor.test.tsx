import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostEditor } from '../PostEditor';
import { vi } from 'vitest';

describe('PostEditor', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads draft from localStorage on mount', async () => {
    const draftData = {
      t: 'Meu Titulo Rascunho',
      c: 'GERAL',
      b: '<p>Meu conteudo rascunho</p>'
    };
    localStorage.setItem('social-asof-draft-post', JSON.stringify(draftData));

    render(<PostEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} isPosting={false} />);

    // Wait for Tiptap editor to sync and React state
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Título da publicação')).toHaveValue('Meu Titulo Rascunho');
    });
    
    expect(screen.getByRole('combobox')).toHaveValue('GERAL');
  });

  it('prevents submission if title is empty', async () => {
    const user = userEvent.setup();
    render(<PostEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} isPosting={false} />);

    // Try to select category and type in editor, but title is empty
    await user.selectOptions(screen.getByRole('combobox'), 'GERAL');

    // Click submit
    await user.click(screen.getByText('PUBLICAR'));

    expect(screen.getByText('Por favor, insira um título para a publicação.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('prevents submission if category is empty', async () => {
    const user = userEvent.setup();
    render(<PostEditor onSubmit={mockOnSubmit} onCancel={mockOnCancel} isPosting={false} />);

    await user.type(screen.getByPlaceholderText('Título da publicação'), 'Um título');

    // Click submit
    await user.click(screen.getByText('PUBLICAR'));

    expect(screen.getByText('Por favor, selecione uma categoria.')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
