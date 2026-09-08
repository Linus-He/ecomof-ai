# Search landing / responsive verification — 2026-09-08

Scope: unified-search landing, material results, editorial pages, navigation,
footer, language picker and the open-source notices. Existing scientific
workbenches were not exhaustively retested on physical devices.

## Evidence

Local browser: http://127.0.0.1:5173/

Browser-rendered screenshots were reviewed inline in the Codex task. They are
not saved PNG artifacts. Measurements below come from the rendered DOM, not
from the CSS source alone. No iPhone/iPad hardware test is claimed.

| CSS viewport | Observed document width | Checks |
| --- | --- | --- |
| 320 × 740 | 314 | wordmark / scrollable navigation / wrapped quick entries; article table container 290px, internal table 440px, no page overflow |
| 390 × 844 | 384 | search, two-column UiO-66 properties, DOI actions, language dialog and selection |
| 820 × 1180 | 814 | navigation, three-column properties, three-column footer, Japanese article |
| 1024 × 768 | 1018 | Spanish homepage, six loaded covers, navigation menu bounds 0–1024, Korean language selection |
| 1180 × 820 | 1174 | DOM bounds and Hong Kong conversion; screenshot capture failed at this size, so no visual pass claimed for this size |

The six-pixel difference is the browser scrollbar, not cropped page content.
The viewport override is temporary and is reset after testing.

## Findings fixed

- Language option text changed from 16px to 14px, English secondary names from
  13px to 12px, option padding reduced; close icon 16px in a 32px circle.
  These are screenshot-derived proportions, not extracted OpenAI CSS values.
- Language dialog has a separate bottom search, internal scrolling and viewport
  bounds. Pointer focus does not draw the old extra outline; keyboard focus stays visible.
- Phone quick entries wrap; material actions have 44px minimum touch height;
  tablet footer changes to three columns rather than squeezing five columns.
- Article tables scroll within their own container on narrow phones.
- Hong Kong → Spanish conversion cleanup was overwriting React's newly committed
  labels. Cleanup now restores only text still owned by the old conversion pass.
- Traditional-language dialog labels are translated explicitly because the portal
  is outside the shell's OpenCC observer.

## Interaction and data checks

- UiO-66 returns two records with sourced properties; ZIF-8 and HKUST/Cu-BTC aliases
  are covered by deterministic index tests. Missing fields are not converted to zero.
- Editorial links open original summaries/comparisons rather than the raw changelog.
- Japanese, Korean and Spanish interface/editorial content renders; Spanish persists
  on reload. Hong Kong uses the hk conversion and Taiwan (China) uses tw.
- Language search finds Hong Kong; selection, focus restoration and menu Escape were exercised.
- Native scientific names, DOI values and units remain unchanged. Legacy workbenches
  without new locale copy fall back to English; this is not a full translation of
  all historical scientific documents.
- Source-specific 3D availability is retained: the viewer is mounted only for an
  exact catalog refcode. A missing CIF is reported instead of substituting a different material.

## Automated checks

- TypeScript: passed.
- Focused regression suite: 9 files, 58 tests passed (locale, regional conversion,
  locale copy, navigation, footer, compliance and material matching).
- Production build: passed. Existing large-chunk and 3Dmol eval warnings remain.
- Whitespace/diff validation: passed.

## Visual fidelity boundaries

Reference: user screenshots of OpenAI's homepage, editorial grid and language panel,
including the 22:21:32 language-panel crop, plus https://openai.com/zh-Hans-CN/.
The site text was readable, but the live reference browser repeatedly timed out.
No pixel-exact clone certification is claimed. Fonts are system fallbacks, not
copied proprietary font files; all six covers are generated conceptual illustrations.
Phone and tablet layouts are responsive adaptations of the supplied desktop examples.

Responsive checks for the listed verified states: passed.
Exact same-density, side-by-side OpenAI fidelity audit: not completed.
