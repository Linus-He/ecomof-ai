# EcoMOF-AI Apple-inspired global surface audit

Date: 2026-08-12

This folder contains a read-only design audit of the current site and three visual design concepts. No production source code was changed for this audit.

## Current-state evidence

- `current/01-overview-hero.png` and `current/02-overview-full.png`
- `current/03-ecoscreen-full.png` and `current/04-ecoscreen-viewport.png`
- `current/05-gassep-viewport.png` and `current/06-gassep-full.png`
- `current/07-catalysis-viewport.png` and `current/08-catalysis-full.png`
- `current/09-library-viewport.png` and `current/10-library-full.png`
- `current/11-methodology-viewport.png` and `current/12-methodology-full.png`
- `current/13-evolution-viewport.png` and `current/14-evolution-full.png`
- `current/15-compliance-viewport.png`

## Visual concepts

- `concepts/01-global-home-liquid-functional-layer.png`
- `concepts/02-gassep-scientific-workbench.png`
- `concepts/03-methodology-editorial-layout.png`

## Recommended system

### Material hierarchy

1. Liquid Glass: top navigation, sticky contextual toolbar, segmented controls, popovers and transient actions only.
2. Standard surface: page background, main scientific panels, charts, equations, tables and provenance content.
3. Emphasis surface: selected record, evidence boundary and one primary action per view.

### Radius scale

- `--radius-control: 12px`
- `--radius-panel: 18px`
- `--radius-region: 22px`
- `--radius-capsule: 999px`

Keep nested radii concentric: `inner radius = outer radius - internal gap`.

### Spacing scale

- 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 px
- Page gutters: 32px desktop, 24px compact, 16px mobile
- Major section gaps: 48-72px on editorial pages; 24-32px in dense workbenches

### Control heights

- Compact data filter: 36px visual height with at least 44px hit target
- Standard button/input: 44px
- Prominent action: 48px
- Top navigation capsule: 56-60px desktop; compact/shrinking state while scrolling

### Motion

- Selection glide: 260-320ms, cubic-bezier(0.22, 1, 0.36, 1)
- Hover/press: 140-180ms
- Popover/inspector: 220-260ms
- Prefer opacity and small translation; avoid blur animation and large spring bounce
- Provide reduced-motion and reduced-transparency fallbacks

## Page priorities

1. Build shared surface/control tokens and a glass functional-layer primitive.
2. Refactor GasSep and MOF Library toolbars.
3. Convert Methodology and Compliance from boxed-card stacks to editorial continuous layouts.
4. Apply the shared pattern to Catalysis and EcoScreen.
5. Finish Home and Project Evolution after the core component system is stable.
