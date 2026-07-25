# Product Design QA — Homepage Scientific Narrative Refactor

## Scope

- EcoMOF-AI homepage, Chinese-first content.
- Replace the hero's orbit-style module illustration with a multi-objective scientific equation surface.
- Reframe the real-data explorer, gas-separation Pareto view, and validation framework as consistent left-formula/right-visual research stages.
- Merge repeated research-scenario, capability, limitation, and quick-start content into one research gateway.
- Preserve light/dark adaptation, responsive behavior, chart interactions, source counts, and workspace navigation.

## Source visual truth

- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_h23Soj/截屏2026-07-25 01.27.12.png` — legacy descriptor statistics and metal-filter section.
- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_XI2Rvk/截屏2026-07-25 01.27.34.png` — legacy gas Pareto section.
- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_zz3SiV/截屏2026-07-25 01.27.46.png` — legacy validation framework.
- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_E7n0xG/截屏2026-07-25 01.28.15.png` — overlapping research routes, limitations, and quick-start areas.
- `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_f5my3P/截屏2026-07-25 01.28.25.png` — legacy orbit-style hero visual.
- Style reference retained from the prior accepted homepage direction: left scientific explanation and equations, right large interactive visualization.

## Implementation evidence

- Intended implementation URL: `http://127.0.0.1:4174/ecomof-ai/`.
- Requested desktop comparison viewport: 1440 × 1000 CSS px, device scale factor 1.
- Implementation screenshot path: unavailable.
- Source/implementation density normalization: not performed because the implementation capture was blocked before navigation.
- State intended for comparison: desktop Chinese light mode, then dark mode and narrow responsive state.
- Automated evidence completed:
  - homepage-focused tests: 12 passed;
  - TypeScript check: passed;
  - production build: passed;
  - whitespace/error-marker check: passed.

## Full-view comparison evidence

Blocked. The Codex in-app browser rejected navigation to the local preview address under its browser security policy. No implementation screenshot was captured, so the full homepage composition, vertical transitions, and final rendered density cannot be compared honestly against the supplied screenshots.

## Focused-region comparison evidence

Blocked for the same reason. The following required regions still need rendered inspection:

- hero equation surface and four model tabs;
- descriptor explorer formula column and linked chart grid;
- gas Pareto formula column, pair tabs, chart, tooltip, and legend;
- validation equation column and five-node interactive chain;
- integrated research gateway, evidence boundary, and quick-start controls;
- light, dark, and narrow responsive states.

## Findings

- [Blocked] Browser-rendered visual evidence is unavailable.
  - Location: entire homepage.
  - Evidence: local preview navigation was rejected before the page loaded.
  - Impact: typography, formula wrapping, chart density, section rhythm, dark-mode contrast, and responsive overflow cannot receive a valid visual pass.
  - Required fix: open the current local implementation in an allowed browser surface or publish a temporary review build, then capture the same states and complete the comparison loop.

## Comparison history

- Pass 1: source screenshots opened and inspected; implementation was built and automated checks passed.
- Pass 1 blocker: local browser navigation rejected; no visual fixes can be claimed from rendered evidence.

## Required fidelity surfaces

- Fonts and typography: code-level hierarchy and KaTeX integration completed; rendered fidelity not verified.
- Spacing and layout rhythm: shared stage and transition system implemented; rendered fidelity not verified.
- Colors and visual tokens: all new surfaces use semantic theme tokens for light/dark adaptation; rendered contrast not verified.
- Image quality and asset fidelity: the low-age orbit illustration was removed; no replacement raster asset is required because the new hero is a live equation interface. Rendered fidelity not verified.
- Copy and content: source counts, warnings, routes, formulas, and interaction labels remain present; automated tests passed.

final result: blocked
