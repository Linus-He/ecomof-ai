# ecomof-ai

**ecomof-ai is a research-oriented MOF AI prototype platform for early-stage candidate screening, sustainability evaluation, performance comparison, and task-oriented application exploration.**

**ecomof-ai 是一个面向科研合作的 MOF AI 原型平台，用于早期候选材料筛选、可持续性评价、性能比较和任务导向应用探索。**

[Live demo / 在线工具](https://Linus-He.github.io/ecomof-ai/)

## Project overview

ecomof-ai is built for research collaboration, early-stage screening, candidate prioritization, decision support, and hypothesis generation. It keeps the workflow transparent: data source, descriptor meaning, score breakdown, Evidence Level, limitations, and recommended validation step are shown together.

The platform is not a final scientific conclusion engine. Rule-based visualizations are real outputs of the current scoring strategy, while ML evaluation charts are placeholders until labeled data are available.

## Core modules

- **Overview**: positioning, module entry, workflow, and result-interpretation boundary.
- **Performance Screening**: CO2 uptake, selectivity, thermodynamic interpretation, adsorption-related candidate comparison, and GCMC/IAST validation reminders.
- **EcoScreen**: sustainability-oriented MOF screening with LCA, LCC, toxicity, cost, stability, robustness indicators, and Eco Score ranking.
- **CatalysisLab**: CatalysisLab provides rule-based candidate prioritization for MOF catalysis applications. It does not predict final catalytic performance and requires experimental validation. CatalysisLab 提供基于规则的 MOF 催化候选材料优先级筛选，不等同于最终催化性能预测，仍需实验验证。
- **MOF Library**: baseline material data, source fields, searchable descriptors, and expandable record details.
- **Methodology**: data contracts, descriptor meaning, rule-based scoring model, Model Results, future ML plan, placeholder evaluation, limitations, and disclaimer.

## What the platform does

- Provides **Early-stage Screening**, **Candidate Ranking**, performance comparison, and sustainability-oriented decision support.
- Uses a **Rule-based Scoring Model** to combine normalized descriptors, weights, and Evidence Level into explainable candidate priority.
- Shows why a MOF is ranked high, which dimensions contribute to the score, what evidence supports the result, and what should be validated next.
- Preserves existing Eco/LCA/LCC/adsorption/screening workflows while organizing them under the new six-page information architecture.

## What the platform does not claim

- It is not a substitute for experimental validation.
- It does not replace rigorous GCMC simulation or IAST analysis.
- It does not replace full industrial LCA or supplier-grade costing.
- It does not claim final catalytic activity, yield, conversion, TOF, selectivity, or durability.
- Current data may include demo / placeholder / seed records.

## Data structure

Static browser data live in `public/data/`:

- `mof_candidates_demo.json`: demo / placeholder / rule-based MOF candidate records with identity, source, metal nodes, topology, pore descriptors, CO2 uptake, band gap, stability, sustainability fields, catalysis hypotheses, Evidence Level, and limitations.
- `catalysis_tasks.json`: task definitions, required descriptors, and recommended outputs for CatalysisLab.
- `catalysis_rules.json`: rule descriptions and interpretation boundaries.
- `evidence_levels.json`: experimental, literature-supported, simulation-supported, ML-predicted, rule-based, and needs-validation levels.
- `scoring_weights.json`: default EcoScreen, Performance, and CatalysisLab weights for the current scoring strategy.
- Existing seed data: `mof_structures.json`, `adsorption_labels.json`, `lca_inventory.json`, `isotherms.json`, and `training_manifest.json`.

All demo records must remain clearly marked as demo / placeholder / rule-based / needs validation.

## Rule-based scoring model

Unified candidate-priority formula:

```text
Final Score =
w1 × Performance
+ w2 × Stability
+ w3 × Sustainability
+ w4 × Application Fit
+ w5 × Evidence Confidence
```

CatalysisLab formula:

```text
Catalysis Potential Score =
w1 × CO2 Affinity
+ w2 × Active Site Potential
+ w3 × Pore Accessibility
+ w4 × Stability
+ w5 × Electronic Property
+ w6 × Sustainability
+ w7 × Evidence Confidence
```

CatalysisLab currently provides rule-based candidate prioritization. Scores express candidate priority, potential, and validation priority, not final material performance.

## Model results and visualization

Current rule-based outputs include:

- **Ranking Bar Chart**: candidate score ranking.
- **Score Breakdown Radar Chart**: dimension-level score composition for a selected MOF.
- **Weight Contribution Chart**: contribution = weight × normalized score.
- **Evidence Level Distribution**: support strength across candidates.
- **Score Distribution**: score separation or clustering.
- **Sensitivity Analysis Chart**: Top 5 stability under ±20% weight changes.

These visualizations are real outputs of the current rule-based scoring strategy.

## ML evaluation plan

Machine learning evaluation will require labeled experimental or literature data. Until then, ML evaluation stays as Demo only / Placeholder:

- Predicted vs Actual: pending
- Residual Plot: pending
- Descriptor Contribution / Rule Contribution: active for rules; Feature Importance is future-only
- R2 / MAE / RMSE / Cross-validation: pending

The platform must not display fabricated model metrics or real-looking ML performance claims.

## Limitations

- Results indicate candidate priority, not final material performance.
- Catalytic performance depends strongly on reaction conditions.
- Sustainability scores do not replace full industrial LCA.
- Adsorption-related results do not replace rigorous GCMC or IAST analysis.
- Experimental validation is required.

## Development

```bash
npm install
npm run dev
npm run build
```

The current frontend runs without a real database API or complex backend. Optional backend scaffolding is future-facing and not required for the published prototype.

## Roadmap

- Replace seed records with validated experimental, literature, simulation, or curated benchmark labels.
- Add auditable import pipelines for CoRE MOF, QMOF, and curated literature records.
- Expand rule calibration with domain-expert review and sensitivity testing.
- Enable task-specific ML only after labeled datasets and validation splits exist.
- Add uncertainty and applicability-domain diagnostics for each module.
- Replace proxy LCA/LCC assumptions with citable inventory and price datasets.
- Expand CatalysisLab from rule-based prioritization to validated task-specific models when reaction labels exist.

## Contact

- GitHub: [@Linus-He](https://github.com/Linus-He)
- Email: square.hwh@gmail.com
