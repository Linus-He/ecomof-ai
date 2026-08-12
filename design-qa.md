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

---

# Design QA: Shared Data-Hosting Notice, EcoScreen Width, And Project Evolution Draft

## Comparison Target

- Notice source screenshot: `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_g9OfCI/截屏2026-08-12 21.32.42.png`.
- Browser implementations: `outputs/data-hosting-notice-qa/ecoscreen-width-1440x1024.png`, `outputs/data-hosting-notice-qa/gassep-1440x1024.png`, and `outputs/data-hosting-notice-qa/catalysis-1440x1024.png`.
- Notice comparison input: `outputs/data-hosting-notice-qa/source-implementation-comparison.png`.
- Project Evolution source state: `outputs/project-evolution-concept/current-project-evolution-1440x1024.png`.
- Project Evolution concept: `outputs/project-evolution-concept/deepmind-project-evolution-draft.png`.
- Project Evolution comparison input: `outputs/project-evolution-concept/current-draft-comparison.png`.

## Viewports And State

- Browser checks used Chinese, light theme, and a `1440 x 1024` viewport for EcoScreen, GasSep, Catalysis, and the current Project Evolution route.
- EcoScreen was additionally checked at `1024 x 768` after the search/result-width report. At both widths, the contextual header and page body shared the same edges and the document had no positive horizontal overflow.
- The concept raster is `1486 x 1059`; comparison normalizes it into the source capture's `1440 x 1024` frame without changing its composition.

## Required Fidelity Surfaces

- Fonts and typography: the shared notice uses the site's body stack and a two-level `12.5/11.5px` hierarchy. The Project Evolution draft replaces dense dashboard typography with the accepted editorial display scale while preserving readable scientific labels.
- Spacing and layout rhythm: the three notices are a default single row, immediately below each module header and before the first work surface. EcoScreen search/header/body now share a `1320px` desktop reading grid with stable side margins and responsive full-width behavior below the cap.
- Colors and visual tokens: the compliance canvas now uses `var(--app-bg)` and `var(--app-panel)`, producing the measured warm-grey background rather than pure white. Notices derive their quiet surface and icon color from each module accent.
- Image quality and asset fidelity: the Project Evolution draft uses a generated scientific MOF/evidence-network illustration sized for the full-width editorial media slot. No source logo was altered and no icon was approximated with custom artwork.
- Copy and content: the compact notice preserves the calibrated access wording and direct links to the original GDPR text and Data Compliance page. The draft retains `Web v1.0.13`, `V3.10.1`, `10,277`, and `78.87 / B` from the current page.

## Findings And Comparison History

- Earlier P1: the full compliance notice was too large to repeat inside every research workspace. Fixed with a collapsed one-row disclosure that expands only on demand; the full legal copy remains available without pushing the primary workbench out of focus.
- Earlier P2: EcoScreen contextual controls were wider than the intended reading grid, and the search result label could visually collide with the page heading at intermediate widths. Fixed by aligning the contextual bar and the entire EcoScreen page to the same `1320px` grid and allowing the search control to use the available compact width at `<=1100px`.
- Earlier P2: the first Project Evolution draft edit inherited a short vertical blue paragraph accent, conflicting with the user's global ban on long/one-sided vertical emphasis. Removed in the revised final draft.
- Recomparison: notices remain visually subordinate to the page title and primary tools; all three are visible without warning-color dominance; EcoScreen edges align at both tested widths; the revised concept uses whitespace and horizontal dividers only. No actionable P0/P1/P2 finding remains.

## Primary Interactions And Technical Checks

- Opened the EcoScreen notice and verified full copy, original-law link, and Data Compliance link.
- Verified GasSep notice precedes the scenario builder and Catalysis notice precedes the existing evidence-boundary strip.
- Verified zero positive horizontal overflow in all three module screenshots.
- Focused notice/guardrail tests passed. The complete single-worker regression run passed `278/278` files and `919/919` tests; the default parallel run exposed only the existing timing-sensitive GasSep test timeouts, and the same file passed independently. TypeScript and production build passed; existing 3Dmol `eval` and large-chunk warnings remain non-blocking.
- Final compliance-page browser check measured warm-grey `rgb(240, 238, 230)`, six source rows, a loaded `1672px` hero image, zero horizontal overflow, and zero console errors.

## Scope Boundary

- `deepmind-project-evolution-draft.png` is an approval draft only. The existing Project Evolution implementation and data are intentionally unchanged in this round.

final result: passed

---

# Design QA: DeepMind-Inspired Data Responsibility And Apple-Glass User Menu

## Comparison Target

- Primary source: Google DeepMind, `https://deepmind.google/responsibility-and-safety/`; live DOM and official HTML were inspected. The source structure is a simple editorial cover, a narrow long-form `Our approach` reading column, separate responsibility sections, and a latest-news list rather than a wall of rounded cards.
- Official source image endpoint and page metadata were catalogued under `outputs/data-compliance-research/`; the source did not provide a redistributable product asset.
- Original EcoMOF hero asset: `src/assets/data-compliance/ecomof-responsible-data-hero.png`, generated specifically for the measured wide media slot. It uses a MOF pore/evidence-network subject and does not reuse a DeepMind logo or branded graphic.
- User-menu source screenshot: `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_GoIial/截屏2026-08-12 21.22.36.png`.
- Browser-rendered evidence: `outputs/data-compliance-qa/desktop-1440x1000.png`, `outputs/data-compliance-qa/mobile-390x844.png`, and `outputs/data-compliance-qa/apple-glass-user-menu.png`.

## Viewports And State

- Desktop compliance page: `1440 x 1000`, Chinese, light theme, `#database-compliance`.
- Mobile compliance page: `390 x 844`, Chinese, light theme, the same route.
- User menu: default desktop browser viewport, menu open, `数据托管与跨境访问` secondary section expanded.
- Final browser measurements: document and body had no positive horizontal overflow; the hero raster loaded at `1672 x 941`; all six source rows rendered; console errors: `0`.

## Source And Prototype Comparison

- The implementation matches the DeepMind source's editorial hierarchy: restrained eyebrow, very large low-weight headline, unusually generous cover whitespace, long-form responsibility narrative, one immersive abstract-science image, three horizontally ruled principles, and later content sections with no enclosing card wall.
- EcoMOF-specific product adaptation: real source, licence, evidence, and stop-condition data replaces AI policy content. Forty-three applicable clauses and all authorization evidence remain available in a collapsed second-reading archive instead of dominating the first screen.
- The supplied user menu was square and visually heavy, with Contact and GitHub rows. The final menu uses a `22px` outer radius, translucent surface, `34px` blur, saturated backdrop, inner highlight, soft shadow, and nested `14px` surfaces. Contact and GitHub are absent from this menu.
- The new secondary menu remains within its `380px` container with equal `scrollWidth` and `clientWidth`; legal scope copy, the original EUR-Lex text link, and the Data Compliance route remain visible and operable.

## Data Hosting Notice

- The same controlled notice now appears in the MOF structure header, the full Data Compliance page, the footer, and the user menu.
- The prominent compliance section includes both the original GDPR regulation at `https://eur-lex.europa.eu/eli/reg/2016/679/oj` and the European Commission's international-transfer guidance.
- Legal wording is intentionally scoped: GDPR Chapter V regulates transfers of personal data to third countries or international organizations. The interface does not state that EU law categorically prohibits all research-data hosting in mainland China; provider licences and current hosting capability are named separately.

## Findings And Resolution

- Earlier P1: the compliance page was a sequence of nine equally weighted legal-document panels and therefore did not resemble the selected DeepMind source. Fixed by rebuilding the first reading layer as editorial narrative and moving exhaustive clauses into a disclosed archive.
- Earlier P1: the menu expanded beyond the viewport when long legal copy was added. Fixed with a bounded `380px` glass panel and explicit long-copy wrapping; the final menu has no internal horizontal overflow.
- Earlier P2: the original structure-header blank area had no loading-context explanation. Fixed with a compact right-column notice that reflows beneath the heading below `980px`.
- Earlier P2: repeating the full notice in the footer would overwhelm navigation. Fixed with a concise footer form plus two direct links; the full legal scope remains on the compliance page.
- No actionable P0, P1, or P2 findings remain.

## Verification

- Focused tests: `20/20` passed.
- TypeScript: passed.
- Production build: passed; existing 3Dmol `eval` and chunk-size warnings remain non-blocking.
- Desktop/mobile browser checks: passed.
- Menu interaction, secondary disclosure, original-law link, compliance-page link, source registry, hero loading, console, and overflow checks: passed.

final result: passed

---

# Design QA: GasSep Scenario Capsule

## Comparison Target

- Source visual truth: `qa/gassep-scenario-reference.png`, copied from the supplied GasSep scenario-toolbar screenshot.
- Browser-rendered implementation: `http://127.0.0.1:4181/ecomof-ai/#gassep`.
- Desktop implementation evidence: `qa/gassep-page-desktop-1440.png` and focused crop `qa/gassep-scenario-desktop-1440.png`.
- Mobile implementation evidence: `qa/gassep-page-mobile-390.png`.
- Focused source/implementation comparison: `qa/gassep-scenario-reference-comparison.png`.

## Viewport And Normalization

- Source pixels: `1202 x 122`.
- Desktop CSS viewport override: `1440 x 1050`; browser screenshot pixels: `1396 x 1046`; final focused capsule crop: `1349 x 92` pixels at `devicePixelRatio = 1`.
- Mobile CSS viewport override: `390 x 900`; visible page width: `384` pixels at `devicePixelRatio = 1`.
- The focused comparison places the source at its native `1202 x 122` size and the implementation crop into a `1202 x 122` contain frame. This preserves each toolbar's aspect ratio and exposes the intentional product adaptation in height.

## State And Interactions

- Desktop: Chinese, light theme, default `CO₂/N₂`, `Pareto + APS`, `298 K`, `1/0.15 bar`, and `15/85`; advanced settings collapsed.
- Mobile: the same scenario at `390 x 900`, advanced settings tested both collapsed and expanded.
- Interactions tested: gas-pair selection, ranking-method selection, temperature/pressure entry, ratio validation, Update action, settings expand/collapse, application-scenario visibility, and ratio presets.
- Console errors checked in the final browser passes: `0` at desktop and mobile.

## Full-View Comparison

- The original three-column form card is replaced by one navigation-grade glass capsule. The page now uses the supplied reference's left identity block, compact labeled controls, teal action, and separate settings control.
- Desktop controls remain in one row at `1440px`; the capsule is `92px` high with `28px` radius and no document-level horizontal overflow.
- Mobile reflows to a two-column input grid, keeps the longer ranking method full-width, and places the Update and settings controls on a dedicated final row. The capsule is `360px` wide with zero horizontal overflow.

## Focused Region Comparison

- Evidence: `qa/gassep-scenario-reference-comparison.png`.
- The source uses a wide crop with `CO₂/N₂`, `298 K`, `1 bar`, `0.15 bar`, and `15/85`; the implementation preserves the same control order and values while retaining the product's longer scientific option labels.
- Intentional adaptation: the implementation keeps an extra `9 个场景` status and uses numeric entries for temperature and pressure instead of source-like closed selects, because these are live scientific condition inputs rather than fixed presets.

## Required Fidelity Surfaces

- Fonts and typography: the existing Inter / PingFang SC stack is retained. Labels move to quiet `10px` sentence-case text; values remain `12px` with tabular numerals.
- Spacing and layout rhythm: the outer radius is `28px`; nested controls and actions use `14px`; the desktop capsule is `92px` high, and mobile controls keep `42px` primary heights.
- Colors and visual tokens: all surfaces use current light/dark theme tokens. Teal remains the GasSep action color; error feedback continues to use the existing warning token.
- Image quality and asset fidelity: no image asset is involved in this control surface. The existing Phosphor icon family supplies the Play and settings glyphs; no custom SVG or CSS-drawn icon was introduced.
- Copy and content: no scientific field or calculation boundary was removed. Lower-frequency application scenario, legacy priority, explanatory boundary, and ratio presets remain available in the expanded settings layer.
- Responsiveness and accessibility: labels are associated with semantic controls; settings exposes `aria-expanded`; ratio presets expose `aria-pressed`; invalid ratio state exposes `aria-invalid` and visible error text; focus rings remain present.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Accepted P3: the implementation capsule is shorter than the supplied crop after width normalization. This is intentional because the source includes surrounding capture whitespace, while the implementation uses a compact live toolbar with all controls retaining practical hit sizes.

## Comparison History

### Iteration 1

- Earlier P1: the existing GasSep scenario builder was a generic card with a title paragraph and a three-column form; it did not match the horizontal identity-and-controls structure in the source.
- Fix: restructured the component into a single glass capsule with an identity block, six high-frequency controls, primary Update action, and expandable settings.
- Post-fix evidence: `qa/gassep-scenario-desktop-1440.png` and `qa/gassep-scenario-reference-comparison.png`.

### Iteration 2

- Earlier P2: retaining every field and ratio preset in the primary row would have made the capsule visually dense and unstable at compact widths.
- Fix: moved application scenario, legacy priority, explanatory text, and ratio presets to the semantic settings expansion while keeping all state and logic live.
- Post-fix evidence: desktop expanded-state browser inspection produced a `1386 x 183` capsule with no horizontal overflow; mobile expanded height was `615.7px` with no horizontal overflow.

### Iteration 3

- Earlier P2: number fields nested inside the rounded wrapper did not expose a wrapper-level focus treatment.
- Fix: added a token-derived `:focus-within` outline to the number-control capsule.
- Post-fix evidence: final desktop and mobile browser checks; focused regression test, typecheck, and production build all passed.

## Verification Notes

- Focused component test: `6/6` passed.
- TypeScript check: passed.
- Production build: passed; existing 3Dmol `eval` and large-chunk warnings remain unchanged.
- `git diff --check`: passed.
- The legacy `npm run visual:check:gassep` script could not start its own preview in this sandbox because `vite preview` returned `listen EPERM`. This is not treated as a browser pass; the required browser-rendered evidence above was collected from the already running Vite development server.

## Implementation Checklist

- [x] Navigation-grade outer glass capsule
- [x] Control-grade nested radii
- [x] Scientific fields and calculation behavior preserved
- [x] Advanced settings expansion
- [x] Desktop one-row layout
- [x] Compact and mobile reflow
- [x] Ratio error state and presets
- [x] Desktop/mobile browser evidence
- [x] Source/implementation focused comparison
- [x] Console and overflow checks

final result: passed

---

# Design QA: English Primary Navigation

## Comparison Target

- Source visual truth: `qa/nav-english-reference.png`, copied from the supplied English-navigation screenshot.
- Browser-rendered implementation: `http://127.0.0.1:4181/ecomof-ai/` in English mode.
- Desktop evidence: `qa/nav-english-final-1440.jpg`.
- Compact evidence: `qa/nav-english-compact-1024.jpg`.
- Focused source/implementation comparison: `qa/nav-english-reference-comparison.png`.

## Viewport And State

- Desktop CSS viewport: `1440 x 900`; Overview selected.
- Compact CSS viewport: `1024 x 768`; Data Compliance Pledge selected and automatically scrolled fully into view.
- Mobile CSS viewport: `390 x 844`; Overview selected.
- The supplied reference image is `1812 x 116` pixels and records the clipped English-label state.
- Console errors checked in the final browser pass: `0`.

## Findings And Resolution

- Earlier P1: all eight desktop tabs used equal flex widths. English labels therefore exceeded their button boxes, and the rail's overflow treatment clipped `Project Evolution` and `Data Compliance Pledge`.
- Fix: English tabs now preserve intrinsic label width. Chinese desktop tabs retain the established equal-width layout, while compact and mobile rails retain horizontal scrolling.
- Desktop verification: the `880px` rail has equal `clientWidth` and `scrollWidth`; every English label is contained by its own tab; the page has no horizontal overflow.
- Compact verification: the active Data Compliance Pledge tab is fully visible after selection, its label remains contained, and the liquid selection layer matches the active tab's measured bounds.
- Mobile verification: the rail scrolls internally (`275px` client width, `792px` content width), the active tab is fully contained, and the document remains `384px` wide with no page-level horizontal overflow.
- No actionable P0, P1, or P2 findings remain.

## Implementation Checklist

- [x] English long labels remain complete at desktop width
- [x] Compact navigation remains horizontally scrollable
- [x] Active tab remains fully visible after selection
- [x] Sliding liquid indicator remains aligned
- [x] Chinese equal-width desktop layout remains unchanged
- [x] No page-level horizontal overflow
- [x] Console error check
- [x] Focused source/implementation comparison

final result: passed
