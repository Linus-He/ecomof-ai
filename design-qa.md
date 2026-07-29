# Design QA — MOF identity search and current methodology

Final result: passed

## Visual sources

- Search issue reference: `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_1EAn0j/截屏2026-07-29 21.05.40.png`
- Global scrolling popover reference: `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_pIavQh/截屏2026-07-29 21.12.01.png`
- Retired methodology reference: `/var/folders/8k/hwwkxqpn6fv6kkkx14j_r6700000gn/T/TemporaryItems/NSIRD_screencaptureui_GTmOq5/截屏2026-07-29 21.14.35.png`

## Implementation evidence

- `qa/mof-search-implementation-final-visible-v2.png`
- `qa/methodology-current-implementation-v2.png`
- `qa/mof-search-comparison.png`
- `qa/methodology-comparison.png`

The comparisons place the supplied reference and the implemented state together. The final search uses the existing EcoMOF-AI type, colour, radius, border, and spacing system. The search field has no browser focus halo, is width-bounded, includes an explicit confirmation control, and keeps record coverage visible without crowding the action. The current methodology removes the retired performance-priority entry and presents the locked HGCPS equation beside an adjustable explanatory curve.

## Interaction checks

- MOF property query requires explicit confirmation.
- Editing a confirmed query clears the old result and property cards immediately.
- `DUT-68` resolves to DOI `10.1021/cg301691d`, CCDC `902900`, and the MOF Anatomy identity page while withholding unlicensed or non-exact properties.
- `NTU-68` resolves through the separately curated identity fallback and shows its paper DOI without inventing a structure-property link.
- `ABAYIO` resolves to one de-duplicated CoRE property record and displays surface area, pore volume, PLD, LCD, density, void fraction, and field-level provenance.
- The methodology directory jumps to the current Organic Acid sections and retains a drag-resizable desktop sidebar.
- The HGCPS sensitivity slider updates the explanatory curve only; it does not write official weights or candidate results.
- Field-source and global modal close controls remain in a sticky header within the scrolling container.

## Browser and responsive checks

- In-app browser route: `http://127.0.0.1:4175/ecomof-ai/`
- Chinese navigation, MOF Library, current methodology, exact-property result, identity-only result, and field-source dialog were inspected.
- Default desktop window and a 1440 × 900 responsive override were checked; the override was reset after inspection.
- Browser console: no warnings or errors.
- Visual comparison iteration:
  1. Found the result-state persistence after editing the query; cleared submitted state and selection on input.
  2. Found duplicate local property hits and generic labels; de-duplicated by exact source identifier and promoted CSD Refcodes.
  3. Found the HGCPS equation blank because the formula component received the wrong prop; corrected it and re-captured.
  4. Found the search action outside the useful visible width; bounded the field and placed the confirmation button inside it.

## Automated verification

- TypeScript: passed.
- Production build: passed.
- Visual route contract: browserless fallback passed because the sandbox blocked additional preview ports; the already-running in-app browser was used for the actual visual and interaction review.
- Full Vitest run: 839/840 passed; one unrelated GasSep adaptation test timed out after a transient test-data 404. The failed test was rerun alone and passed.
- Focused MOF Anatomy, release-log, compliance, methodology, and GasSep regression checks: passed.
