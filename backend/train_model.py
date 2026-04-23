"""
EcoMOF-AI — Model Training Scaffold
===================================
Trains RF / GBM / Ensemble artifacts from the local data schemas.

The script first tries to read:
  ../data/mof_structures.csv
  ../data/adsorption_labels.csv

Those seed files are intentionally small. If fewer than MIN_REAL_ROWS records are
available, the script augments them with transparent synthetic perturbations so
the pipeline can run end-to-end while waiting for a real adsorption-label corpus.

Run from backend/:  python train_model.py
"""

try:
    import numpy as np
    import pandas as pd
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.multioutput import MultiOutputRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.metrics import r2_score, mean_absolute_error
    import joblib
except ModuleNotFoundError as exc:
    raise SystemExit(
        "Missing ML dependency. Install backend requirements first:\n"
        "  cd backend\n"
        "  python -m pip install -r requirements.txt"
    ) from exc
import json
from pathlib import Path

np.random.seed(42)
N = 14000  # approximate CoRE-2019 size
MIN_REAL_ROWS = 100
BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
DATA_DIR = PROJECT_DIR / "data"
MODEL_DIR = BASE_DIR / "models"

# ── Feature Definitions ───────────────────────────────────────────────────────

METALS  = ["Zr4+","Cu2+","Zn2+","Fe3+","Al3+","Cr3+","Mg2+","Co2+","Ni2+"]
LINKERS = ["BDC","NH2-BDC","NO2-BDC","Br-BDC","BTC","mIM","DOBDC","BPDC","NDC","BTB","TCPP","TBAPy","BIM","BTDD","ADC"]

METAL_CO2_AFFINITY = {
    "Mg2+": 1.35, "Co2+": 1.25, "Ni2+": 1.22,
    "Fe3+": 1.10, "Zr4+": 1.05, "Al3+": 1.02,
    "Cu2+": 0.98, "Zn2+": 0.95, "Cr3+": 0.88,
}
LINKER_POLARITY = {
    "DOBDC": 1.40, "BTC": 1.15, "BDC": 1.00,
    "NH2-BDC": 1.18, "NO2-BDC": 1.05, "Br-BDC": 0.96,
    "mIM":   0.90, "BPDC":0.85, "NDC":0.80, "BTB": 0.75,
    "TCPP": 0.88, "TBAPy": 0.82, "BIM": 0.91, "BTDD": 0.94, "ADC": 0.83,
}

def generate_dataset(n=N):
    metals  = np.random.choice(METALS, n)
    linkers = np.random.choice(LINKERS, n)

    # Structural descriptors sampled from CoRE-2019 distributions
    pore_diam = np.random.lognormal(np.log(8), 0.55, n).clip(3, 30)
    bet_sa    = np.random.lognormal(np.log(1500), 0.65, n).clip(100, 7000)
    pore_vol  = np.random.lognormal(np.log(0.65), 0.60, n).clip(0.05, 4.5)
    void_frac = pore_vol / (pore_vol + 0.5)  # simple approximation
    temp      = np.random.choice([273, 298, 313, 323], n, p=[0.15,0.55,0.20,0.10])
    pressure  = np.random.choice([0.1, 0.15, 0.25, 1.0, 5.0, 10.0], n,
                                  p=[0.15,0.30,0.15,0.20,0.10,0.10])
    has_amine    = np.random.binomial(1, 0.25, n)
    has_hydroxyl = np.random.binomial(1, 0.20, n)
    has_carboxyl = np.random.binomial(1, 0.15, n)
    has_thiol    = np.random.binomial(1, 0.08, n)

    # ── CO₂ uptake model (mmol/g) ────────────────────────────────────────────
    metal_aff  = np.array([METAL_CO2_AFFINITY[m] for m in metals])
    linker_pol = np.array([LINKER_POLARITY[l] for l in linkers])

    # Langmuir-inspired: qCO2 = q_max × K×P/(1+K×P)
    q_max = (bet_sa / 1000 * 0.75 + pore_vol * 2.2) * metal_aff * linker_pol
    # Optimal pore diameter window ~5-9 Å (Gaussian penalty)
    pd_factor = np.exp(-0.04 * (pore_diam - 7.5) ** 2) + 0.3
    t_factor  = np.exp(-0.006 * (temp - 298))
    K_ads     = 6.5 * metal_aff
    p_factor  = (K_ads * pressure) / (1 + K_ads * pressure)

    fg_factor = (1.0
                 + 0.30 * has_amine
                 + 0.10 * has_hydroxyl
                 - 0.04 * has_carboxyl
                 - 0.12 * has_thiol)

    co2_uptake = (q_max * pd_factor * t_factor * p_factor * fg_factor
                  + np.random.normal(0, 0.15, n))
    co2_uptake = co2_uptake.clip(0.05, 12)

    # ── N₂ uptake model ──────────────────────────────────────────────────────
    n2_uptake = (co2_uptake * (0.08 + 0.02 * (pore_diam / 20))
                 + np.random.normal(0, 0.02, n)).clip(0.005, 2.0)

    # ── CO₂/N₂ selectivity ──────────────────────────────────────────────────
    sel_factor = 1 + 0.8 * has_amine + 0.2 * has_hydroxyl
    selectivity = (co2_uptake / n2_uptake * sel_factor
                   + np.random.normal(0, 3, n)).clip(5, 300)

    df = pd.DataFrame({
        "metal":        metals,
        "linker":       linkers,
        "pore_diam":    pore_diam,
        "bet_sa":       bet_sa,
        "pore_vol":     pore_vol,
        "void_frac":    void_frac,
        "temperature":  temp,
        "pressure":     pressure,
        "has_amine":    has_amine,
        "has_hydroxyl": has_hydroxyl,
        "has_carboxyl": has_carboxyl,
        "has_thiol":    has_thiol,
        "co2_uptake":   co2_uptake,
        "n2_uptake":    n2_uptake,
        "selectivity":  selectivity,
    })
    return df

def load_schema_dataset():
    structures_path = DATA_DIR / "mof_structures.csv"
    labels_path = DATA_DIR / "adsorption_labels.csv"
    if not structures_path.exists() or not labels_path.exists():
        return None

    structures = pd.read_csv(structures_path)
    labels = pd.read_csv(labels_path)
    df = labels.merge(structures, on=["mof_id", "name"], how="left", suffixes=("_label", ""))
    if df.empty:
        return None

    out = pd.DataFrame({
        "metal": df["metal"].fillna("Zr4+"),
        "linker": df["linker"].fillna("BDC"),
        "pore_diam": df["pld_a"].fillna(df.get("poreDiameter", 8.5)),
        "bet_sa": df["bet_m2g"].fillna(1500),
        "pore_vol": df["pore_volume_cm3g"].fillna(0.65),
        "void_frac": df["void_fraction"].fillna(0.5),
        "temperature": df["temperature_k"].fillna(298),
        "pressure": df["pressure_bar"].fillna(0.15),
        "has_amine": df["linker"].fillna("").str.contains("NH2", case=False).astype(int),
        "has_hydroxyl": df["linker"].fillna("").str.contains("DOBDC", case=False).astype(int),
        "has_carboxyl": 0,
        "has_thiol": 0,
        "co2_uptake": df["primary_loading_mmolg"].fillna(1.0),
        "n2_uptake": df["secondary_loading_mmolg"].fillna(0.1),
        "selectivity": df["selectivity"].fillna(10),
    })

    if len(out) < MIN_REAL_ROWS:
        augmented = []
        repeats = int(np.ceil(MIN_REAL_ROWS / max(1, len(out))))
        for _ in range(repeats):
            tmp = out.copy()
            tmp["pore_diam"] *= np.random.normal(1.0, 0.035, len(tmp))
            tmp["bet_sa"] *= np.random.normal(1.0, 0.06, len(tmp))
            tmp["pore_vol"] *= np.random.normal(1.0, 0.05, len(tmp))
            tmp["co2_uptake"] *= np.random.normal(1.0, 0.08, len(tmp))
            tmp["n2_uptake"] *= np.random.normal(1.0, 0.10, len(tmp))
            tmp["selectivity"] *= np.random.normal(1.0, 0.10, len(tmp))
            augmented.append(tmp)
        out = pd.concat(augmented, ignore_index=True).head(MIN_REAL_ROWS)
        out["training_origin"] = "schema_seed_augmented"
    else:
        out["training_origin"] = "schema_real"
    return out


def train(df):
    # Encode categorical features
    le_metal  = LabelEncoder().fit(METALS)
    le_linker = LabelEncoder().fit(LINKERS)

    X = df[[
        "pore_diam", "bet_sa", "pore_vol", "void_frac",
        "temperature", "pressure",
        "has_amine", "has_hydroxyl", "has_carboxyl", "has_thiol",
    ]].copy()
    X["metal_enc"]  = le_metal.transform(df["metal"])
    X["linker_enc"] = le_linker.transform(df["linker"])

    y = df[["co2_uptake", "n2_uptake", "selectivity"]]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    rf_model = MultiOutputRegressor(
        RandomForestRegressor(
            n_estimators=200,
            max_depth=20,
            min_samples_leaf=3,
            n_jobs=1,
            random_state=42,
        ),
        n_jobs=1
    )
    gbm_model = MultiOutputRegressor(
        GradientBoostingRegressor(
            n_estimators=160,
            max_depth=3,
            learning_rate=0.045,
            random_state=42,
        )
    )

    print("Training RF model on", len(X_train), "samples...")
    rf_model.fit(X_train, y_train)
    print("Training GBM model on", len(X_train), "samples...")
    gbm_model.fit(X_train, y_train)

    y_pred_rf = rf_model.predict(X_test)
    y_pred_gbm = gbm_model.predict(X_test)
    y_pred = (y_pred_rf + y_pred_gbm) / 2
    for i, name in enumerate(["CO₂ Uptake", "N₂ Uptake", "Selectivity"]):
        r2  = r2_score(y_test.iloc[:, i], y_pred[:, i])
        mae = mean_absolute_error(y_test.iloc[:, i], y_pred[:, i])
        print(f"  Ensemble {name}: R²={r2:.3f}, MAE={mae:.3f}")

    return rf_model, rf_model, gbm_model, le_metal, le_linker, list(X.columns), {
        "co2_uptake": {
            "r2": float(r2_score(y_test.iloc[:, 0], y_pred[:, 0])),
            "mae": float(mean_absolute_error(y_test.iloc[:, 0], y_pred[:, 0])),
        },
        "n2_uptake": {
            "r2": float(r2_score(y_test.iloc[:, 1], y_pred[:, 1])),
            "mae": float(mean_absolute_error(y_test.iloc[:, 1], y_pred[:, 1])),
        },
        "selectivity": {
            "r2": float(r2_score(y_test.iloc[:, 2], y_pred[:, 2])),
            "mae": float(mean_absolute_error(y_test.iloc[:, 2], y_pred[:, 2])),
        },
    }


if __name__ == "__main__":
    df = load_schema_dataset()
    if df is None:
        print("No local schema dataset found. Generating CoRE-2019 based synthetic dataset...")
        df = generate_dataset()
        df["training_origin"] = "synthetic_fallback"
    else:
        print("Loaded local schema dataset:", df["training_origin"].iloc[0])
    print(f"Dataset: {len(df)} rows")

    model, rf_model, gbm_model, le_metal, le_linker, feature_names, metrics = train(df)

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(model,    MODEL_DIR / "ecomof_model.pkl")
    joblib.dump(rf_model, MODEL_DIR / "rf_model.pkl")
    joblib.dump(gbm_model, MODEL_DIR / "gbm_model.pkl")
    joblib.dump(le_metal, MODEL_DIR / "le_metal.pkl")
    joblib.dump(le_linker,MODEL_DIR / "le_linker.pkl")
    with open(MODEL_DIR / "features.json", "w") as f:
        json.dump(feature_names, f)
    with open(MODEL_DIR / "training_manifest.json", "w") as f:
        json.dump({
            "schema": "ecomof-training-manifest.v1",
            "origin": str(df["training_origin"].iloc[0]),
            "rows": int(len(df)),
            "targets": ["co2_uptake", "n2_uptake", "selectivity"],
            "models": ["RandomForestRegressor primary artifact", "GradientBoostingRegressor comparison artifact", "RF/GBM averaged validation metrics"],
            "metrics": metrics,
            "source_files": [str(DATA_DIR / "mof_structures.csv"), str(DATA_DIR / "adsorption_labels.csv")],
            "warning": "Seed/augmented data is not publication-grade. Replace labels with verified NIST/GCMC/literature data.",
        }, f, indent=2)

    print("\nSaved to models/")
    print("Done! Run: uvicorn app:app --host 0.0.0.0 --port 7860")
