# Nobel Chemistry design QA

final result: passed

Source: user screenshot `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_JJ89af/截屏2026-10-07 22.13.05.png` (2590 × 964).
Implementation: `qa/nobel/desktop-2026.png`, `qa/nobel/desktop-2025.png`, `qa/nobel/mobile-2025.png`.
Full-view comparison: `qa/nobel/reference-comparison.jpg` contains source and implementation together. Source is a content section, implementation includes the requested independent-page masthead, reading body and existing site chrome. Compared matching two-column content areas; white background and English masthead explicitly supersede the reference's cream background and localized title.

Viewport: desktop 1440 × 1000; mobile 390 × 844 CSS pixels. Captured page dimensions 1434 × 2460 and 384 × 3525 (browser scrollbar excluded); no horizontal overflow in either viewport. Images normalized proportionally for the combined board.

## Findings and iteration history

- Initial P1: press-release image was a science diagram, rather than laureate portraits. Replaced with the official 2026 group portrait and 2025 official lesson-slide portraits. Revised captures show black-and-gold drawings in both editions.
- User refinement: changed paper color to pure white and masthead to The Nobel Prize in Chemistry. Revised captures verify both changes.
- No remaining P0/P1/P2 findings in the new content.

## Fidelity surfaces

- Typography: navy sans-serif titles and serif body; Chinese serif fallback preserves editorial character. English masthead wraps on narrow screens.
- Layout: fine top rules, equal desktop columns, uncropped portraits and image attribution; single-column mobile reading.
- Color: section and page backgrounds are #ffffff; restrained navy, blue links and gold year underline.
- Imagery: original Nobel Prize Outreach portraits with attribution. No generated approximation. Portrait paper texture is part of the source image, not the section background.
- Content: 2026 and 2025 facts checked against official annual releases; explanatory text clearly identified as independent commentary, with three official further-reading links.

## Interaction verification

In-app browser: homepage return, homepage feature link to independent page, 2026 → 2025 switching and route title updates passed. Official source links have correct annual URLs. Browser error log: empty. Desktop and mobile render checked. Typecheck, focused navigation/home tests and production build passed.

## Implementation checklist

- Shared annual template and styles completed.
- Homepage feature installed on both search landing page and overview.
- Deep links registered for both editions.
- Existing unrelated worktree changes preserved.

## Final year-control revision

final result: passed

Replaced year links with the supplied − / year / + / Explore control, centered in the same masthead slot. `year-explorer-comparison.jpg` combines the user control reference (630 × 224) and full browser capture; `year-explorer-full.png` is 1434 × 2528 at 1440 × 1000 CSS viewport. `year-explorer-mobile.png` confirms wrapping English title and a single-row selector at 390 × 844.

Same typography, fine neutral borders, blue action button and pure white background. Button scale adapts to the existing page rather than reproducing the magnified reference's absolute pixels. No remaining P0/P1/P2 differences.

Browser interaction: editing 2026 to 2012 preserves the 2026 article; Explore changes the deep link and loads Robert J. Lefkowitz / Brian Kobilka. Returning to 2026 restores the full editorial. Error log empty. Automated checks also cover no fetch on editing, valid deep links, non-awarded 1916 and rejection of out-of-range 2027.

Official index: 126 annual records, 1901–2026. Only 2025/2026 currently include independent editorial commentary. Earlier years display source-backed award records and explicitly state commentary is not yet written. The official API refresh builder extends the index to the latest published Chemistry year; publishing refreshed files is required and no recurring automation has been created.
