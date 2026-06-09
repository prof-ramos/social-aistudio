import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PostDetails from './PostDetails';
import { usePostDetails } from '../hooks/usePostDetails';
import { ToastProvider } from '../components/ui/Toast';
import { vi } from 'vitest';

vi.mock('../hooks/usePostDetails');

describe('PostDetails - sanitizeHtml', () => {
  const profile: any = {
    id: 'user1',
    name: 'João Silva',
    role: 'MEMBRO_ATIVO',
    savedPosts: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (postId: string) => {
    return render(
      <ToastProvider>
        <MemoryRouter initialEntries={[`/feed/${postId}`]}>
          <Routes>
            <Route path="/feed/:id" element={<PostDetails profile={profile} />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );
  };

  it('renders sanitized post body without dangerous tags', () => {
    const mockUsePostDetails = usePostDetails as any;
    mockUsePostDetails.mockReturnValue({
      post: {
        id: 'p1',
        title: 'Test Post',
        body: '<p>Safe content</p><script>alert("xss")</script>',
        category: 'GERAL',
        authorId: 'user1',
        authorName: 'João',
        authorRole: 'MEMBRO_ATIVO',
        createdAt: new Date().toISOString(),
        reactions: {},
        pinned: false,
      },
      comments: [],
      newCommentBody: '',
      setNewCommentBody: vi.fn(),
      loading: false,
      isPosting: false,
      handleAddComment: vi.fn(),
      handleReport: vi.fn(),
      reportTarget: null,
      setReportTarget: vi.fn(),
      submitReport: vi.fn(),
      handleDeletePost: vi.fn(),
    });

    const { container } = renderWithRouter('p1');

    const bodyDiv = container.querySelector('.prose');
    expect(bodyDiv).toBeInTheDocument();
    expect(bodyDiv?.innerHTML).toContain('<p>Safe content</p>');
    expect(bodyDiv?.innerHTML).not.toContain('<script>');
  });

  it('renders allowed HTML tags in post body', () => {
    const mockUsePostPostDetails = usePostDetails as any;
    mockUsePostPostDetails.mockReturnValue({
      post: {
        id: 'p2',
        title: 'Rich Post',
        body: '<h2>Heading</h2><ul><li>Item</li></ul><blockquote>Quote</blockquote>',
        category: 'CARREIRA',
        authorId: 'user2',
        authorName: 'Maria',
        authorRole: 'MEMBRO_APOSENTADO',
        createdAt: new Date().toISOString(),
        reactions: {},
        pinned: false,
      },
      comments: [],
      newCommentBody: '',
      setNewCommentBody: vi.fn(),
      loading: false,
      isPosting: false,
      handleAddComment: vi.fn(),
      handleReport: vi.fn(),
      reportTarget: null,
      setReportTarget: vi.fn(),
      submitReport: vi.fn(),
      handleDeletePost: vi.fn(),
    });

    const { container } = renderWithRouter('p2');

    const bodyDiv = container.querySelector('.prose');
    expect(bodyDiv?.innerHTML).toContain('<h2>');
    expect(bodyDiv?.innerHTML).toContain('<ul>');
    expect(bodyDiv?.innerHTML).toContain('<blockquote>');
  });
});
