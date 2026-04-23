# EcoMOF-AI Data Schemas

This folder defines the local data contracts used by the static frontend, FastAPI backend, and ML training scaffold.

These files are intentionally small seed datasets, not complete scientific databases. They document the expected columns and provenance fields so real CoRE MOF, QMOF, NIST, literature, or GCMC records can be imported without changing the app contract.

## Files

- `mof_structures.csv`: MOF identity, structure descriptors, topology, CIF/source metadata.
- `adsorption_labels.csv`: adsorption labels by MOF, gas pair, temperature, pressure, loading, Henry constants, selectivity, method, and source.
- `lca_inventory.csv`: screening-level LCA/LCC inventory factors, prices, assumptions, and provenance.
- `isotherms.csv`: single-gas isotherm points used for Langmuir fitting, Henry estimation, IAST preparation, and Qst workflows.

## Provenance Levels

- `curated_literature`: manually curated from literature or benchmark examples.
- `computed_descriptor`: descriptor calculated from CIF by a backend tool such as Zeo++, RASPA, or pymatgen.
- `proxy`: estimated value used only for early screening.
- `user_defined`: supplied by the user in the UI.
- `roadmap`: schema placeholder for future import.

## Import Rule

Do not treat a structure database as an adsorption-label database. CoRE MOF and QMOF provide structures/descriptors, while adsorption prediction needs measured or simulated adsorption labels such as isotherms, Henry constants, IAST selectivity, or GCMC outputs.
