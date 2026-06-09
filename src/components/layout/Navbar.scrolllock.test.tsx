import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';
import { vi } from 'vitest';

// Mock the services since they connect to Firebase
vi.mock('../../services/notificationService', () => ({
  notificationService: {
    subscribeToUnreadNotifications: vi.fn((uid, cb) => {
      cb(0);
      return vi.fn();
    })
  }
}));

vi.mock('../../services/adminService', () => ({
  adminService: {
    subscribeToPendingRequests: vi.fn((cb) => {
      cb(0);
      return vi.fn();
    })
  }
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('Navbar - scroll lock', () => {
  const regularMemberProfile: any = {
    id: 'user1',
    name: 'João Silva',
    email: 'joao@example.com',
    role: 'MEMBRO_ATIVO',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body styles
    document.body.style.cssText = '';
  });

  it('locks body scroll when mobile menu is opened', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navbar profile={regularMemberProfile} />);

    const menuButton = screen.getByLabelText('Abrir menu de navegação');
    await user.click(menuButton);

    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.width).toBe('100%');
  });

  it('unlocks body scroll when mobile menu is closed', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navbar profile={regularMemberProfile} />);

    const menuButton = screen.getByLabelText('Abrir menu de navegação');
    await user.click(menuButton);
    expect(document.body.style.position).toBe('fixed');

    const closeButton = screen.getByLabelText('Fechar menu');
    await user.click(closeButton);

    expect(document.body.style.position).toBe('');
    expect(document.body.style.width).toBe('');
  });
});
