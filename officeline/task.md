# Office Line — Design Context

## Design Context

### Users
Office Line serves a B2B audience in Algeria: companies looking for office supplies and equipment, distributors who need catalogues and product families, and professional buyers who need a fast path to a quote or a contact. The primary jobs are to understand the two business universes, find the right product family, verify credibility, and request a quotation.

The interface should support both quick scanning and deeper catalogue exploration. The homepage must make Bureautique and Equipements obvious within the first viewport, while navigation and calls to action should keep catalogue and quote access close at hand.

### Brand Personality
The working personality is **reliable, technical, and accessible**. The experience should feel established and capable without becoming cold: precise enough for professional purchasing, clear enough for a first-time visitor, and human enough to encourage contact.

### Aesthetic Direction
The chosen direction is **industrial premium**. Use the official Office Line palette as the visual anchor: navy for authority and structure, sky blue for clarity and information, and orange for action and energy. Prefer strong product photography, deliberate grids, asymmetric compositions, crisp editorial hierarchy, and restrained motion. The two business families should feel like distinct operational worlds while remaining part of one system.

The site should avoid generic startup aesthetics, purple or neon palettes, excessive glassmorphism, decorative 3D effects without meaning, discount e-commerce styling, and dense dashboard-like clutter. Rounded UI should be used sparingly and only where it improves interaction.

### Design Principles
1. **Make the business legible immediately.** Bureautique and Equipements are the primary navigation model and must be understandable before scrolling deeply.
2. **Turn credibility into evidence.** Use real product imagery, brand partnerships, years of activity, distributor reach, local presence, and clear contact information instead of vague marketing claims.
3. **Design for professional scanning.** Keep headings specific, controls predictable, catalogue paths short, and quote actions visible without making every element a primary button.
4. **Use brand color with hierarchy.** Navy establishes trust, sky blue supports information, and orange marks meaningful action; color should not replace text or structure.
5. **Respect multilingual access.** Preserve equivalent meaning across French, English, and Arabic, support RTL layouts, and avoid fixed-width text treatments that break when translations expand.
6. **Treat accessibility as production quality.** Target WCAG 2.2 AA practices: keyboard access, visible focus, readable contrast, meaningful labels and alternatives, semantic structure, and reduced-motion support.
7. **Use motion to explain change.** Prefer restrained reveal and carousel transitions that communicate state; never make essential content depend on animation.

### Implementation Context
- Stack: static HTML generated with Jinja2 by `build.py`.
- Languages: French, English, and Arabic with RTL support.
- Existing type pairing: Space Grotesk for display, Manrope for body, Cairo and IBM Plex Sans Arabic for Arabic, IBM Plex Mono for technical labels.
- Existing brand tokens: `#333366` navy, `#6699CC` sky blue, `#E8833B` orange, with tinted paper and ink neutrals.
- Existing interaction patterns: sticky header, mega navigation, scroll reveal, homepage family carousels, responsive mobile navigation, catalogue filtering, and contact/distributor flows.
- Asset rule: prefer local official or approved product imagery over fragile third-party image URLs.

### Assumptions To Revisit
The user did not provide additional preferences and requested autonomous decisions. Revisit the user priorities, references, anti-references, and accessibility target if stakeholder feedback becomes available. The current default is optimized for B2B trust, catalogue discovery, and quote conversion.
