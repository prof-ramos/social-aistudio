# Design System - Social-ASOF

## Typography

- **Primary (Body):** Sans-serif (system default / Inter). Used for all body text, paragraphs, and functional UI elements.
- **Headings & Branding:** Serif (`font-serif`). Used for the main application logo, page titles, and prominent section headers to provide an editorial and authoritative feel.

## Color Palette

- **Navy:** The primary brand color. Used for the main navigation bar (`bg-navy`), primary text headings (`text-navy`), and active interactive elements to establish a strong, professional hierarchy.
- **Ice:** The global background color (`bg-ice`) for main scrollable areas. It provides a soft, cool contrast that allows white content cards to pop.
- **Slate:** The secondary text color (`text-slate`). Utilized for descriptions, subtitles, empty state messaging, and subtle metadata.
- **Border Gray:** The standard color for structural borders (`border-border-gray`) on cards, inputs, and dividers.
- **White:** Used exclusively for elevated component backgrounds (like post and details cards) and typography that sits on top of Navy backgrounds.

## Spacing & Layout

- **Spacing Scale:** Strictly adheres to a standard 4px/8px modular increment scale.
- **Global Layout:**
  - **Navbar:** Fixed height of 64px (`h-16`).
  - **Main Content Area:** Padded uniformly with 64px (`p-16` / 4rem) to maintain expansive, breathable margins.
  - **Reading Width:** Content is constrained to a maximum width of `max-w-5xl` to ensure optimal readability on desktop monitors.
  - **Vertical Rhythm:** A standard structural gap of 32px (`gap-8`) is enforced between primary sections and cards.

## UI Patterns

- **Empty States:** Designed to be elegant rather than purely functional. They utilize a white background, a dashed border (`border-dashed`), a large, low-opacity Navy icon (`opacity-20`), a bold Serif title, and centered Slate informative text.
- **Content Cards:** Clean structural containers featuring a solid white background, 1px solid `border-gray` borders, and generous internal padding.
- **Alignment:** Content aligns vertically with a strong emphasis on centering inside empty states, while reading content relies on natural left-alignment.
