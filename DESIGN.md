---
title: Social-ASOF Design System
description: Design system for the Social-ASOF internal social network — a diplomatic-grade platform built for the ASOF community. Structured, authoritative, and calm.

# Target Audience & Personas

The Social-ASOF platform serves a membership base drawn from a sample of **1,750 records**, revealing two dominant personas that govern every design decision.

## Persona 1: The Veteran Public Servant (Retired)
- **Age:** 65-85 years old (born 1935-1955)
- **Status:** Retired; possession dates from the 1970s-1980s
- **Location:** Heavy concentration in Brasília (DF) and Rio de Janeiro (RJ)
- **Marital status:** Mostly married, widowed, or divorced
- **Digital behavior:** Accesses the internet primarily via mobile phone or tablet for news, benefits checks, and keeping in touch with former colleagues
- **Goals on the platform:**
  - Reconnect with former work colleagues
  - Stay informed on official association communications
  - Track pension, health plan, and benefit updates
  - Participate in discussions, events, and votes
- **Pain points:**
  - Difficulty with complex interfaces, small fonts, poor contrast
  - Low patience for confusing navigation flows or irrelevant notifications
  - Deep distrust of digital scams; demands clear privacy indicators
- **UX mandate:** Clean interface, legible large typography, high contrast, obvious navigation, zero technical jargon

## Persona 2: The Senior Public Servant (Active)
- **Age:** 50-65 years old (born 1960-1975)
- **Status:** Mid-career or approaching retirement
- **Location:** Mainly Brasília (DF), spread across state capitals
- **Digital behavior:** Regular smartphone user for banking, WhatsApp, and social media; time-constrained
- **Goals on the platform:**
  - Quickly access health plan, dependent, and paycheck data
  - Network with peers on career and association topics
  - Resolve bureaucratic tasks 100% digitally and fast
- **Pain points:**
  - Rejects tools that require too many clicks for simple tasks
  - Wants segmented, useful information — not a noisy "social feed"
- **UX mandate:** Efficient search, clear filters, one-tap access to "Dependents" and "Benefits", impeccable responsive mobile design

## Design Conclusion
> The membership list (with birth dates reaching back to the 1930s and possession dates from the 1960s-1980s) reinforces the need for **Inclusive Design Focused on Accessibility**. Recent interface changes — simplified navigation, removal of redundancies, increased contrast, and better topic structuring — are perfectly aligned with the needs of this predominantly senior audience. The interface must continue prioritizing **clarity over purely aesthetic elements** that could cause cognitive confusion.


# ---
# PRIMITIVE TOKENS
# ---

tokens:
  colors:
    navy:
      light: "#0D2A4A"
      dark: "#E7EDF4"
      description: "Primary brand color. Deep, authoritative blue used for headers, primary buttons, and key text. In dark mode, it inverts to a pale ice tone to maintain contrast."
    navy-dark:
      light: "#040920"
      dark: "#A0C8E4"
      description: "Deeper variant of navy for hover states, emphasis, and depth."
    navy-accent:
      light: "#0F172A"
      dark: "#374151"
      description: "Accent variant used for subtle backgrounds and elevated surfaces."
    sky:
      light: "#A0C8E4"
      dark: "#0D2A4A"
      description: "Soft sky blue for secondary accents, pinned post borders, and interactive highlights."
    sky-dark:
      light: "#82B4D6"
      dark: "#040920"
      description: "Deeper sky tone for hover and active states."
    ice:
      light: "#E7EDF4"
      dark: "#0F172A"
      description: "Background foundation. A cool, pale gray-blue that gives the interface an airy, institutional calm. In dark mode, it becomes a deep slate."
    slate:
      light: "#374151"
      dark: "#82B4D6"
      description: "Body text and secondary content. Warm gray with high readability."
    border-gray:
      light: "#D1D5DB"
      dark: "#1E293B"
      description: "Structural borders and dividers. Keeps layouts crisp without harsh contrast."
    danger:
      light: "#DC2626"
      dark: "#EF4444"
      description: "Error states, destructive actions, and critical alerts."
    success:
      light: "#16A34A"
      dark: "#22C55E"
      description: "Success states, confirmations, and positive feedback."
    warning:
      light: "#D97706"
      dark: "#F59E0B"
      description: "Warnings, pending states, and moderation flags."
    info:
      light: "#0284C7"
      dark: "#38BDF8"
      description: "Informational highlights and neutral accents."
    white:
      light: "#FFFFFF"
      dark: "#111827"
      description: "Card surfaces and elevated content. In dark mode, it becomes a deep charcoal."
    muted:
      light: "#4B5563"
      dark: "#94A3B8"
      description: "Secondary and metadata text. Meets WCAG AA contrast (≥4.5:1) on both white and ice backgrounds. Replaces opacity-based slate modifiers for readable secondary content."

  typography:
    font-sans:
      family: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif'
      weights: [400, 500, 600, 700]
      description: "Primary interface font. A humanist sans-serif with excellent readability at all sizes and a warm, professional feel. Used for body text, buttons, labels, and navigation."
    font-serif:
      family: '"Cormorant Garamond", ui-serif, Georgia, serif'
      weights: [700]
      description: "Display font. Used exclusively for page titles and brand headers. A high-contrast Garalde serif with dramatic weight variation that evokes formal authority and institutional gravitas."
    scale:
      display:
        size: "2.25rem"
        line-height: "2.5rem"
        font: "font-serif"
        weight: 700
        description: "Page titles (h1)."
      headline:
        size: "1.5rem"
        line-height: "2rem"
        font: "font-serif"
        weight: 700
        description: "Section headings (h2), post titles."
      title:
        size: "1.125rem"
        line-height: "1.5rem"
        font: "font-sans"
        weight: 700
        description: "Card titles, sub-headings (h3)."
      body:
        size: "1rem"
        line-height: "1.625rem"
        font: "font-sans"
        weight: 400
        description: "Body copy, descriptions, and long-form text. Baseline is 16px (1rem) minimum, scaling to 18px (text-lg) in feed for senior accessibility."
      label:
        size: "0.875rem"
        line-height: "1.25rem"
        font: "font-sans"
        weight: 700
        letter-spacing: "0.1em"
        text-transform: "uppercase"
        description: "Overlines, section labels, metadata, category tags. Always uppercase with wide tracking. Minimum 14px (0.875rem, text-sm) to ensure readability for the senior demographic."
      caption:
        size: "0.875rem"
        line-height: "1.25rem"
        font: "font-sans"
        weight: 500
        description: "Secondary metadata, timestamps, helper text. Minimum 14px (text-sm) with high contrast (opacity >= 80% or medium weight)."

  spacing:
    unit: "0.25rem"
    scale:
      0: "0rem"
      1: "0.25rem"
      2: "0.5rem"
      3: "0.75rem"
      4: "1rem"
      6: "1.5rem"
      8: "2rem"
      10: "2.5rem"
      12: "3rem"
      16: "4rem"
    page-padding:
      mobile: "1rem"
      tablet: "2rem"
      desktop: "4rem"
    gap:
      tight: "0.5rem"
      default: "1rem"
      relaxed: "2rem"

  radii:
    none: "0px"
    sm: "2px"
    default: "0px"
    md: "0px"
    lg: "0px"
    full: "9999px"
    description: "Border radius is deliberately minimal. Most cards, inputs, and surfaces use sharp corners (0px) to convey formality and structure. Only avatars and status indicators use full rounding."

  shadows:
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    default: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)"
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
    description: "Shadows are subtle and functional. Used primarily for elevated cards and dropdowns. In dark mode, shadows are suppressed or replaced with tonal elevation."

  elevation:
    base:
      background: "ice"
      border: "none"
      shadow: "none"
    default:
      background: "white"
      border: "1px solid border-gray"
      shadow: "none"
    elevated:
      background: "white"
      border: "1px solid border-gray"
      shadow: "sm"
    featured:
      background: "navy"
      text: "white"
      shadow: "sm"
    outlined:
      background: "ice"
      border: "1px solid border-gray"
      shadow: "none"

  motion:
    easing:
      default: "cubic-bezier(0.4, 0, 0.2, 1)"
      enter: "cubic-bezier(0, 0, 0.2, 1)"
      exit: "cubic-bezier(0.4, 0, 1, 1)"
    duration:
      instant: "0ms"
      fast: "150ms"
      normal: "200ms"
      slow: "300ms"
    description: "Transitions are quick and functional. Emphasis is on responsiveness, not spectacle. Prefers-reduced-motion is fully respected via media query overrides."

  z-index:
    dropdown: 40
    sticky: 50
    modal-backdrop: 50
    modal: 50
    toast: 60
    tooltip: 70
    description: "Semantic z-index scale. Dropdowns sit above content, sticky nav and modals share the same layer, toasts sit above modals, tooltips above toasts. Never use arbitrary values like 999 or 9999."

  breakpoints:
    sm: "640px"
    md: "768px"
    lg: "1024px"
    xl: "1280px"

# ---
# SEMANTIC TOKENS
# ---

semantic:
  surface:
    background: "ice"
    card: "white"
    elevated: "white"
    overlay: "navy/80"
    input: "white/50"
  text:
    primary: "navy"
    secondary: "slate"
    muted: "muted"
    inverted: "white"
    link: "navy"
    link-hover: "sky"
  border:
    default: "border-gray"
    focus: "navy"
    error: "danger"
    success: "success"
  status:
    success: "success"
    warning: "warning"
    error: "danger"
    info: "info"
    neutral: "slate"

---

# Social-ASOF Design System

## Overview

Social-ASOF is the internal social network for the ASOF diplomatic community. The design language reflects the values of the institution: **authority, calm, and structure**. Every visual decision — from the sharp-cornered cards to the serif display type — reinforces a sense of formal belonging and institutional trust.

The interface avoids trendy, playful aesthetics. Instead, it embraces a restrained palette of deep navy and pale ice, with generous whitespace and disciplined typography. This is not a consumer app; it is a professional workspace dressed with care.

## Visual Identity

### Color Philosophy

The palette is built on a single dominant hue — **navy** — used at varying depths to create hierarchy. Rather than competing with many accent colors, the system relies on tonal variation within the blue-gray family.

- **Navy** (#0D2A4A) is the anchor. It commands attention without aggression. It is used for the primary navigation bar, primary buttons, and page titles.
- **Ice** (#E7EDF4) is the canvas. It is the global background, giving the interface an open, breathable quality.
- **Sky** (#A0C8E4) is the accent. It highlights pinned content, active states, and interactive affordances.
- **Slate** (#374151) handles body text. It is warm enough to feel human, cool enough to feel professional.

The dark mode is not an afterthought. Colors are inverted systematically: navy becomes pale, ice becomes deep, and the hierarchy is preserved. This is a true dark theme, not a dimmed version of the light theme.

### Typography

The typographic pairing is the soul of the interface.

- **Cormorant Garamond** (serif) is used exclusively for display headings. A high-contrast Garalde serif with dramatic thin/thick transitions that introduces a sense of heritage and institutional gravitas.
- **Source Sans 3** (sans-serif) does everything else. Body text, buttons, labels, navigation. A humanist sans with warm terminals and excellent readability that complements the serif without competing.

Text sizing is designed for accessibility, recognizing the senior demographic of the ASOF community (65-85 years old).
- **Base font size is 16px** (`text-base`), scaling to 18px (`text-lg`) for primary reading areas like the feed.
- **Small text is restricted:** 14px (`text-sm`) is the absolute minimum allowed size, used only for metadata with high contrast. 12px (`text-xs`) is banned.
- **Line height:** Long-form text uses generous line spacing (`leading-relaxed`) to aid tracking for readers with presbyopia.
- **Contrast:** Low opacity (`opacity-50`) is avoided on text. Secondary text relies on `opacity-80` or medium font weights to remain legible.

Labels and metadata are set in **14px uppercase with wide letter-spacing** (`tracking-widest`). This creates a clear typographic separation between content and structure without compromising legibility.

### Shape & Elevation

The interface is predominantly **rectilinear**. Cards, inputs, buttons, and modals all use `0px` border radius. This sharpness conveys structure and permanence. The only exceptions are avatars, spinners, status indicators (full rounding `9999px`), and **chat message bubbles** (`rounded-sm` at 2px), which use subtle rounding as a deliberate contrast to distinguish conversational content from structural elements.

Elevation is achieved through **borders and subtle shadows**, not floating cards. A standard card has a 1px `border-gray` border. An elevated card adds a `shadow-sm`. There are no heavy drop shadows or glassmorphism effects.

### Institutional Gold Accent

The institutional gold (`#c4a35a` / `var(--app-institutional-gold)`) is a secondary brand accent used sparingly for active states and highlights. It appears in:

- Active navigation item background (`bg-institutional-gold/10`)
- Active filter pill highlight
- Navbar bottom shadow line
- Auth shell decorative elements

Gold is reserved for active/selected states — never for body text (insufficient contrast on white) or error states.

### Spacing & Layout

The layout is **centered and contained**. Most content sits inside `max-w-5xl` or `max-w-3xl` containers, giving generous side margins on large screens. The sidebar is fixed at `256px` and hidden on mobile.

Page padding scales with viewport:
- Mobile: `1rem`
- Tablet: `2rem`
- Desktop: `4rem`

Internal spacing uses a loose rhythm. Cards are separated by `2rem` gaps. Inside cards, padding is typically `1.5rem` (`p-6`).

### Motion & Feedback

Animations are **functional, not decorative**. A button hover changes background color over `150ms`. A toast slides in from the right over `200ms`. A skeleton pulses with `animate-pulse`.

The system fully respects `prefers-reduced-motion`. All animations are overridden to `0.01ms` for users who request reduced motion.

## Component Inventory

### Button

The workhorse interactive element. Four variants:
- **Primary**: `bg-navy text-white`. Used for the main call-to-action on any screen.
- **Secondary**: `border border-navy text-navy bg-transparent`. Used for secondary actions.
- **Danger**: `bg-danger text-white`. Used exclusively for destructive actions (delete, ban, remove).
- **Ghost**: `text-slate hover:bg-ice`. Used for icon buttons, toggles, and low-priority actions.

Sizes: `sm` (36px), `md` (44px), `lg` (48px). All sizes meet minimum touch target requirements.

Loading state renders a spinning indicator inside the button. Disabled state reduces opacity to 50%.

### Card

The primary content container. Four variants:
- **Default**: White background, 1px border. Standard container.
- **Elevated**: White background, 1px border, subtle shadow. Used for featured or primary content.
- **Featured**: Navy background, white text. Used for admin alerts, premium content, or calls-to-action.
- **Outlined**: Ice background, 1px border. Used for secondary panels and sidebars.

Padding scales: `none`, `sm` (1rem), `md` (1.5rem), `lg` (2rem).

### PageTitle

A semantic heading component using `font-serif` and `text-navy`. Automatically maps `h1` to `text-4xl`, `h2` to `text-3xl`, `h3` to `text-2xl`. Accepts an explicit `size` prop to override.

### Alert

Inline feedback component with a left icon. Variants: `error`, `success`, `warning`, `info`. Uses translucent backgrounds (`bg-color/5`) and matching borders (`bg-color/20`).

### StatusBadge

Small inline label for status indicators. Variants: `success`, `warning`, `error`, `info`, `neutral`. Uses `rounded-sm` (2px radius), uppercase optional, with a colored dot or icon prefix.

### Skeleton

Loading placeholder. A simple `animate-pulse` block with `bg-slate/10`. Used inside cards, tables, and lists. Always `rounded-none`.

### Breadcrumb

Navigation aid for deep pages. Uses `ChevronRight` separators. Current page is `text-navy` with `aria-current="page"`. Previous pages are links with hover underline. No background or border — it sits flush above the page title.

### Toast

Global notification system. Fixed to the bottom-right of the viewport. Toasts auto-dismiss after 4 seconds. Types: `success`, `error`, `info`, `warning`. Uses the same translucent background pattern as Alert. Slides in from the right with `animate-in slide-in-from-right`.

## Accessibility

The design system is built with **WCAG 2.1 AA as a baseline**, but operates with **AAA aspirations** where the senior demographic is concerned.

### Visual Accessibility
- All interactive elements have visible focus rings (`focus:ring-2 focus:ring-navy`).
- Touch targets are minimum **44x44px**; primary CTAs should be **48px** or larger.
- Inputs use **16px font size minimum** to prevent iOS zoom.
- Body text is **16px (1rem) minimum**, scaling to **18px (text-lg)** in reading areas.
- **Never use opacity below 80%** for text (`opacity-50`, `opacity-60` are banned); rely on `muted` token or `font-medium` for hierarchy.
- Color contrast ratios must pass **WCAG AA (4.5:1)** for all body text; aim for **7:1** on critical reading surfaces.

### Cognitive Accessibility
- The Skip Link pattern is implemented for keyboard navigation.
- **No jargon, acronyms, or technical IT terms** in UI copy. Use institutional, plain language.
- Core actions (Benefits, Dependents, Search, Profile) must be reachable in **3 taps or fewer**.
- Avoid "infinite scroll" feeds; use **paginated, categorized, or filterable** content lists.
- Modals trap focus and close on Escape.
- `aria-live` regions are used for dynamic content updates (chat, toasts).

### Trust & Security Signals
- Always explain **why** data is being requested when collecting input.
- Display visible privacy indicators (lock icons, "seu dado não será compartilhado" labels) on every data-collection flow.
- Provide a persistent, easy-to-find **"Fale Conosco"** or **"Ajuda"** entry point on every screen.
- An offline indicator (`role="status"`, `aria-live="polite"`) appears when connectivity is lost.

### Input & Interaction
- Dark mode respects `prefers-color-scheme` and can be toggled manually.
- Keyboard shortcuts are discoverable via a `?` overlay and include `/` (search), `n` (new post), `Esc` (close modals).
- All form errors are inline and descriptive; never rely on color alone (use icons + text).

## Keyboard Shortcuts

The app supports keyboard shortcuts for power users:

| Key | Action | Context |
|-----|--------|---------|
| `/` | Focus search | Global (not in inputs) |
| `n` | New post | Feed page (not in inputs) |
| `Esc` | Close modal/overlay | Global |
| `?` | Toggle shortcut overlay | Global (not in inputs) |

Shortcuts are discoverable via the `?` overlay and shown as hints in relevant UI elements (search placeholder, button titles).

## Dark Mode

Dark mode is implemented via CSS custom properties and a `.dark` class on `html`. The inversion logic is systematic:
- Surfaces that were white become deep charcoal (`#111827`).
- Surfaces that were ice become deep slate (`#0F172A`).
- Text that was navy becomes pale ice (`#E7EDF4`).
- Accents that were sky become deep navy (`#0D2A4A`).

No component needs dark-mode-specific code if it uses the theme tokens correctly.

## Usage Guidelines

### Do
- Use `PageTitle` for every major page heading.
- Wrap content in `Card` rather than arbitrary `div` containers.
- Use `Button` for all clickable actions — never style a raw `button` element.
- Use the 10px uppercase label style for metadata, categories, and section headers.
- Keep border radius at `0px` for cards, inputs, and buttons.

### Don't
- Introduce new accent colors outside the defined palette.
- Use rounded corners on cards or buttons.
- Use the serif font for body text or UI labels.
- Create custom shadows outside the defined `sm/md/lg` scale.
- Use `alert()` — always use the Toast system for feedback.

## File Structure

Components live in `src/components/ui/` and are exported via a barrel file (`index.ts`). Each component is a single file with its own interface definition. Styling is done exclusively with Tailwind utility classes referencing the theme tokens. No CSS-in-JS or inline styles are used.
