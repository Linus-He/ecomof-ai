# Molecule SVG Assets

These molecule files are local SVG structure assets used by the Organic Acid Project pathway map.

The React UI must load these files through `MoleculeSvgNode.jsx` instead of drawing complex organic structures with component-level coordinate code. If any molecule is replaced later, keep the same file name and verify carbonyl orientation, sugar-ring form, and endpoint identity before committing.

Current source files were downloaded from Wikimedia Commons file redirects:

- `glucose.svg`: `Glucose_structure.svg`
- `fructose.svg`: `Beta-D-Fructofuranose.svg`
- `formaldehyde.svg`: `Structural_formula_of_formaldehyde.svg`
- `glyceraldehyde.svg`: `Glyceraldehyde.svg`
- `pyruvaldehyde.svg`: `Pyruvaldehyde.svg`
- `formic-acid.svg`: `Formic_acid.svg`
- `glycolic-acid.svg`: `Glycolic_acid.svg`
- `acetic-acid.svg`: `Acetic_acid_2.svg`
- `lactic-acid.svg`: `Lactic-acid-skeletal.svg`
- `pyruvic-acid.svg`: `Pyruvic_acid.svg`

TODO: If the project later adopts internally curated molecule depictions, replace these assets here and keep the React components unchanged.
