# AI Explainer — Design Specification

**Date:** 2026-05-31
**Status:** Approved

## Overview

AI Explainer is a single-page interactive web application that explains artificial intelligence concepts through visual storytelling. It uses GSAP animations, a distinctive "Neon Abyss" dark aesthetic, and an interactive digit-recognition demo to make AI accessible and memorable.

## Architecture

```
index.html (single page, 6 sections)
├── css/
│   ├── reset.css        → CSS reset baseline
│   ├── variables.css    → Design tokens (colors, fonts, spacing)
│   └── main.css         → Component styles
├── js/
│   ├── vendor/
│   │   ├── gsap.min.js       → GSAP 3.x core
│   │   └── ScrollTrigger.min.js → Scroll-driven animations
│   ├── animations.js    → All GSAP timelines & ScrollTriggers
│   └── main.js          → UI logic, canvas demo, neuron viz
└── docs/superpowers/specs/
    └── 2026-05-31-ai-explainer-design.md
```

## Component Design

### 1. Particle Background
- Fixed Canvas element behind all content
- 80 particles with random velocities, sizes, colors
- Connection lines between nearby particles (distance < 120px)
- Colors: cyan (#00f0ff), magenta (#ff00e5), amber (#ffb800)
- Glow effect via concentric circles at reduced alpha

### 2. Navigation
- Fixed top bar, transparent initially
- On scroll > 50px: backdrop blur + dark background + border
- Logo: "AI_EXPLAINER" in Orbitron with cyan glow
- Links: smooth scroll to sections
- Theme toggle button (dark/light)

### 3. Hero Section
- Full viewport height
- Title: "AI EXPLAINER" — words stagger in with GSAP timeline
- Subtitle fades in
- CTA button with slide-reveal hover effect
- Scroll indicator with pulsing line animation

### 4. What is AI Section
- Two-column grid: text + neuron visualization
- Text paragraphs stagger in on scroll
- Neuron nodes: 11 positioned circles with GSAP scale-in
- Neuron lines: SVG-like divs with angle calculation, scaleX stagger

### 5. How it Works Section
- Three step cards in a row (1-column on mobile)
- Step numbers as large transparent digits
- GSAP stagger entrance with y-offset + fade

### 6. Key Concepts Section
- 4 concept cards: ML, DL, NLP, CV
- 3D card flip on hover (perspective + rotateY(180deg))
- Front: icon + title; Back: description
- GSAP entrance with y-offset + rotationX

### 7. Interactive Demo Section
- Two-column: canvas + info text
- 28×28 grid canvas for drawing digits
- Clear and Classify buttons
- Simulated classification with shape heuristics
- GSAP animated result reveal with confidence bar

### 8. Footer
- Simple centered credit text
- Fade in on scroll

## Data Flow

```
User → Scroll          → ScrollTrigger → GSAP animation → DOM update
User → Draw on Canvas  → pixelData[]    → Heuristics   → Classification result
User → Click Theme     → data-theme     → CSS Variables → Visual update
User → Click Nav Link  → scrollIntoView → Browser       → Section visible
```

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| --black-deep | #0a0a0f | Page background |
| --black-surface | #111118 | Card backgrounds |
| --cyan | #00f0ff | Primary accent, glow |
| --magenta | #ff00e5 | Secondary accent |
| --amber | #ffb800 | Tertiary accent |
| --font-display | Orbitron | Headings, logo, labels |
| --font-body | JetBrains Mono | Body text, UI |

## Testing Strategy

1. Visual inspection: open index.html in Chrome/Firefox/Edge
2. Scroll through all sections — animations trigger correctly
3. Draw digits on canvas — classification returns results
4. Toggle theme — all colors update
5. Resize browser — responsive layout adapts
6. Check console — no JS errors
