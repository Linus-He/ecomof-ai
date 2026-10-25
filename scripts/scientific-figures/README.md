# Scientific structure figures

The browser uses checked-in SVG assets, with no RDKit runtime download. `src/data/scientificStructures.json` maps the annual Nobel learning concepts and science-market contexts explicitly.

## Scientific boundaries

- PubChem CID records and API URLs in `pubchem-records.json` establish the molecular connectivity, formula and available stereochemistry. Some records leave stereocentres/anomers unspecified; captions preserve this.
- RDKit generates 2D layouts, validates formulas and checks the carvone pair as **R** and **S**. Molecular formula alone cannot identify a positional isomer; the PubChem SMILES is the controlling graph.
- The cyclohexane conformer is generated and UFF-optimized with a fixed seed. It is a teaching model, not measured coordinates or evidence of relative conformational energy.
- Authored schematics show topology, components or scientific relationships. They are explicitly labelled and do not assert a specific crystal unit cell, protein structure or undisclosed company formula.
- Organic carbon skeletons omit conventional carbon/hydrogen labels where appropriate. The carvone pair highlights the stereocentre; wedge direction is independent of optical rotation.
- Structures and diagrams are explanatory figures, not the retired homepage concept covers. Source identifiers/links accompany the molecule depictions; the surrounding article supplies annual scientific sources.

## Reproduce

Install the fixed versions in `requirements.txt` into a separate environment, then run `python3 scripts/scientific-figures/build.py`. It uses recorded inputs and no network. The standard website build needs none of those Python packages.

Inspect the generated figures, run data/component tests and include the figures' metadata/checksums in review. Do not add an experimentally claimed structure without a record identifier and the corresponding evidence. Retain RDKit's BSD notice in `RDKIT-LICENSE.md`.

The empirical threshold and scientific concepts are separate from illustration style. In particular, the ionic/solvation figure does not claim a measured hydration number, the carbon diagrams show local topology, and the MOF/olivine/superconductor drawings do not supply crystal-site coordinates. RNA examples use nucleotide/folding schematics, not peptide structures. DNA uses the deoxy-AMP record, distinct from AMP in the RNA illustration.
