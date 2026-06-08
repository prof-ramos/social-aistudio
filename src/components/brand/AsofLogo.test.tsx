import { render, waitFor } from '@testing-library/react';
import { AsofLogo } from './AsofLogo';

const LOGO_SVG = '<svg viewBox="0 0 508 304" class="asof-logo"><title>Logo</title></svg>';
const MARK_SVG = '<svg viewBox="248 -2 156 159" class="asof-logo"><title>Mark</title></svg>';

beforeEach(() => {
  global.fetch = vi.fn((input: RequestInfo) => {
    const url = String(input);
    if (url.includes('favicon.svg')) {
      return Promise.resolve({ ok: true, text: () => Promise.resolve(MARK_SVG) } as Response);
    }
    return Promise.resolve({ ok: true, text: () => Promise.resolve(LOGO_SVG) } as Response);
  });
});

describe('AsofLogo', () => {
  it('renders the institutional logo markup', async () => {
    const { container } = render(<AsofLogo theme="light" />);
    await waitFor(() => {
      expect(container.querySelector('svg[data-theme="light"]')).toBeTruthy();
    });
  });

  it('applies dark theme when requested', async () => {
    const { container } = render(<AsofLogo theme="dark" variant="mark" />);
    await waitFor(() => {
      expect(container.querySelector('svg[data-theme="dark"]')).toBeTruthy();
    });
  });

  it('crops wordmark variant to the upper brand block', async () => {
    const { container } = render(<AsofLogo theme="light" variant="wordmark" />);
    await waitFor(() => {
      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 508 156');
    });
  });
});