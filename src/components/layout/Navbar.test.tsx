import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';
import { vi } from 'vitest';

// Mock the services since they connect to Firebase
vi.mock('../../services/notificationService', () => ({
  notificationService: {
    subscribeToUnreadNotifications: vi.fn((uid, cb) => {
      // Simulate calling the callback with 0 unread initially
      cb(0);
      return vi.fn(); // Mock unsubscribe
    })
  }
}));

vi.mock('../../services/adminService', () => ({
  adminService: {
    subscribeToPendingRequests: vi.fn((cb) => {
      // Return 0 pending initially
      cb(0);
      return vi.fn(); // Mock unsubscribe
    })
  }
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('Navbar', () => {

  const regularMemberProfile: any = {
    id: 'user1',
    name: 'João Silva',
    email: 'joao@example.com',
    role: 'MEMBRO_ATIVO',
  };

  const adminProfile: any = {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  it('does not render admin panel link for regular members', () => {
    renderWithRouter(<Navbar profile={regularMemberProfile} />);
    
    // Check role is displayed
    expect(screen.getAllByText('Membro')).not.toHaveLength(0);
    
    // Query for the admin title element
    expect(screen.queryByTitle(/Painel Admin/i)).not.toBeInTheDocument();
  });

  it('renders admin panel link for admin members', () => {
    renderWithRouter(<Navbar profile={adminProfile} />);

    // Check role is displayed
    expect(screen.getAllByText('Admin')).not.toHaveLength(0);
    
    // Query for the admin title element
    expect(screen.getByTitle(/Painel Admin/i)).toBeInTheDocument();
  });
});
