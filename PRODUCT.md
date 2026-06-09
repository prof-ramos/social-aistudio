# Product

## Register

product

## Users

Members of the ASOF diplomatic community — military and diplomatic professionals who use this platform to stay informed, share institutional updates, and coordinate with colleagues. They expect clarity and reliability over novelty. They range from senior officers to recently admitted members, accessing the platform on both desktop and mobile throughout the workday.

## Product Purpose

Social-ASOF is the internal social network for the ASOF community. It exists to give members a private, structured space to connect, share updates, and collaborate. Success means members check it regularly because the content and conversations are relevant — not because the interface demands attention.

## Brand Personality

Authority, calm, structure. The interface speaks with the restraint of a diplomatic brief: every element earns its place, no visual clutter, no decorative excess. It feels like a well-organized office, not a consumer app.

## Anti-references

- **Slack / Discord**: The generic SaaS dashboard template — dense sidebars, channel lists, notification badges everywhere. Our app has structure and hierarchy, not a firehose of messages competing for attention.
- **Corporate intranets**: Lifeless, dated government portals with no personality. Our app has warmth and identity — it's formal, not sterile.

## Design Principles

1. **Earned presence, not demanded attention** — Every notification, animation, and visual emphasis must justify itself. The interface doesn't shout; it informs. If something moves, it's because the user needs to see it.
2. **Structure is the aesthetic** — Sharp corners, clear hierarchy, restrained color. The visual system derives its character from order and consistency, not ornament. When in doubt, remove.
3. **Professional trust** — The interface must feel as reliable as the institution it serves. No broken states, no mysterious loading spinners, no unexplained errors. Every state has a clear, calm response.
4. **Dignified simplicity** — Simple is not the same as sparse. Every empty state, every label, every transition should feel deliberate. A sparse screen with a single clear action beats a dense screen with ten competing ones.
5. **Consistency over cleverness** — Use established patterns throughout. A button is always a Button, a card is always a Card, a confirmation is always a ConfirmDialog. Invent only when the pattern doesn't fit the problem.

## Accessibility & Inclusion

- WCAG 2.1 AA as baseline
- Minimum 44px touch targets for all interactive elements
- Visible focus rings on all focusable elements
- `prefers-reduced-motion` fully respected — all animations override to near-instant
- Dark mode supported via system preference and manual toggle
- Screen reader support via ARIA labels, live regions, and semantic HTML
- No information conveyed by color alone