import { render, waitFor } from '@testing-library/react';
import { AsofLogo, _resetSvgCache } from './AsofLogo';

const LOGO_SVG = '<svg viewBox="0 0 508 304" class="asof-logo"><title>Logo</title></svg>';
const MARK_SVG = '<svg viewBox="248 -2 156 159" class="asof-logo"><title>Mark</title></svg>';

let originalFetch: typeof global.fetch;

beforeEach(() => {
  _resetSvgCache();
  originalFetch = global.fetch;
  global.fetch = vi.fn((input: RequestInfo) => {
    const url = String(input);
    if (url.includes('favicon.svg')) {
      return Promise.resolve({ ok: true, text: () => Promise.resolve(MARK_SVG) } as Response);
    }
    return Promise.resolve({ ok: true, text: () => Promise.resolve(LOGO_SVG) } as Response);
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
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

  it('handles fetch failing with non-ok response', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 500 } as Response));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<AsofLogo theme="light" />);
    await waitFor(() => {
      expect(container.querySelector('svg')).toBeFalsy();
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('handles fetch throwing an error', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<AsofLogo theme="light" />);
    await waitFor(() => {
      expect(container.querySelector('svg')).toBeFalsy();
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});