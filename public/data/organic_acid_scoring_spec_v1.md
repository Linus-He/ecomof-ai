# Organic Acid Host-Guest Scoring Spec V1

Version: V3.9.6

Locked at: 2026-06-23T14:09:51Z

Policy: rules fixed before ranking computed.

This preregistration locks the deterministic, white-box scoring contract before the V3.9.6 data-derived ranking is computed. The companion JSON file is the machine-readable source of truth for builders.

## Scope

- Replace hand-entered host, guest, and route factor values with values derived from the existing CoRE, QMOF, gas adsorption, reaction, literature, and gold datasets where fields exist.
- Use explicit curated fallback only when the imported datasets do not contain a descriptor or when eligible records are below the threshold.
- Preserve the multiplicative HGCPS formula and the no-ML policy.
- Do not hard-code any final route, score, or rank.

## Family Assignment

Records are assigned to target host families by deterministic rules:

1. Name, topology, linker, or MOF name containing `MIL` maps to `MIL-type host`.
2. Zirconium records with `808` or `spn` map to `MOF-808-like host`.
3. Zirconium records with `UiO` or `fcu` map to `UiO-type host`.
4. Remaining zirconium records map to `Zr-MOF`.
5. Single-metal `Al`, `Fe`, `Cr`, and `Ti` map to their corresponding families.

Multi-metal records use the first listed metal when it can be mapped; otherwise they are marked ambiguous and excluded from family aggregates. Unclassified records are counted but do not participate in factor aggregation.

TODO: Review unmatched zirconium topology strings after the first builder run because imported topology labels may not align with UiO/MOF-808/MIL hints.

## Host Factors

Host factors are read from `hostFactorMappings` in `organic_acid_scoring_spec_v1.json`.

- `poreEnvironmentScore`: CoRE + QMOF family medians from surface area, pore volume, and void fraction.
- `co2EnrichmentSupport`: direct CO2 gas adsorption rows when available; otherwise a flagged void-fraction structural proxy.
- `stabilityProxy`: indirect aqueous survival proxy from water/aqueous reaction support plus CoRE representation.
- `aqueousStabilityEvidence`: reaction rows with water or aqueous solvent, positive yield, and accepted validation status.
- `thermalStabilityEvidence`: median temperature among positive-yield accepted reaction rows.
- `postModificationFeasibility`: curated fallback because no imported field represents this descriptor.
- `guestHostingFeasibility`: curated fallback because no imported field represents this descriptor.
- `provenanceQuality`: coverage from DOI/citation and available quality provenance fields.

Host score is a weighted sum using `hostScoreWeights` in the JSON spec.

## Guest Factors

Guest factors are data-derived only when the guest metal appears as a primary `metalNode` in reaction, literature, or gold records with at least five eligible records. Otherwise the value is labeled `curated-literature-prior`, with `nRecords` shown even when zero. This is expected for dopant/guest metals that are not represented as dedicated dopant records.

Guest score is a weighted sum using `guestScoreWeights` in the JSON spec.

## Route Factors

Route HGCPS uses these locked keys:

1. `hostStabilityScore`
2. `hostPathwaySupportScore`
3. `guestActivityCompensationScore`
4. `hostGuestComplementarityScore`
5. `evidenceConfidenceScore`
6. `riskPenalty`

`finalHGCPS` is the product of those six factors. Evidence confidence is derived from literature and gold evidence counts, quality tier, provenance coverage, and target-product support. Risk retention is derived from evidence sparsity and same-condition/comparability coverage.

## Provenance

Every factor value must expose:

```json
{
  "sourceDataset": "...",
  "nRecords": 0,
  "rawAggregate": {},
  "normalization": "...",
  "value": 0
}
```

Fallback values must be labeled `curated-fallback` or `curated-literature-prior` and must include a reason.

## Sensitivity

The report must show whether the actual top route remains stable under route-factor multipliers of `0.8` and `1.2` and reasonable weight perturbation. The contribution is rank robustness, not a guaranteed fixed winner.
