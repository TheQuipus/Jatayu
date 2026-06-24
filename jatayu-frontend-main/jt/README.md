# Jatayu — Landing Page

A pixel-faithful recreation of the **Jatayu Landing Page (Riwa-inspired)** Figma design — _"Human wisdom for Indian decisions."_

Built as a static site with vanilla HTML, CSS, and JavaScript. Fonts, colors, typography, spacing, layout, content, and imagery are taken directly from the Figma source.

## Structure

```
index.html      # Page markup (12 sections + footer)
styles.css      # Design tokens + all section styling (responsive)
script.js       # Accordions, pricing toggle, live clocks, stat cards
assets/img/     # Photography & avatars exported from Figma
```

## Sections (top → bottom)

1. Hero — "Human wisdom for Indian decisions" + stats + CTA
2. Problem — "Important decisions should not feel lonely" + stat cards
3. Portfolio — Forge / Atlas / Rivet / Pulse / Foundry
4. Services (dark) — "Design Services That Drive Results" accordion + "Design that speaks for your brand"
5. Workflow — "Our Process from idea to impact"
6. Benefits — "Creative Partners who you can trust"
7. Testimonials (dark) — "Real Work. Real Words."
8. Pricing — "Our Plans" (per project / monthly toggle)
9. Team (dark) — "The Team Behind Your Projects"
10. FAQ — "Before You Start"
11. Insights — "Latest From Our Studio" (blog)
12. Contact (red) — "Ready to Start Your Next Project?" form

## Design tokens

- **Display:** Sora (SemiBold/Bold, uppercase, tight tracking)
- **Labels / mono:** IBM Plex Mono
- **Body:** Geist / Inter · **Stats:** Roboto
- **Key colors:** Bunker `#080A10`, Thunderbird `#D63614`, Gallery `#F0F0F0`, Scorpion `#5E5E5E`

## Run

Open `index.html` directly, or serve the folder:

```bash
npx serve .
```

Then visit the printed local URL.
