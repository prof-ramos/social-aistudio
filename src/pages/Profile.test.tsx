import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { Profile } from './Profile';
import { useProfile } from '../hooks/useProfile';
import { ToastProvider } from '../components/ui/Toast';
import { vi } from 'vitest';

vi.mock('../hooks/useProfile');
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

const mockUseProfile = (overrides = {}) => ({
  user: mockUser,
  loading: false,
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
  isOwnProfile: true,
  handleSave: vi.fn(),
  savedPosts: [],
  userPosts: [],
  ...overrides,
});

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
  });

  it('shows public contact when showPhone is true for other users', () => {
    vi.mocked(useProfile).mockReturnValue(
      mockUseProfile({
        user: { ...mockUser, id: 'other-user', phone: '(61) 99999-9999', showPhone: true },
        isOwnProfile: false,
      })
    );

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
    vi.mocked(useProfile).mockReturnValue(
      mockUseProfile({
        user: {
          ...mockUser,
          id: 'other-user',
          phone: '(61) 99999-9999',
          email: 'test@example.com',
          showPhone: false,
          showEmail: false,
        },
        isOwnProfile: false,
      })
    );

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
    vi.mocked(useProfile).mockReturnValue(
      mockUseProfile({
        user: {
          ...mockUser,
          id: 'other-user',
          phone: '(61) 99999-9999',
          email: 'test@example.com',
          showPhone: true,
          showEmail: true,
        },
        isOwnProfile: false,
      })
    );

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
    vi.mocked(useProfile).mockReturnValue(
      mockUseProfile({ isEditing: true })
    );

    renderWithRouter(<Profile profile={mockProfile} />);

    expect(screen.getByText('Informações de Contato')).toBeInTheDocument();
    expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Este número é WhatsApp')).toBeInTheDocument();
    expect(screen.getByLabelText('Mostrar meu telefone publicamente')).toBeInTheDocument();
    expect(screen.getByLabelText('Mostrar meu e-mail publicamente')).toBeInTheDocument();
  });
});
