import { render } from '@testing-library/react';
import { AsofLogo } from './AsofLogo';

describe('AsofLogo', () => {
  it('renders the institutional logo markup', () => {
    const { container } = render(<AsofLogo theme="light" />);
    expect(container.querySelector('svg[data-theme="light"]')).toBeTruthy();
  });

  it('applies dark theme when requested', () => {
    const { container } = render(<AsofLogo theme="dark" variant="mark" />);
    expect(container.querySelector('svg[data-theme="dark"]')).toBeTruthy();
  });
});