# Design QA: Global Theme, Context Bar, and Liquid Navigation

## Comparison Target

- Source visual truth:
  - `qa/reference-context-bar.png` (copied from the supplied contextual-bar screenshot)
  - `qa/reference-selected-tab.png` (copied from the supplied selected-tab screenshot)
- Browser-rendered implementation:
  - `http://127.0.0.1:4180/ecomof-ai/?themeqa=20260810-2301#ecoscreen`
- Implementation screenshots:
  - `qa/theme-desktop-light-1440x900.png`
  - `qa/theme-desktop-dark-1440x900.png`
  - `qa/theme-mobile-light-390x844.png`
  - `qa/context-bar-light-1440.png`
  - `qa/liquid-tab-light-focused.png`
- Combined comparison input:
  - `qa/reference-implementation-comparison.png`

## Viewport And Normalization

- Desktop CSS viewport override: `1440 x 900`; in-app Browser viewport capture: `1196 x 896` pixels.
- Mobile CSS viewport override: `390 x 844`; in-app Browser viewport capture: `384 x 768` pixels.
- Source context-bar image: `2580 x 90` pixels. It was normalized to the same 1260-pixel comparison width as the implementation context-bar crop.
- Source selected-tab image: `256 x 78` pixels. It was normalized to `384 x 117`; the implementation crop was normalized to the same 117-pixel height.
- The in-app Browser normalizes screenshots to the visible browser panel, so QA judgments use the normalized focused crops rather than assuming a 1:1 device-pixel density.

## State

- Desktop light: EcoScreen selected, contextual search/action bar visible.
- Desktop dark: EcoScreen selected, contextual search/action bar visible.
- Mobile light: Catalysis selected, settings menu open with the Appearance segment expanded.
- Interactions tested: primary-tab selection, sliding indicator alignment, settings open/close, Appearance expansion, light/dark selection, dark-theme persistence after navigation/reload, and mobile hit testing.
- Console errors checked: `0` errors in the final browser pass.

## Full-View Comparison

- The erroneous black contextual bar in the source issue is absent in light mode. The implementation uses the shared warm canvas and a translucent warm surface, while preserving control boundaries.
- Dark mode is a distinct warm-charcoal token set rather than a reused light-theme object. Header, page, panel, card, border, text, muted text, and semantic accents remain visibly separated.
- Desktop and mobile captures show no positive horizontal overflow. Persistent header controls remain reachable.
- Different modules receive distinct semantic accents; EcoScreen uses olive, GasSep uses teal, Catalysis uses violet, and other modules use their assigned validation, amber, rose, or coral tones.

## Focused Region Comparison

- The selected tab preserves the reference's pale filled state while adding a fully oval glass container, translucent highlight, module-color border, and a separate sliding indicator layer.
- The active tab and indicator bounding boxes matched exactly after animation (`x` and `width` were equal in desktop and mobile checks).
- The contextual toolbar keeps the source control density but replaces the incorrect black strip with the global background language and a module-accent lower edge.
- Combined evidence: `qa/reference-implementation-comparison.png`.

## Required Fidelity Surfaces

- Fonts and typography: the interface retains the global `Inter`, `PingFang SC`, and `Noto Sans SC` body stack; weights, line heights, letter spacing, wrapping, and compact-control sizing remain stable in the checked states.
- Spacing and layout rhythm: nav height, oval rail padding, tab width, toolbar density, section spacing, and mobile wrapping remain stable. The moving indicator does not change tab dimensions.
- Colors and visual tokens: light and dark token sets are independent; text/background and panel/border contrast are stronger in dark mode; module accents separate workspaces without replacing the homepage palette.
- Image quality and asset fidelity: no source image or logo was replaced. Existing raster and logo assets remain unchanged; the liquid effect is an interaction surface, not a substitute for a source asset.
- Copy and content: no scientific content or module labels were removed. Existing Chinese-first terminology is unchanged.
- Icons and controls: existing icon-library assets remain aligned; the settings, language, theme, contact, and repository controls remain semantic and operable.
- Accessibility: selected states remain visible without relying only on color, focus outlines are retained, reduced-motion disables indicator movement, and the mobile settings menu is no longer occluded.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Accepted product adaptation: the selected-tab accent is module-specific instead of always using the reference's coral text. This directly supports the requested cross-module visibility and remains within the shared global palette.

## Comparison History

### Iteration 1

- Earlier P1: the light and dark theme constants referenced the same object, so light-mode contextual bars were treated as dark and rendered with a black background.
- Fix: separated `THEME_LIGHT` and `THEME_DARK`, restored persisted theme selection, and made contextual layers consume theme glass/panel tokens.
- Post-fix evidence: `qa/theme-desktop-light-1440x900.png`, `qa/theme-desktop-dark-1440x900.png`, and the context-bar pair in `qa/reference-implementation-comparison.png`.

### Iteration 2

- Earlier P1: on mobile, the settings menu was painted beneath the later contextual-header sibling. Taps on Appearance landed on the contextual bar and immediately closed the menu.
- Fix: raised `.nav-shell` above the contextual bar and kept paint isolation on `.nav-primary-rail` only.
- Post-fix evidence: the Appearance group remained visible and selectable at `390 x 844`; center-point hit testing resolved to the Appearance label; `qa/theme-mobile-light-390x844.png` records the expanded state.

### Iteration 3

- Recomparison found no remaining P0/P1/P2 mismatch. Desktop light, desktop dark, and mobile light states were retained as final evidence.

## Implementation Checklist

- [x] Independent light and dark themes
- [x] Theme persistence and functional Appearance control
- [x] Theme-adaptive contextual bars
- [x] Oval liquid-glass navigation container
- [x] Sliding, size-stable selection indicator
- [x] Module-specific accent contrast
- [x] Desktop and mobile visual checks
- [x] Console and horizontal-overflow checks
- [x] Focused source/implementation comparison

final result: passed
