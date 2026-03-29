"""
EcoMOF-AI — Model Training Script
===================================
Generates synthetic CoRE-2019 based training data and trains
a Random Forest model for CO₂ uptake and CO₂/N₂ selectivity prediction.

Based on structure-property relationships from:
  Chung et al. "CoRE MOF 2019: Deciphering the Relationship Between
  Porous Topology and Gas Adsorption in Metal–Organic Frameworks"
  J. Chem. Eng. Data 2019, 64, 5985–5998

Run:  python train_model.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import r2_score, mean_absolute_error
import joblib
import json
import os

np.random.seed(42)
N = 14000  # approximate CoRE-2019 size

# ── Feature Definitions ───────────────────────────────────────────────────────

METALS  = ["Zr4+","Cu2+","Zn2+","Fe3+","Al3+","Cr3+","Mg2+","Co2+","Ni2+"]
LINKERS = ["BDC","BTC","mIM","DOBDC","BPDC","NDC","BTB"]

METAL_CO2_AFFINITY = {
    "Mg2+": 1.35, "Co2+": 1.25, "Ni2+": 1.22,
    "Fe3+": 1.10, "Zr4+": 1.05, "Al3+": 1.02,
    "Cu2+": 0.98, "Zn2+": 0.95, "Cr3+": 0.88,
}
LINKER_POLARITY = {
    "DOBDC": 1.40, "BTC": 1.15, "BDC": 1.00,
    "mIM":   0.90, "BPDC":0.85, "NDC":0.80, "BTB": 0.75,
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

    model = MultiOutputRegressor(
        RandomForestRegressor(
            n_estimators=200,
            max_depth=20,
            min_samples_leaf=3,
            n_jobs=-1,
            random_state=42,
        ),
        n_jobs=-1
    )
    print("Training model on", len(X_train), "samples...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    for i, name in enumerate(["CO₂ Uptake", "N₂ Uptake", "Selectivity"]):
        r2  = r2_score(y_test.iloc[:, i], y_pred[:, i])
        mae = mean_absolute_error(y_test.iloc[:, i], y_pred[:, i])
        print(f"  {name}: R²={r2:.3f}, MAE={mae:.3f}")

    return model, le_metal, le_linker, list(X.columns)


if __name__ == "__main__":
    print("Generating CoRE-2019 based synthetic dataset...")
    df = generate_dataset()
    print(f"Dataset: {len(df)} structures")

    model, le_metal, le_linker, feature_names = train(df)

    os.makedirs("models", exist_ok=True)
    joblib.dump(model,    "models/ecomof_model.pkl")
    joblib.dump(le_metal, "models/le_metal.pkl")
    joblib.dump(le_linker,"models/le_linker.pkl")
    with open("models/features.json", "w") as f:
        json.dump(feature_names, f)

    print("\nSaved to models/")
    print("Done! Run: uvicorn app:app --host 0.0.0.0 --port 7860")
