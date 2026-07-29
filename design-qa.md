# Design QA — detailed methodology and numbered compliance terms

## Visual sources

- Compliance workflow to remove: `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_7OGDLi/截屏2026-07-29 22.37.45.png`
- Compliance copy to rewrite: `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_oZs3Sq/截屏2026-07-29 22.38.33.png`
- Internal monospace labels to remove: `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_SqipEd/截屏2026-07-29 22.39.05.png`

## Implementation evidence

- `qa/compliance-numbered-implementation.png`
- `qa/compliance-clauses-natural-language.png`
- `qa/methodology-architecture-implementation.png`
- `qa/methodology-mobile-implementation.png`
- `qa/compare-compliance-workflow-removed.png`
- `qa/compare-compliance-natural-copy.png`
- `qa/compare-compliance-font-numbering.png`

The comparison images place each supplied reference beside the implemented page. The compliance page keeps the existing EcoMOF-AI colour, border, spacing, and typography system but removes the six-step control graphic, the internal `CCDC-01` style labels, and all tabular presentation. Its reading order is now a plain numbered document with publisher-source links beside the relevant explanation. The methodology page keeps the adjustable directory and adds detailed implementation blocks inside the existing card system.

## Interaction checks

- The compliance page directory jumps to scope, CCDC/CSD boundaries, publisher terms, authorization evidence, responsibilities, official documents, source registry, and dispute handling.
- Source registry filters remain interactive after the compliance rewrite.
- The compliance DOM contains no table, `CONTROL 01`, `CCDC-01`, or monospace numbered label.
- Every displayed licence group retains a direct publisher-source link and numbered clauses such as `3.1.1`.
- The methodology directory expands MOF Library, EcoScreen, Gas Separation, Catalysis, Organic Acid, shared evidence, and validation sections.
- Each module exposes a dedicated “实现方式与架构” destination covering inputs, processing, outputs, and failure boundaries.
- The methodology sidebar remains pointer-resizable on desktop and collapses to a single-column layout at compact widths.
- The unified release center records this scope separately as Web v1.0.12.

## Browser and visual checks

- In-app browser route: `http://127.0.0.1:4175/ecomof-ai/`
- Desktop viewport: 1440 × 1100.
- Compact viewport: 390 × 844.
- Compliance overview, publisher clauses, source registry filter, methodology architecture overview, and MOF Library architecture were inspected.
- Browser console: no warnings or errors.
- Document width matched the viewport; no horizontal overflow was introduced.
- At compact width the resize handle is removed and the method directory/content use the single-column layout.
- Visual iteration:
  1. Removed the six-card workflow because it competed with the legal reading order.
  2. Replaced database-style clause codes with ordinary hierarchical numbering.
  3. Rewrote the overview and clause introduction as direct Chinese instructions instead of promotional or self-certifying copy.
  4. Converted the methodology implementation table to numbered prose blocks so the page explains execution without a dense grid.
  5. Added database architecture, identifier indexes, field-level provenance, task algorithms, runtime empty states, and validation gates to the methodology.

## Automated verification

- Focused compliance and data regressions: passed.
- TypeScript: passed.
- Production build: passed.
- Visual route contract: browserless fallback passed because the sandbox blocked additional preview ports; the already-running in-app browser supplied the visual and interaction review.
- Full Vitest: 839/840 passed. The existing GasSep adaptation case timed out after its test-data request returned 404; the same case passed immediately when rerun alone.
- Diff checks: passed.

final result: passed
