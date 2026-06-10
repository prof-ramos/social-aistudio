<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# brand

## Purpose
Brand identity components that render the ASOF logo and institutional visual elements. Used across authentication pages, navigation, and marketing surfaces.

## Key Files

| File | Description |
|------|-------------|
| `AsofLogo.tsx` | ASOF logo SVG component with optional size variants |
| `AuthShell.tsx` | Authentication page layout shell with centered branding |
| `BrandLockup.tsx` | Combined logo + wordmark lockup |
| `NavbarBrand.tsx` | Navbar-specific brand rendering with responsive logo |

## Tests

| File | Description |
|------|-------------|
| `AsofLogo.test.tsx` | Logo rendering and variant tests |

## For AI Agents

### Working In This Directory
- Brand components are used across auth pages, navbar, and public surfaces
- Logo variants should preserve the ASOF brand identity — do not modify SVG paths
- `AuthShell` wraps Login, ForgotPassword, and RegisterRequest pages
- Keep brand components focused on presentation; avoid embedding business logic

### Testing Requirements
- Test that all logo variants render without errors
- Verify `aria-label` attributes for accessibility

<!-- MANUAL: -->
