---
name: Neural Nexus
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#ebb2ff'
  on-secondary: '#520072'
  secondary-container: '#b600f8'
  on-secondary-container: '#fff6fc'
  tertiary: '#f4f5ff'
  on-tertiary: '#2a303e'
  tertiary-container: '#d3d9ec'
  on-tertiary-container: '#585e6e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#f8d8ff'
  secondary-fixed-dim: '#ebb2ff'
  on-secondary-fixed: '#320047'
  on-secondary-fixed-variant: '#74009f'
  tertiary-fixed: '#dde2f5'
  tertiary-fixed-dim: '#c0c6d8'
  on-tertiary-fixed: '#151b29'
  on-tertiary-fixed-variant: '#414756'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  data-mono:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin: 40px
  container-max: 1440px
---

## Brand & Style

The brand personality of this design system is defined by "Synthetic Intelligence"—a blend of cold, high-performance computing and fluid, organic logic. It is designed to feel like a sentient interface that is always processing, always evolving. The target audience consists of power users, researchers, and tech enthusiasts who require high information density presented with cinematic clarity.

The visual style leverages **Glassmorphism** and **Futurism**. By utilizing translucent layers and refractive surfaces, the UI creates a sense of depth that mimics a holographic display. The aesthetic is anchored by extreme dark-mode surfaces, punctuated by "living" accents that pulse and glow, signaling that the AI is actively thinking or synthesizing data.

## Colors

The color palette is built on a foundation of "Deep Space" neutrals to minimize eye strain and maximize the pop of functional accents. The primary background is a deep obsidian, while container surfaces use a slightly lighter charcoal to establish hierarchy.

- **Primary (Cyan):** Used for active states, successful computations, and primary calls to action. It represents the "active" mind.
- **Secondary (Electric Violet):** Reserved for complex processing states, AI insights, and generative transitions. It represents "deep thought."
- **Accents:** High-vibrancy gradients between cyan and violet are used for progress bars and data streams to simulate energy flow.
- **Surface Strategy:** Use low-opacity white overlays (2-5%) on dark backgrounds to create the glass effect rather than solid grays.

## Typography

This design system utilizes a dual-font strategy to balance readability with technical aesthetics. 

**Inter** serves as the primary workhorse for the interface, ensuring that complex AI-generated responses remain legible at any size. Its neutral, geometric construction provides the "clean" look required for modern SaaS.

**Space Grotesk** is used as the "technical accent" font. It is applied to data visualizations, source citations, terminal-style logs, and metadata labels. The slight geometric quirks of Space Grotesk reinforce the futuristic, high-tech theme without sacrificing the professional tone of the system. All monospaced accents should be set in uppercase when used as labels to increase their "encoded" feel.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for primary dashboard structures to ensure a grounded, "control center" feel, transitioning to a fluid model for the internal content of chat threads and data streams.

The spacing rhythm is based on a 4px baseline grid. Large margins (40px+) are encouraged around primary AI responses to give the "intelligence" room to breathe, preventing the UI from feeling cluttered despite high data density. Gutters are kept wide at 24px to maintain clear separation between distinct modular widgets or "brain modules."

## Elevation & Depth

Hierarchy in this design system is achieved through **Glassmorphism** and light-based "Z-axis" indicators rather than traditional shadows.

1.  **Backdrop Blur:** All elevated containers must apply a 20px to 40px background blur.
2.  **Edge Illumination:** Instead of drop shadows, use 1px inner borders (strokes). On the top and left sides, use a higher opacity (15%) to simulate a light source from the upper-left. On the bottom and right, use lower opacity (5%).
3.  **Glow States:** Elements that are "processing" or "active" emit a soft, localized outer glow (15-30px spread) using the primary cyan or secondary violet colors at 20% opacity. This creates a "hovering" effect as if the UI is projected.

## Shapes

The shape language is "Refined Geometric." A base roundedness of **0.5rem (8px)** is used for standard components like buttons and input fields, providing a modern and approachable feel. 

Larger containers and "Glass" cards use **1rem (16px)** or **1.5rem (24px)** to soften the high-tech aesthetic and make the interface feel more like a sophisticated consumer product rather than a raw command-line tool. Thin, 1px borders are mandatory for all shapes to define their edges against the deep obsidian background.

## Components

- **Action Buttons:** Use a semi-transparent background with a 1px solid border. Primary buttons feature a subtle gradient fill (Cyan to Violet) with a high-contrast label.
- **Input Fields:** Styled as "hollow" boxes with a 1px charcoal border. Upon focus, the border transitions to cyan with a soft outer glow.
- **Intelligence Chips:** Used for tags or data categories. These use the monospaced font and a "data-pill" shape with a violet tinted background.
- **Glass Cards:** The primary container for content. Must feature a `backdrop-filter: blur()` and a very subtle linear gradient border to simulate light hitting the edge of glass.
- **Source Citations:** Displayed in small-caps Space Grotesk, housed in micro-cards with a secondary violet left-border accent.
- **Processing Indicator:** A glowing, indeterminate progress ring that cycles through a cyan-to-violet gradient, positioned near the AI's response area to signal "active synthesis."