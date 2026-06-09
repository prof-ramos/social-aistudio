import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('preserves allowed tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
    expect(result).toContain('Hello');
  });

  it('removes dangerous tags like script', () => {
    const input = '<p>Safe</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>Safe</p>');
  });

  it('removes event handler attributes', () => {
    const input = '<p onclick="alert(1)">click me</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onclick');
  });

  it('preserves allowed attributes like href and class', () => {
    const input = '<a href="https://example.com" class="link" title="Example">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('href=');
    expect(result).toContain('class=');
    expect(result).toContain('title=');
  });

  it('removes disallowed attributes', () => {
    const input = '<a href="https://example.com" style="color:red">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('style=');
    expect(result).toContain('href=');
  });

  it('allows data attributes', () => {
    const input = '<span data-id="123">test</span>';
    const result = sanitizeHtml(input);
    expect(result).toContain('data-id="123"');
  });

  it('sanitizes img tags while keeping allowed attributes', () => {
    const input = '<img src="image.jpg" alt="desc" width="100" height="100" onerror="alert(1)">';
    const result = sanitizeHtml(input);
    expect(result).toContain('src=');
    expect(result).toContain('alt=');
    expect(result).not.toContain('onerror');
  });
});
