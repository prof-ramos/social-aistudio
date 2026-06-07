import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Feed } from './Feed';
import { useFeed } from '../hooks/useFeed';
import { userService } from '../services/userService';
import { vi } from 'vitest';

vi.mock('../hooks/useFeed');
vi.mock('../services/userService');

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
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
  });

  it('renders "Nenhum post encontrado" when the filtered posts are empty', () => {
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
      loadMore: vi.fn(),
      hasMore: false
    });

    renderWithRouter(<Feed profile={profile} />);

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
      loadMore: vi.fn(),
      hasMore: false
    });

    renderWithRouter(<Feed profile={profile} />);

    const saveButton = screen.getByTitle('Salvar Post');
    
    await user.click(saveButton);

    expect(mockToggleSavedPost).toHaveBeenCalledWith('user1', 'post1');
    
    // The profile object should have been mutated inline based on the current implementation
    expect(profile.savedPosts).toContain('post1');
  });
});
