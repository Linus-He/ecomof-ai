# Homepage and Footer Design QA

Date: 2026-08-10

## Reference states

- `qa/reference-path-to-hope-desktop-top-20260810.png`
- `qa/reference-path-to-hope-desktop-bloom.png`
- `qa/reference-path-to-hope-mobile-top-20260810.png`
- `qa/reference-path-to-hope-mobile-bloom-1-20260810.png`
- `qa/reference-path-to-hope-footer-desktop-20260810.png`
- `qa/reference-path-to-hope-mobile-footer-20260810.png`

## Local states

- `qa/local-home-desktop-top-20260810.png`
- `qa/local-home-desktop-bloom-20260810.png`
- `qa/local-home-desktop-expansion-20260810.png`
- `qa/local-home-mobile-top-20260810.png`
- `qa/local-home-mobile-bloom-20260810.png`
- `qa/local-home-mobile-continuum-20260810.png`
- `qa/local-home-desktop-footer-20260810.png`
- `qa/local-home-mobile-footer-20260810.png`

## Verified behavior

- Initial title, copy, primary action, and scroll cue fit in the first viewport.
- The 2.6 second bloom separates the two title words and reveals five research questions plus 17 sparse, safe image nodes.
- Each research branch uses distinct, relevant artwork and text.
- A branch expands from its source node into the full map canvas and collapses back.
- A second downward wheel transfers from the completed map into the continuous branch narrative.
- Immersive and classic homepage modes switch without losing the original six routes.
- The footer uses four columns on desktop and one stacked column on mobile.
- Registered footer deep links open the correct workspace section instead of falling back to the homepage.
- Desktop width 1280 and mobile width 390 have no document-level horizontal overflow.
- Homepage shell, sticky header, discovery map, deep sections, and footer resolve to the same `rgb(240, 238, 230)` canvas.
- Deep-section cards and visualization stages use transparent backgrounds; hierarchy comes from spacing and subtle borders rather than filled section blocks.
- Anthropic-inspired clay, olive, fig, and neutral data colors replace the former blue/purple homepage palette without removing categorical distinctions.
- Browser console contains no errors or warnings in the verified states.
- Yellow backgrounds, pill controls, and colored one-sided vertical emphasis rules are absent from the changed surfaces.

## Automated checks

- Focused homepage, language, and navigation tests: 17 passed.
- TypeScript check: passed.
- Production build: passed.
- Browserless visual fallback: passed.
- Headless Chromium visual script: blocked by macOS sandbox permission `bootstrap_check_in ... Permission denied (1100)`; replaced by in-app browser QA above.
- Full test suite: two existing GasSep adaptation tests failed because GitHub Pages data requests returned 404; the run was stopped after the unrelated failure was established.

final result: passed
