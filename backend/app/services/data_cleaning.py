import pandas as pd
import numpy as np

def analyze_dataset(file_path: str):
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    total_rows = len(df)
    total_cols = len(df.columns)
    duplicate_count = int(df.duplicated().sum())
    missing_counts = df.isnull().sum().to_dict()
    total_missing_cells = int(df.isnull().sum().sum())

    # Preview top 10 rows
    preview = df.head(10).replace({np.nan: None}).to_dict(orient="records")

    return {
        "total_rows": total_rows,
        "total_cols": total_cols,
        "duplicate_count": duplicate_count,
        "missing_counts": missing_counts,
        "total_missing_cells": total_missing_cells,
        "columns": list(df.columns),
        "preview": preview
    }

def clean_and_process_dataset(file_path: str, output_path: str = None):
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    initial_rows = len(df)
    duplicates_detected = int(df.duplicated().sum())
    
    # 1. Deduplicate
    df = df.drop_duplicates()

    # 2. Impute / Clean nulls
    missing_imputed = 0
    for col in df.columns:
        if df[col].isnull().sum() > 0:
            missing_imputed += int(df[col].isnull().sum())
            if pd.api.types.is_numeric_dtype(df[col]):
                df[col] = df[col].fillna(df[col].median())
            else:
                df[col] = df[col].fillna("Unknown")

    # 3. Standardize string whitespace
    for col in df.select_dtypes(include="object").columns:
        df[col] = df[col].astype(str).str.strip()

    # 4. Calculate key metrics if applicable
    kpis = {}
    if "Revenue" in df.columns or "revenue" in df.columns:
        rev_col = "Revenue" if "Revenue" in df.columns else "revenue"
        kpis["total_revenue"] = float(df[rev_col].sum())
        kpis["mean_revenue"] = float(df[rev_col].mean())

    if ("Cost" in df.columns or "cost" in df.columns) and ("Revenue" in df.columns or "revenue" in df.columns):
        cost_col = "Cost" if "Cost" in df.columns else "cost"
        rev_col = "Revenue" if "Revenue" in df.columns else "revenue"
        total_rev = df[rev_col].sum()
        total_cost = df[cost_col].sum()
        if total_rev > 0:
            kpis["gross_margin_pct"] = round(float(((total_rev - total_cost) / total_rev) * 100), 2)

    # Save cleaned file if requested
    if output_path:
        if output_path.endswith('.csv'):
            df.to_csv(output_path, index=False)
        else:
            df.to_excel(output_path, index=False)

    cleaned_preview = df.head(15).replace({np.nan: None}).to_dict(orient="records")

    return {
        "initial_rows": initial_rows,
        "cleaned_rows": len(df),
        "duplicates_removed": duplicates_detected,
        "missing_cells_imputed": missing_imputed,
        "kpis": kpis,
        "columns": list(df.columns),
        "preview": cleaned_preview
    }

