import pandas as pd
import numpy as np

NA_MARKERS = ["NULL", "null", "None", "none", "N/A", "NA", "NaN", "nan", ""]


def _load_dataframe(file_path: str) -> pd.DataFrame:
    if file_path.endswith('.csv'):
        return pd.read_csv(file_path, na_values=NA_MARKERS)
    return pd.read_excel(file_path, na_values=NA_MARKERS)


def _choose_numeric_imputation(series: pd.Series, strategy: str = "auto") -> tuple[float, str]:
    """Compute replacement value for numerical nulls using mean, median, max, or dataset-adaptive auto."""
    valid = series.dropna()
    if valid.empty:
        return 0, "zero"

    strategy_norm = (strategy or "auto").lower()
    if strategy_norm not in {"auto", "mean", "median", "max"}:
        strategy_norm = "auto"

    if strategy_norm == "auto":
        # Choose median when distribution is skewed or has outliers; otherwise mean
        has_outliers = False
        if len(valid) >= 4:
            q1 = float(valid.quantile(0.25))
            q3 = float(valid.quantile(0.75))
            iqr = q3 - q1
            if iqr > 0:
                has_outliers = bool(((valid < (q1 - 1.5 * iqr)) | (valid > (q3 + 1.5 * iqr))).any())
        skew = abs(float(valid.skew())) if len(valid) >= 3 else 0.0
        method = "median" if (has_outliers or skew >= 0.5) else "mean"
    else:
        method = strategy_norm

    if method == "mean":
        raw_val = float(valid.mean())
    elif method == "max":
        raw_val = float(valid.max())
    else:
        raw_val = float(valid.median())

    is_all_int = bool((valid % 1 == 0).all())
    fill_val = int(round(raw_val)) if is_all_int else round(raw_val, 2)
    return fill_val, method


def _df_to_clean_records(df: pd.DataFrame, limit: int = 5000) -> list[dict]:
    """Convert DataFrame rows to JSON-safe Python dicts (None for nulls, strings for dates)."""
    subset = df.head(limit)
    records = []
    for _, row in subset.iterrows():
        item = {}
        for col in subset.columns:
            val = row[col]
            if pd.isna(val):
                item[str(col)] = None
            elif isinstance(val, pd.Timestamp):
                item[str(col)] = val.strftime("%Y-%m-%d") if val.hour == 0 and val.minute == 0 and val.second == 0 else val.isoformat()
            elif hasattr(val, "item"):
                item[str(col)] = val.item()
            else:
                item[str(col)] = val
        records.append(item)
    return records


def analyze_dataset(file_path: str):
    df = _load_dataframe(file_path)

    total_rows = len(df)
    total_cols = len(df.columns)
    duplicate_count = int(df.duplicated().sum())
    missing_counts = {str(k): int(v) for k, v in df.isnull().sum().to_dict().items()}
    total_missing_cells = int(df.isnull().sum().sum())

    rows = _df_to_clean_records(df, limit=5000)

    return {
        "total_rows": total_rows,
        "total_cols": total_cols,
        "duplicate_count": duplicate_count,
        "missing_counts": missing_counts,
        "total_missing_cells": total_missing_cells,
        "columns": [str(c) for c in df.columns],
        "preview": rows[:15],
        "rows": rows
    }


def clean_and_process_dataset(file_path: str, output_path: str = None, strategy: str = "auto"):
    df = _load_dataframe(file_path)

    initial_rows = len(df)
    duplicates_detected = int(df.duplicated().sum())

    # 1. Deduplicate
    df = df.drop_duplicates()

    # 2. Impute / Clean nulls
    missing_imputed = 0
    imputation_details = []
    for col in df.columns:
        null_count = int(df[col].isnull().sum())
        if null_count > 0:
            missing_imputed += null_count
            if pd.api.types.is_numeric_dtype(df[col]):
                fill_val, used_method = _choose_numeric_imputation(df[col], strategy=strategy)
                df[col] = df[col].fillna(fill_val)
                imputation_details.append({
                    "column": str(col),
                    "method": used_method,
                    "value": fill_val,
                    "nulls_replaced": null_count
                })
            else:
                df[col] = df[col].fillna("Unknown")
                imputation_details.append({
                    "column": str(col),
                    "method": "default_text",
                    "value": "Unknown",
                    "nulls_replaced": null_count
                })

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

    cleaned_rows = _df_to_clean_records(df, limit=500)

    return {
        "initial_rows": initial_rows,
        "cleaned_rows": len(df),
        "duplicates_removed": duplicates_detected,
        "missing_cells_imputed": missing_imputed,
        "strategy": strategy,
        "imputation_details": imputation_details,
        "kpis": kpis,
        "columns": [str(c) for c in df.columns],
        "preview": cleaned_rows[:15],
        "rows": cleaned_rows
    }

