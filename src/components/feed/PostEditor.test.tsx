import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostEditor } from './PostEditor';
import { vi } from 'vitest';

describe('PostEditor - interactive behaviors', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows ConfirmDialog when discarding a draft with content', async () => {
    const user = userEvent.setup();
    render(
      <PostEditor
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onUpdate={mockOnUpdate}
        isPosting={false}
      />
    );

    // Type a title to create draft content
    await user.type(screen.getByPlaceholderText('Título da publicação'), 'Rascunho');
    await user.selectOptions(screen.getByRole('combobox'), 'GERAL');

    // Click discard button
    await user.click(screen.getByText('DESCARTAR'));

    // ConfirmDialog should appear
    expect(screen.getByText('Descartar rascunho')).toBeInTheDocument();
    expect(screen.getByText('Deseja realmente descartar o rascunho?')).toBeInTheDocument();
  });

  it('confirms draft discard clears localStorage and calls onCancel', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'social-asof-draft-post',
      JSON.stringify({ t: 'Draft', c: 'GERAL', b: '<p>body</p>' })
    );

    render(
      <PostEditor
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onUpdate={mockOnUpdate}
        isPosting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Título da publicação')).toHaveValue('Draft');
    });

    await user.click(screen.getByText('DESCARTAR'));
    expect(screen.getByText('Descartar rascunho')).toBeInTheDocument();

    // Click the confirm button inside the ConfirmDialog (exact case "Descartar")
    const confirmButton = screen.getByText('Descartar');
    await user.click(confirmButton);

    expect(localStorage.getItem('social-asof-draft-post')).toBeNull();
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('cancels draft discard and keeps localStorage', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'social-asof-draft-post',
      JSON.stringify({ t: 'Draft', c: 'GERAL', b: '<p>body</p>' })
    );

    render(
      <PostEditor
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onUpdate={mockOnUpdate}
        isPosting={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Título da publicação')).toHaveValue('Draft');
    });

    await user.click(screen.getByText('DESCARTAR'));

    // Click the cancel button inside the ConfirmDialog (exact case "Cancelar")
    const cancelButton = screen.getByText('Cancelar');
    await user.click(cancelButton);

    expect(localStorage.getItem('social-asof-draft-post')).not.toBeNull();
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('does not show DESCARTAR button when editing', () => {
    const editPost = {
      id: '1',
      title: 'Edit',
      body: '<p>body</p>',
      category: 'GERAL',
      authorId: 'u1',
      authorName: 'User',
      authorRole: 'MEMBRO_ATIVO' as const,
      createdAt: new Date().toISOString(),
      reactions: {},
      pinned: false,
    };

    render(
      <PostEditor
        editPost={editPost}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onUpdate={mockOnUpdate}
        isPosting={false}
      />
    );

    expect(screen.queryByText('DESCARTAR')).not.toBeInTheDocument();
  });

  it('handles visualViewport resize by scrolling to caret position', async () => {
    const scrollBySpy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});

    // Mock visualViewport
    const mockVisualViewport = {
      height: 500,
      width: 400,
      offsetTop: 0,
      offsetLeft: 0,
      scale: 1,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window, 'visualViewport', {
      value: mockVisualViewport,
      writable: true,
      configurable: true,
    });

    render(
      <PostEditor
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        onUpdate={mockOnUpdate}
        isPosting={false}
      />
    );

    // Verify event listener was registered
    expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));

    // Simulate a selection with a bounding rect below viewport
    const mockRange = {
      getBoundingClientRect: () => ({ bottom: 600, top: 550, left: 0, right: 100, height: 50, width: 100, x: 0, y: 550 }),
    };
    const mockSelection = {
      rangeCount: 1,
      getRangeAt: () => mockRange,
    };
    vi.spyOn(window, 'getSelection').mockReturnValue(mockSelection as any);

    // Trigger resize callback
    const resizeHandler = mockVisualViewport.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'resize'
    )[1];
    resizeHandler();

    // Should scroll by the difference (600 + 16 - 500 = 116)
    expect(scrollBySpy).toHaveBeenCalledWith({ top: 116, behavior: 'smooth' });

    scrollBySpy.mockRestore();
  });
});
