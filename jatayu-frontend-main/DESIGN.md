# Design System: Jatayu
**Project ID:** Jatayu / jatayu-frontend-main

## 1. Visual Theme & Atmosphere
Jatayu embodies an **authoritative, high-performance, editorial-cyberpunk aesthetic** tailored for high-stakes expert consultations. The interface harmonizes industrial precision with warm human craft, balancing dark bunker surfaces (`#080A10`, `#0B0D14`) with crisp studio white surfaces (`#FFFFFF`) and vibrant pomegranate fire accents (`#E53B17`, `#D63614`).

- **Mood:** Premium, disciplined, architectural, and tactile.
- **Density:** High-information density balanced with generous structural breathing room (4-column grid, 24px container padding, strict modular scale).
- **Signature Motifs:** 
  - Asymmetric angled polygon header & footer banners (`clip-path` cuts).
  - Chamfered corner silhouette cards with 45-degree corner bevels.
  - Centered diamond rule dividers adorned with the signature `✦` star glyph.
  - Glowing live status indicators, pulse rings, and tactile micro-interactions.

---

## 2. Color Palette & Roles

### Dark Bases & Ink Surfaces
- **Obsidian Bunker (`#080A10`):** Used for foundational canvas backgrounds, active call rooms, modal overlays, and deep contrast headers.
- **Midnight Ink (`#0B0D14`):** Primary text color on light surfaces, angled polygon headers, and structural card roofs.
- **Shark / Woodsmoke (`#14171D`, `#21242B`):** Elevated dark surfaces, floating control docks, and dark panel containers.
- **Tuna Charcoal (`#34363B`):** Subtle border strokes and secondary separators on dark themes.

### Brand Accents & State Colors
- **Pomegranate Red-Orange (`#E53B17`):** Primary brand accent, primary CTA buttons, active state outlines, and focus rings.
- **Thunderbird Flame (`#D63614`):** Hover and pressed states for primary action triggers and gradient overlays.
- **Tango Ember (`#E9681E`):** Secondary gradient stops and warm highlight elements.
- **Emerald Green (`#34C759` / `#10B981`):** Positive delta badges, verification badges, active connection indicators, and payment success states.
- **Amber Gold (`#FFBC09` / `#F59E0B`):** Star ratings, credit badges, and waiting room countdown timer rings.

### Surface Lights & Neutrals
- **Pure Studio White (`#FFFFFF`):** Card bodies, content containers, and elevated modal sheets.
- **Gallery Canvas (`#F0F0F0`):** Section background wrappers and page backdrops.
- **Mercury Gray (`#E6E6E6` / `#E2E8F0`):** Standard component borders, card dividers, and neutral button strokes.
- **Seashell Tint (`#F1F1F1` / `#F8FAFC`):** Table headers, inactive filter chips, input fields, and radio card hover backdrops.
- **Light Pomegranate Mist (`color-mix(in srgb, #E53B17 8%, #FFFFFF)`):** Sent chat bubbles, active radio selections, and highlighted conversation rows.

### Editorial Grays & Typography Scales
- **Scorpion Charcoal (`#5E5E5E`):** Secondary body text, subtitle descriptions, and form labels.
- **Dove Gray (`#686868`):** Meta labels, date indicators, and subdued helper text.
- **Silver Chalice (`#9E9E9E` / `#CCCCCC`):** Inactive star ratings, placeholder text, and muted icon glyphs.

---

## 3. Typography Rules

### Display & Headlines
- **Font Family:** `Sora`, `sans-serif` (`--font-display` / `--font-sora`)
- **Character:** Sharp, geometric, and modern with architectural authority.
- **Hierarchy:**
  - **Hero / Page Titles:** `font-weight: 600` to `700`, `letter-spacing: -0.05em`, uppercase accents, compact line height (`0.95`–`1.15`).
  - **Section & Card Titles:** `font-weight: 600`, `font-size: 18px`–`24px`, `letter-spacing: -0.02em`.

### Body & Interface Copy
- **Font Family:** `Inter`, `system-ui`, `sans-serif` (`--font-body` / `--font-inter`)
- **Character:** Ultra-clean, neutral, and readable across all display scales.
- **Hierarchy:**
  - **Primary Body:** `font-size: 14px`–`15px`, `line-height: 1.55`, `font-weight: 400`–`500`.
  - **Labels & Form Headers:** `font-size: 12px`–`13px`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.03em`.

### Monospace & Data Metrics
- **Font Family:** `IBM Plex Mono`, `monospace` (`--font-mono` / `--font-ibm-plex-mono`)
- **Character:** Technical, precise, financial-editorial fidelity.
- **Usage:** Numerical readouts, countdown timers, price tags, timestamp metadata, header badge tickers, and KPI values.

---

## 4. Component Stylings

### Buttons & Interactive CTAs
- **Primary Action (Continue / Submit):**
  - **Shape:** Pill-shaped (`border-radius: 999px` / `30px`) or angled architectural button.
  - **Fill:** Solid Pomegranate (`#E53B17`) with white bold text (`font-family: var(--font-display)`).
  - **Shadow:** Warm diffused glow (`0 7px 18px color-mix(in srgb, #E53B17 25%, transparent)`).
  - **Hover:** Slight vertical lift (`transform: translateY(-1px)`), darkening to Thunderbird (`#D63614`).
- **Secondary / Outline Action:**
  - **Shape:** Pill-shaped (`border-radius: 999px`).
  - **Fill:** Crisp White (`#FFFFFF`) with Mercury border (`1px solid #E6E6E6`) and Ink text.
- **Tertiary Minimalist CTA:**
  - **Typography:** Capslock, Orange Pomegranate (`#E53B17`), `font-family: var(--font-display)`, `letter-spacing: 0.05em`.
  - **Adornments:** Trailing directional arrows (`ArrowRight`).

### Cards & Containers
- **Signature Chamfered KPI Cards:**
  - **Geometry:** Custom multi-point angled chamfer (`clip-path: polygon(...)`) with beveled top-left and right corners.
  - **Surface:** Pure White (`#FFFFFF`) with 1px Mercury outline (`#E6E6E6`).
  - **Hover:** Subtly shifts to Seashell (`#F1F1F1`) with border depth.
- **Standard Dashboard Cards:**
  - **Geometry:** Smoothly rounded corners (`border-radius: 14px`).
  - **Surface:** Pure White (`#FFFFFF`) with 1px Mercury border and optional soft drop shadow (`0 1px 3px rgba(0,0,0,0.04)`).
- **Angled Header / Footer Poly-Banners:**
  - **Header Clip-Path:** `polygon(0% 25%, 4% 0%, 96% 0%, 100% 25%, 100% 100%, 0% 100%)`.
  - **Footer Clip-Path:** `polygon(0% 0%, 100% 0%, 100% 70%, 96% 100%, 4% 100%, 0% 70%)`.
  - **Fill:** Dark Midnight Ink (`#080A10` / `#0B0D14`) with crisp uppercase monospace labels and dotted separator rules.

### Inputs & Forms
- **Text Inputs & Textareas:**
  - **Border:** 1px solid Mercury (`#E2E8F0`), rectangular or subtly rounded (`6px`–`8px`).
  - **Background:** Clean White (`#FFFFFF`) or Crisp Seashell (`#F8FAFC`).
  - **Focus State:** Pomegranate highlight stroke (`border-color: #E53B17`) with 2px soft outer glow (`box-shadow: 0 0 0 2px rgba(229, 59, 23, 0.12)`).
- **Time Picker & Pickers:**
  - **Material UI Theme Integration:** Native `#0B0D14` primary ink palette, `#E53B17` focus accents, zero-radius or subtle 4px corner radii.

### Chat & Live Video Overlays
- **Seeker Outgoing Bubbles:**
  - **Fill:** Light Pomegranate Mist (`color-mix(in srgb, #E53B17 8%, #FFFFFF)` / `#FFF5F2`).
  - **Border:** Warm peach stroke (`1px solid color-mix(in srgb, #E53B17 22%, #E5E7EB)`).
  - **Corners:** Asymmetric conversational bubble (`border-radius: 14px 0px 14px 0px`).
- **Expert Incoming Bubbles:**
  - **Fill:** Slate Seashell (`#F1F5F9`), `border: 1px solid #E2E8F0`, `border-radius: 0px 14px 0px 14px`.
- **System Announcement Bubbles:**
  - **Fill:** Pure White (`#FFFFFF`), `border: 1px solid #E2E8F0`, with dark system shield avatar badge.

---

## 5. Layout Principles & Grid System

- **Max Width:** `1440px` (`--maxw: 1440px`) centered on desktop with `24px` gutter padding (`--pad: 24px`).
- **Grid Architecture:** 4-Column Core Grid (`--grid-cols: 4`, `--grid-col: 348px`), adapting to 2 columns on tablets and 1 column on mobile.
- **Vertical Rhythm:** Modular spacing system using `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, and `64px`.
- **Rule Lines & Separators:**
  - Thin 1px rule lines (`color-mix(in srgb, var(--ink) 14%, transparent)`).
  - Decorative diamond separators featuring centered `✦` four-point star glyphs on white pill backdrops.
- **Layering & Depth:**
  - Backdrops use rich dark blur glassmorphism (`backdrop-filter: blur(8px)` with `rgba(8, 10, 16, 0.88)`).
  - Modals and floating sheets utilize high-elevation smooth shadows (`box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5)`).
