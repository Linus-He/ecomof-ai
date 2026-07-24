# Product Design QA — Home Scientific Stage and Primary Navigation

## Scope

- Existing EcoMOF-AI homepage, Chinese mode.
- MOF descriptor 3D distribution redesigned from the supplied scientific-slide reference.
- Desktop primary navigation centered independently with equal tab widths and equal gaps.
- Light, dark, desktop, and mobile states retained without removing research content or chart interactions.

## Visual source of truth

- Reference: `/Users/linushe/Downloads/截屏 2026-07-24 23.46.00.png`
- Reference pixels: 2360 × 1068.
- Intended fidelity surfaces: large scientific title, equation-led explanation, dark ink/coral visual language, left-copy/right-visual composition, and a large interactive graphic.
- Intentional product adaptations: EcoMOF-AI typography and tokens remain intact; the reference's single theorem is replaced with the real MOF descriptor vector, normalization equation, variable definitions, real-data ranges, and the existing interactive 3D chart.

## Implementation evidence

- Desktop light: `/Users/linushe/.codex/visualizations/2026/07/24/019f9454-6fcc-7bf1-ac04-57e3003c95e8/product-design-home-refresh/descriptor-light-final.png`
- Desktop dark: `/Users/linushe/.codex/visualizations/2026/07/24/019f9454-6fcc-7bf1-ac04-57e3003c95e8/product-design-home-refresh/descriptor-dark-final.png`
- Mobile light: `/Users/linushe/.codex/visualizations/2026/07/24/019f9454-6fcc-7bf1-ac04-57e3003c95e8/product-design-home-refresh/descriptor-light-mobile-card.png`
- Navigation: `/Users/linushe/.codex/visualizations/2026/07/24/019f9454-6fcc-7bf1-ac04-57e3003c95e8/product-design-home-refresh/navigation-rail-after.png`
- Combined reference/implementation comparison: `/Users/linushe/.codex/visualizations/2026/07/24/019f9454-6fcc-7bf1-ac04-57e3003c95e8/product-design-home-refresh/descriptor-reference-vs-final.png`
- Desktop browser viewport: 1280 × 720; browser screenshot capture: 1037 × 717.
- Mobile browser viewport: 390 × 844.

## Comparison findings and corrections

1. The first dark-only composition did not establish an equally intentional light mode. A theme-luminance branch now adapts the full scientific stage: canvas, copy, equation, frame, axes, controls, legend, and emphasis colors.
2. The first desktop chart inspection showed the surface-area axis title too close to the right edge. Its label offset was moved inward and the final combined comparison confirms it remains readable.
3. The original navigation was visually shifted by unequal brand and utility areas, with inconsistent tab widths. The navigation now occupies an independent 760 px centered rail inside symmetric side constraints.
4. Runtime geometry at a 1440 px browser width measured all seven primary tabs at approximately 103.43 px and every adjacent center distance at 109.43 px, with a consistent 6 px gap.
5. At 390 × 844, the scientific stage stacks to one column. Body scroll width and client width both measured 384 px, so no horizontal overflow remains.

## Interaction and state checks

- Existing chart drag/rotation, wheel or tap zoom, point hover, and coloring controls remain wired.
- Switching from metal-node coloring to `dataGrade` visibly updates the active control.
- Theme control switches the scientific stage between explicit light and dark color schemes.
- The `#home-descriptor-3d` anchor resolves to the redesigned section.
- Desktop navigation retains seven routes; below 1180 px it becomes a horizontally scrollable row and centers the active tab.
- Browser console errors observed during the final light/dark and interaction pass: 0.

## Severity review

- P0 blockers: none.
- P1 major fidelity or interaction issues: none.
- P2 visible layout or clipping issues: none after correction.
- P3 polish notes: none remaining in the checked states.

final result: passed
