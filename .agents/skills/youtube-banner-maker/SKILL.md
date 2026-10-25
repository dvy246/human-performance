---
name: youtube-banner-maker
description: Use when designing, creating, or refactoring YouTube channel banners (channel art), converting amateur or ugly banners into studio-grade designs, generating responsive SVG banner templates, or ensuring strict compliance with YouTube TV, desktop, tablet, and mobile safe zones.
---

# YouTube Banner Maker: Studio-Grade Channel Art Skill

A comprehensive design and engineering skill for Gemini and agentic coders to convert amateur, messy, or outdated YouTube channel art into high-converting, $10,000-agency-grade banners.

---

## 1. Overview & The Core Moat

Most AI-generated and amateur banners fail because of three fatal flaws:
1. **Zero Safe-Zone Awareness**: Essential text and logos get cut off on mobile phones or obscured by channel profile avatars and action buttons.
2. **Outdated Aesthetic Slop**: Relying on 2012-era Fiverr cliches (plastic 3D ribbons, glossy bevels, chaotic rainbow gradients, generic "YOUR CHANNEL" headers).
3. **Empty Canvas Voids**: Slapping random clip-art stickers on the outer corners while leaving an awkward, uncomposed void in the center.

### The Studio Standard
A professional banner is **not a painting**; it is an **editorial billboard** for a media brand. It communicates:
- **Authority & Niche Positioning**: What the viewer gets in < 3 seconds.
- **Visual Sophistication**: Intentional typography, subtle ambient mesh lighting, restrained keylines, and high-contrast information density.
- **100% Responsive Integrity**: Guaranteed readability from a 6.1-inch smartphone screen to an 85-inch 4K television.

---

## 2. Mathematical Safe-Zone Geometry

Every YouTube banner must be built on a **2560 x 1440 px** master canvas (`viewBox="0 0 2560 1440"`). Different devices crop this canvas as follows:

| Device Viewport | Dimensions (W x H) | Coordinates on Master Canvas | Design Treatment |
|---|---|---|---|
| **TV Display** | `2560 x 1440 px` | Full canvas `(0, 0)` to `(2560, 1440)` | Atmospheric bleed, subtle ambient glows, extended grid lines |
| **Desktop Display** | `2560 x 423 px` | Centered horizontally: `y: 508.5 to 931.5` | Wide cinematic extensions, secondary metadata, tertiary accents |
| **Tablet Display** | `1855 x 423 px` | Centered horizontally: `x: 352.5 to 2207.5` | Supporting badge pills, framed visual containers |
| **Mobile & Safe Area** | **`1546 x 423 px`** | **`x: 507 to 2053`**, **`y: 508.5 to 931.5`** | **CRITICAL: ALL text, logos, face cutouts, and CTAs MUST live here** |

```
+-------------------------------------------------------------------------+ (0,0)
|                                                                         |
|                          TV BLEED BACKGROUND                            |
|                                                                         |
|        +-------------------------------------------------------+        | (y=508.5)
|        | DESKTOP EXTENSION (2560 x 423)                        |        |
|        |    +---------------------------------------------+    |        | (x=352.5) TABLET
|        |    | MOBILE & UNIVERSAL SAFE AREA (1546 x 423)   |    |    |   |
|        |    | [Kicker Tag]                                |    |    |   | (x=507)
|        |    | [MAIN HEADLINE / BRAND]       [Subject/Art] |    |    |   |
|        |    | [Tagline / Subtitle]                        |    |    |   |
|        |    | [Pills: Schedule • Topics • Proof]          |    |    |   | (x=2053)
|        |    +---------------------------------------------+    |    |   |
|        |    |                                             |    |    |   |
|        +-------------------------------------------------------+        | (y=931.5)
|                                                                         |
|                          TV BLEED BACKGROUND                            |
|                                                                         |
+-------------------------------------------------------------------------+ (2560, 1440)
```

> [!IMPORTANT]
> **The Golden Rule**: Any text, avatar face, or logo placed outside `x ∈ [507, 2053]` or `y ∈ [508.5, 931.5]` will be truncated on mobile devices, where over 70% of YouTube views originate.

---

## 3. The Banned Anti-Patterns ("Ugly Banner" Hall of Shame)

When reviewing or generating channel art, instantly eliminate these amateur red flags:

| Anti-Pattern | Why It Destroys Value | Studio Replacement |
|---|---|---|
| **2012 Glossy Waves & 3D Ribbons** | Looks like free Canva templates from 12 years ago; immediately signals low-effort content. | Clean architectural glassmorphism cards, subtle 1px keylines (`rgba(255,255,255,0.1)`), or Swiss grid rules. |
| **Empty Middle Void with Corner Stickers** | Causes visual disconnection; viewers' eyes wander aimlessly. | Centralized or rule-of-thirds focal anchor inside the 1546x423 safe zone. |
| **Raw Rainbow / Uncontrolled Gradients** | Muddy, cheap, and reduces text contrast. | Deep dark-matter foundations (`#08090d`, `#0f1117`) paired with a single vibrant accent radial mesh (`opacity: 0.25 - 0.4`). |
| **Generic Text ("YOUR CHANNEL / SUBSCRIBE")** | Zero value proposition; viewers do not subscribe to banners. | Clear positioning formula: **[Who] + [What You Deliver] + [Frequency / Credibility]**. |
| **Centered Default Sans-Serif Monoculture** | Looks unstyled and robotic. | Typographic pairing: Bold Display Sans or High-Contrast Editorial Serif paired with Monospace metadata chips. |
| **Full-Opacity Bright Neon Backgrounds** | Blinds the viewer and clashes with YouTube's interface dark/light modes. | Controlled dark or warm luxury cream backgrounds with surgical pop accents. |

---

## 4. The 7 Premium Banner Archetypes

Every channel belongs to one of seven distinct visual archetypes:

### 1. Executive Authority (C-Suite, Advisory, High-Ticket Consulting)
- **Palette**: Deep Charcoal/Slate (`#0f1115`), Warm Champagne Gold (`#d4af37`, `#f3e5ab`), Off-White (`#f8f9fa`).
- **Typography**: Refined Serif (`Georgia`, `Playfair Display`) + Tracked Sans (`Inter`, `Helvetica Neue`).
- **Signature Accents**: 1px horizontal golden keylines, minimalist category badge (`"BOARDROOM STRATEGY"`), discreet credibility metrics (`"$500M+ M&A ADVISORY"`).

### 2. Scale Agency & High-Growth (B2B, DTC, Performance Marketing)
- **Palette**: Obsidian Carbon (`#090a0f`), Hyper Cyan (`#00f0ff`), Cobalt Indigo (`#4f46e5`).
- **Typography**: Heavy Neo-Grotesk display (`900` weight, `-2px` letter spacing) + clean utility sans.
- **Signature Accents**: Data telemetry badges, growth pill chips (`"8-FIGURE DTC"`), subtle 45-degree linear velocity rules.

### 3. Creative Director & Swiss Modernist (Designers, Architects, Art Direction)
- **Palette**: High-contrast Monochrome (`#050505`, `#f5f5f5`) + International Bauhaus Red (`#ff3333`) or Safety Orange (`#ff5500`).
- **Typography**: Pure Swiss Grotesk (`Helvetica`, `Inter`, `Neue Haas`) with tight tracking and stark case contrast.
- **Signature Accents**: Grid coordinates, technical registration marks (`+`, `L-brackets`), asymmetric typographic framing.

### 4. Solo Founder & Cyber Systems (Micro-SaaS, AI Engineers, Indie Hackers)
- **Palette**: Pitch Black (`#05070a`), Electric Cyan / Terminal Green (`#38bdf8`, `#10b981`), Slate Grid (`#1e293b`).
- **Typography**: Bold Technical Sans (`system-ui`, `SF Pro`) + Monospace code readouts (`JetBrains Mono`, `Courier`).
- **Signature Accents**: Pulsing live status dot (`SYS.LIVE // AUTONOMOUS AGENTS`), syntax tech stack pills (`PYTHON`, `PYTORCH`, `LANGGRAPH`).

### 5. Creator Cutout & Breakout Frame (Personal Brands, Vloggers, Experts)
- **Palette**: Atmospheric duotone background with vibrant subject pop (e.g. moody mountain/cityscape + warm skin tones).
- **Typography**: High-impact condensed or punchy sans-serif.
- **Signature Accents**: Rounded card container with subject photo popping outside the top border, dynamic brush or halo backdrop, customized badge with creator title.

### 6. E-Com Growth Lab (Shopify Brands, Amazon FBA, DTC Operators)
- **Palette**: Deep Emerald / Midnight Slate (`#061412`, `#0b1c19`), Mint Neon (`#10b981`, `#34d399`).
- **Typography**: Geometric Sans display + tabular monospace numbers.
- **Signature Accents**: Currency badges, verified safe-area badge, supply-chain trajectory lines, KPI readouts.

### 7. Minimalist Editorial Studio (Visual Essays, Documentarians, Film)
- **Palette**: Warm Espresso / Muted Stone (`#141312`, `#1c1917`), Antique Gold (`#c59b27`), Stone Cream (`#fbf9f5`).
- **Typography**: Literary Serif display + spaced all-caps sans subheadings.
- **Signature Accents**: Framed fine-art window, film aperture markings (`"ARRI ALEXA // 50MM T1.5"`), GPS coordinates, publication volume markers (`"VOL. IV"`).

---

## 5. Visual Hierarchy & Typographic Recipe

Inside the `1546 x 423 px` safe zone, layout elements must strictly follow this visual rhythm:

```
[Layer 1: Category Kicker]     -> Font size: 10-12px | Letter-spacing: 2-3px | Caps | Muted accent or pill
[Layer 2: Channel Brand Title] -> Font size: 68-84px | Weight: 800-900 | High contrast | Tight tracking
[Layer 3: Value Proposition]   -> Font size: 14-16px | Weight: 500-600 | Clear niche summary
[Layer 4: Social Proof / Pills]-> Font size: 11-13px | Monospace or Caps | Schedule • Proof • Topics
```

### Layout Split Strategy (1546px Safe Width)
- **Left Content Block (Width: 65% ~ 950px)**:
  - Anchored at `x = 580` to `x = 600`
  - Vertical stack of Kicker -> Title -> Value Prop -> Credibility Pills.
- **Right Visual Anchor (Width: 35% ~ 500px)**:
  - Anchored at `x = 1450` to `x = 1500`
  - High-end architectural frame, film slide, data HUD card, or creator portrait cutout.

---

## 6. The Step-by-Step Transformation Workflow

When presented with an ugly or unoptimized banner:

### Step 1: Diagnostic Audit
1. Identify safe-zone violations (any text outside the central `1546 x 423` area).
2. Flag low-effort tropes (ribbons, bevels, cartoon stickers on yellow canvas, empty centers).
3. Extract core positioning information: Channel Name, Niche, Value Proposition, Schedule, Credibility.

### Step 2: Select the Dominant Archetype
Match the creator's content niche to one of the 7 archetypes:
- Agency/B2B -> *Scale Agency* or *Executive Authority*
- AI/Dev/Crypto -> *Solo Founder / Cyber Systems*
- Design/Creative -> *Creative Director (Swiss)*
- Lifestyle/Travel/Documentary -> *Cinematic Nomad* or *Minimalist Editorial*
- Personal Brand/Vlogger -> *Creator Cutout*

### Step 3: Map into Mathematical Coordinates
- Establish `viewBox="0 0 2560 1440"`.
- Build the ambient canvas (deep background + subtle TV bleed lighting).
- Place safe-zone container (`x="507" y="508.5" width="1546" height="423"`).
- Lay out the Left Content Block at `x="580"` and Right Visual Block at `x="1480"`.

### Step 4: Inject Parameterized Slots
Ensure the output SVG contains standardized replaceable tokens:
- `{{TITLE}}`: Channel / creator name
- `{{SUBTITLE}}`: One-sentence core value proposition
- `{{KICKER}}`: Micro category tag
- `{{PILL_1}}`, `{{PILL_2}}`: Topics, proof, or schedule
- `{{ACCENT_COLOR}}`: Hex or gradient ID

---

## 7. Supporting References & Templates

- **[Safe Zone Math & Guides](references/design-rules-and-safe-zones.md)**: Detailed pixel coordinates, viewBox configuration, and device cropping rules.
- **[Archetype Catalog](references/archetype-catalog.md)**: Color hex tables, typography stacks, and styling rules for each archetype.
- **[Transformation Prompts](references/transformation-prompts.md)**: Plug-and-play prompts for Gemini to generate and transform banners.
- **[Parameter Schema](references/parameter-schema.json)**: JSON schema for automated templating pipelines.
- **[Production Templates Directory](templates/)**: Modular, validated SVG files ready for immediate use.
