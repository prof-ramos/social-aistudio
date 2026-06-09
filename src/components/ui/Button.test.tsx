import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button - active/hover states', () => {
  it('renders with active scale class', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button.className).toContain('active:scale-[0.97]');
  });

  it('renders primary variant with hover classes', () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button', { name: /primary/i });
    expect(button.className).toContain('hover:bg-asof-blue');
    expect(button.className).toContain('hover:shadow-md');
    expect(button.className).toContain('hover:-translate-y-px');
  });

  it('renders secondary variant with hover class', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button.className).toContain('hover:bg-ice');
  });

  it('renders ghost variant with hover classes', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button', { name: /ghost/i });
    expect(button.className).toContain('hover:bg-ice');
    expect(button.className).toContain('hover:text-navy');
  });

  it('renders danger variant with hover class', () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole('button', { name: /danger/i });
    expect(button.className).toContain('hover:bg-danger/90');
  });

  it('applies disabled styles when loading', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button', { name: /loading/i });
    expect(button).toBeDisabled();
  });

  it('applies disabled styles when disabled prop is passed', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button.className).toContain('disabled:opacity-80');
    expect(button.className).toContain('disabled:cursor-not-allowed');
  });
});
