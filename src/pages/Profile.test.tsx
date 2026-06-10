import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { Profile } from './Profile';
import { useUserProfile } from '../hooks/useUserProfile';
import { useUserContent } from '../hooks/useUserContent';
import { useEditProfile } from '../hooks/useEditProfile';
import { ToastProvider } from '../components/ui/Toast';
import { vi } from 'vitest';

vi.mock('../hooks/useUserProfile');
vi.mock('../hooks/useUserContent');
vi.mock('../hooks/useEditProfile');
vi.mock('../services/userService');

// Mock data
const mockUser = {
  id: 'user1',
  name: 'João Silva',
  email: 'joao@example.com',
  role: 'MEMBRO_ATIVO' as const,
  avatarUrl: '',
  bio: '',
  interests: '',
  currentPost: 'Embaixada de Roma',
  phone: '',
  phoneIsWhatsapp: false,
  showPhone: false,
  showEmail: false,
};

const mockProfile = {
  id: 'user1',
  name: 'João Silva',
  email: 'joao@example.com',
  role: 'MEMBRO_ATIVO' as const,
};

const renderWithRouter = (ui: React.ReactElement) =>
  render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        <ToastProvider>{children}</ToastProvider>
      </BrowserRouter>
    ),
  });

describe('Profile - Contact Fields (OFC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserProfile).mockReturnValue({
      user: mockUser,
      loading: false,
      isOwnProfile: true,
      isViewingOwnProfile: true,
    });
    vi.mocked(useUserContent).mockReturnValue({
      savedPosts: [],
      userPosts: [],
    });
    vi.mocked(useEditProfile).mockReturnValue({
      isEditing: false,
      setIsEditing: vi.fn(),
      editForm: {
        bio: '',
        avatarUrl: '',
        currentPost: '',
        interests: '',
        phone: '',
        phoneIsWhatsapp: false,
        showPhone: false,
        showEmail: false,
      },
      setEditForm: vi.fn(),
      saving: false,
      handleSave: vi.fn(),
    });
  });

  it('shows public contact when showPhone is true for other users', () => {
    vi.mocked(useUserProfile).mockReturnValue({
      user: { ...mockUser, id: 'other-user', phone: '(61) 99999-9999', showPhone: true },
      loading: false,
      isOwnProfile: false,
      isViewingOwnProfile: false,
    });

    render(
      <MemoryRouter initialEntries={['/perfil/other-user']}>
        <ToastProvider>
          <Routes>
            <Route path="/perfil/:id" element={<Profile profile={mockProfile} />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Contato')).toBeInTheDocument();
    expect(screen.getByText('(61) 99999-9999')).toBeInTheDocument();
  });

  it('hides phone and email for other users when showPhone/showEmail is false', () => {
    vi.mocked(useUserProfile).mockReturnValue({
      user: {
        ...mockUser,
        id: 'other-user',
        phone: '(61) 99999-9999',
        email: 'test@example.com',
        showPhone: false,
        showEmail: false,
      },
      loading: false,
      isOwnProfile: false,
      isViewingOwnProfile: false,
    });

    render(
      <MemoryRouter initialEntries={['/perfil/other-user']}>
        <ToastProvider>
          <Routes>
            <Route path="/perfil/:id" element={<Profile profile={mockProfile} />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText('Contato')).not.toBeInTheDocument();
    expect(screen.queryByText('(61) 99999-9999')).not.toBeInTheDocument();
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });

  it('shows phone and email for other users when showPhone/showEmail is true', () => {
    vi.mocked(useUserProfile).mockReturnValue({
      user: {
        ...mockUser,
        id: 'other-user',
        phone: '(61) 99999-9999',
        email: 'test@example.com',
        showPhone: true,
        showEmail: true,
      },
      loading: false,
      isOwnProfile: false,
      isViewingOwnProfile: false,
    });

    render(
      <MemoryRouter initialEntries={['/perfil/other-user']}>
        <ToastProvider>
          <Routes>
            <Route path="/perfil/:id" element={<Profile profile={mockProfile} />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Contato')).toBeInTheDocument();
    expect(screen.getByText('(61) 99999-9999')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows contact fields section in edit form', async () => {
    vi.mocked(useEditProfile).mockReturnValue({
      isEditing: true,
      setIsEditing: vi.fn(),
      editForm: {
        bio: '',
        avatarUrl: '',
        currentPost: '',
        interests: '',
        phone: '',
        phoneIsWhatsapp: false,
        showPhone: false,
        showEmail: false,
      },
      setEditForm: vi.fn(),
      saving: false,
      handleSave: vi.fn(),
    });

    renderWithRouter(<Profile profile={mockProfile} />);

    expect(screen.getByText('Informações de Contato')).toBeInTheDocument();
    expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Este número é WhatsApp')).toBeInTheDocument();
    expect(screen.getByLabelText('Mostrar meu telefone publicamente')).toBeInTheDocument();
    expect(screen.getByLabelText('Mostrar meu e-mail publicamente')).toBeInTheDocument();
  });
});
