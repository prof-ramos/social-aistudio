import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Feed } from './Feed';
import { useFeed } from '../hooks/useFeed';
import { userService } from '../services/userService';
import { ToastProvider } from '../components/ui/Toast';
import { vi } from 'vitest';

vi.mock('../hooks/useFeed');
vi.mock('../services/userService');
vi.mock('../services/postService', () => ({
  postService: {
    getPostCountByAuthor: vi.fn().mockResolvedValue(0),
    getPosts: vi.fn().mockResolvedValue([]),
    createPost: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
    toggleReaction: vi.fn(),
  },
}));


// Mocka componentes sidebar que fazem chamadas async — fora do escopo deste teste
vi.mock('../components/feed/MemberSuggestionsCard', () => ({
  MemberSuggestionsCard: () => null,
}));
vi.mock('../components/feed/PostoHighlightCard', () => ({
  PostoHighlightCard: () => null,
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        <ToastProvider>{children}</ToastProvider>
      </BrowserRouter>
    ),
  });
};

describe('Feed', () => {
  const profile: any = {
    id: 'user1',
    name: 'João Silva',
    role: 'MEMBRO_ATIVO',
    savedPosts: []
  };

  const useFeedMock = useFeed as any;

  beforeAll(() => {
    // Mock IntersectionObserver
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver as any;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (userService.getAllUsers as any).mockResolvedValue([]);
    (userService.getUsersWithCommonPostos as any) = vi.fn().mockResolvedValue([]);
  });

  it('renders "Nenhum post encontrado" when the filtered posts are empty', async () => {
    useFeedMock.mockReturnValue({
      filteredPosts: [],
      isPosting: false,
      showEditor: false,
      setShowEditor: vi.fn(),
      filterCategory: 'TODOS',
      setFilterCategory: vi.fn(),
      search: 'stringaleatoria',
      setSearch: vi.fn(),
      handleCreatePost: vi.fn(),
      activeFilter: 'RECENTES',
      setActiveFilter: vi.fn(),
      postCount: 0,
      loadMore: vi.fn(),
      hasMore: false
    });

    await act(async () => {
      renderWithRouter(<Feed profile={profile} />);
    });

    expect(screen.getByText('Nenhum post encontrado')).toBeInTheDocument();
  });

  it('allows toggling saved state of a post', async () => {
    const user = userEvent.setup();
    const mockToggleSavedPost = vi.fn().mockResolvedValue(true);
    (userService.toggleSavedPost as any) = mockToggleSavedPost;

    const post = {
      id: 'post1',
      title: 'Post Title',
      body: 'Post Body',
      category: 'GERAL',
      reactions: {},
      pinned: false
    };

    useFeedMock.mockReturnValue({
      filteredPosts: [post],
      isPosting: false,
      showEditor: false,
      setShowEditor: vi.fn(),
      filterCategory: 'TODOS',
      setFilterCategory: vi.fn(),
      search: '',
      setSearch: vi.fn(),
      handleCreatePost: vi.fn(),
      activeFilter: 'RECENTES',
      setActiveFilter: vi.fn(),
      postCount: 1,
      loadMore: vi.fn(),
      hasMore: false
    });

    renderWithRouter(<Feed profile={profile} />);

    const saveButton = screen.getByLabelText('Salvar post');

    await user.click(saveButton);

    expect(mockToggleSavedPost).toHaveBeenCalledWith('user1', 'post1');

    // New behavior: saved state lives in React state (useSavedPosts), so the
    // bookmark re-renders immediately — its label flips to "Remover dos salvos"
    // — without mutating the profile prop.
    expect(await screen.findByLabelText('Remover dos salvos')).toBeInTheDocument();
    expect(profile.savedPosts).not.toContain('post1');
  });
});
