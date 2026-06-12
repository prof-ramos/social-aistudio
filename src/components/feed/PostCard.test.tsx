import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PostCard } from './PostCard';
import { vi } from 'vitest';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('PostCard - sanitizeHtml', () => {
  const mockOnToggleSaved = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const profile: any = {
    id: 'user1',
    name: 'João Silva',
    role: 'MEMBRO_ATIVO',
    savedPosts: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sanitized body without dangerous tags', () => {
    const post: any = {
      id: 'p1',
      title: 'Post Title',
      body: '<p>Safe content</p><script>alert("xss")</script>',
      category: 'GERAL',
      authorId: 'user1',
      authorName: 'João Silva',
      authorRole: 'MEMBRO_ATIVO',
      createdAt: new Date().toISOString(),
      reactions: {},
      pinned: false,
    };

    const { container } = renderWithRouter(
      <PostCard
        post={post}
        profile={profile}
        isSaved={false}
        onToggleSaved={mockOnToggleSaved}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const bodyDiv = container.querySelector('.line-clamp-3');
    expect(bodyDiv).toBeInTheDocument();
    expect(bodyDiv?.innerHTML).toContain('<p>Safe content</p>');
    expect(bodyDiv?.innerHTML).not.toContain('<script>');
  });

  it('renders allowed HTML tags in body', () => {
    const post: any = {
      id: 'p2',
      title: 'HTML Post',
      body: '<h2>Heading</h2><ul><li>Item</li></ul><blockquote>Quote</blockquote>',
      category: 'CARREIRA',
      authorId: 'user2',
      authorName: 'Maria',
      authorRole: 'MEMBRO_APOSENTADO',
      createdAt: new Date().toISOString(),
      reactions: {},
      pinned: false,
    };

    const { container } = renderWithRouter(
      <PostCard
        post={post}
        profile={profile}
        isSaved={false}
        onToggleSaved={mockOnToggleSaved}
      />
    );

    const bodyDiv = container.querySelector('.line-clamp-3');
    expect(bodyDiv?.innerHTML).toContain('<h2>');
    expect(bodyDiv?.innerHTML).toContain('<ul>');
    expect(bodyDiv?.innerHTML).toContain('<blockquote>');
  });

  it('triggers delete confirm dialog', async () => {
    const user = userEvent.setup();
    const post: any = {
      id: 'p3',
      title: 'Delete Me',
      body: '<p>body</p>',
      category: 'GERAL',
      authorId: 'user1',
      authorName: 'João Silva',
      authorRole: 'MEMBRO_ATIVO',
      createdAt: new Date().toISOString(),
      reactions: {},
      pinned: false,
    };

    renderWithRouter(
      <PostCard
        post={post}
        profile={profile}
        isSaved={false}
        onToggleSaved={mockOnToggleSaved}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const actionsButton = screen.getByLabelText('Ações da publicação');
    await user.click(actionsButton);

    const deleteButton = await screen.findByText('Excluir');
    await user.click(deleteButton);

    expect(screen.getByText('Excluir publicação')).toBeInTheDocument();
    expect(screen.getByText(/não pode ser desfeita/)).toBeInTheDocument();
  });
});
