# Organic Acid scoring specification v2

- Version: `V3.9.7`
- Locked at: `2026-06-24T05:38:47Z`
- Policy: new descriptors fixed before re-run; chosen on scientific merit, not to favor any candidate
- Based on: `V3.9.6 audit T3-T5`
- Mode: white-box deterministic scoring; no ML training or inference

## Audit decisions fixed before rerun

The V3.9.6 audit found that the combined pore proxy had a positive family-level relationship with median reaction performance (`Spearman rho = 0.6429`), while surface area alone (`0.0714`) and void fraction alone (`-0.4286`) were low-validity signals. The composite structural signal is retained at reduced influence and cannot by itself determine route priority.

`MIL-type host` is marked low confidence because its structural summary is affected by IQR outliers. The family remains visible, but sample size, outliers, and dominant records must be reported.

The runtime candidate set includes `Cu-MOF` and `Zn-MOF`; both are explicitly included in the v2 target-family scope so all candidates receive the same descriptor derivation rules.

Across 14 weight and normalization perturbations, Ti-MOF + Mo remained the V3.9.6 top route and the best Al-MOF route ranged from rank 4 to rank 5. The v2 descriptor expansion is therefore not calibrated to restore Al-MOF to rank 1.

## New host descriptors

`ligandPathwaySupport` uses the transparent curated linker table. For each linker:

```text
0.20 * normalized carboxylateCount
+ 0.25 * nDonorOrAmine
+ 0.15 * normalized aromaticRings
+ 0.15 * openMetalSitePropensity tier
+ 0.25 * Lewis basicity tier
```

The family value is linker-frequency weighted. Unmapped or `pending` linkers use `0.5` and are labeled `fallback`.

`synthesizabilityScore` is the min-max normalized `log1p` family frequency in CoRE plus the literature dataset. Explicit curated difficulty multipliers may be applied only when listed in the JSON spec. Ti-MOF has a preregistered multiplier of `0.82`, marked `curated-synthesis-difficulty` and `TODO` for chemistry review.

## Host score weights

The JSON `hostScoreWeights` are the only host-weight source. The new weights sum to `1.00`. Pure pore structure is reduced to `0.06`; ligand pathway support is `0.12`; synthesizability is `0.10`.

## Route factors

The route-level host pathway factor is:

```text
0.35 * poreEnvironmentScore
+ 0.30 * co2EnrichmentSupport
+ 0.35 * ligandPathwaySupport
```

The route score adds independent `synthesizabilityScore` and `economicScore` factors. All route weights are read from `routeScoreWeights` in the JSON spec and sum to `1.00`.

```text
finalHGCPS = product(max(factor, 0.001) ^ routeWeight)
```

The weighted geometric mean preserves the multiplicative no-shortboard principle without mechanically shrinking scores merely because two dimensions were added.

## Economic LCC proxy

```text
estimatedCost =
  0.65 * hostMetalUSDkg
+ 0.20 * guestMetalUSDkg
+ 0.10 * ligandCostTierUSDkg
+ 0.05 * synthesisEnergyIndexUSDkg

economicScore = inverse min-max estimatedCost across routes
```

All price inputs are `curated-economic`, must carry source and price date fields, and remain labeled `TODO: verify price + source` until reviewed. They are relative screening inputs, not supplier quotations or a full process LCC.

## Provenance boundary

Every factor must report source dataset, record count, raw aggregate, normalization, value, derivation level, record references, citations, and fallback reason. New factors must use one of:

- `data-derived`
- `data-derived (frequency proxy)`
- `curated-ligand-descriptor`
- `curated-synthesis-difficulty`
- `curated-economic`
- `rule-derived`
- `fallback`

The rerun may leave Al-MOF outside rank 1. No post-hoc weight or mapping change is permitted to alter that result.
