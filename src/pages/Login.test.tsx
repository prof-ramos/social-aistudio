import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Login } from './Login';
import { authService } from '../services/authService';
import { vi } from 'vitest';

vi.mock('../services/authService', () => ({
  authService: {
    signIn: vi.fn(),
  },
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(ui, { wrapper: BrowserRouter });
};

describe('Login - password toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles password input from password to text type', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login />);

    const passwordInput = screen.getByLabelText('Senha') as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /mostrar senha/i });

    expect(passwordInput.type).toBe('password');

    await user.click(toggleButton);

    expect(passwordInput.type).toBe('text');
    expect(screen.getByRole('button', { name: /ocultar senha/i })).toBeInTheDocument();
  });

  it('toggles back to password type on second click', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login />);

    const toggleButton = screen.getByRole('button', { name: /mostrar senha/i });

    await user.click(toggleButton);
    await user.click(toggleButton);

    const passwordInput = screen.getByLabelText('Senha') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
  });

  it('renders correct aria-label for toggle state', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login />);

    const toggleButton = screen.getByRole('button', { name: /mostrar senha/i });
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);

    const newToggleButton = screen.getByRole('button', { name: /ocultar senha/i });
    expect(newToggleButton).toBeInTheDocument();
  });
});

describe('Login - submit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits email and password to authService.signIn', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login />);

    const emailInput = screen.getByLabelText('E-mail');
    const passwordInput = screen.getByLabelText('Senha');
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    await user.type(emailInput, 'test@asof.org');
    await user.type(passwordInput, 'senha123');
    await user.click(submitButton);

    expect(authService.signIn).toHaveBeenCalledWith('test@asof.org', 'senha123');
  });
});
