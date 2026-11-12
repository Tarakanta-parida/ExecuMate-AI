const MISSING_MARKERS = new Set(['null', 'na', 'n/a', 'nan', 'none', '']);

export function isMissingValue(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === 'number') return Number.isNaN(val);
  if (typeof val === 'string') return MISSING_MARKERS.has(val.trim().toLowerCase());
  return false;
}

function getRowDedupKey(row, columns) {
  const keyCols = columns.length > 1 ? columns.filter((c) => c.toLowerCase() !== 'id') : columns;
  return JSON.stringify(keyCols.map((col) => row[col] ?? null));
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Compute replacement value for numerical null cells using mean, median, max,
 * or automatic distribution-aware selection ('auto').
 */
export function computeNumericImputation(validNumbers, strategy = 'auto') {
  if (!validNumbers || validNumbers.length === 0) {
    return { value: 0, method: 'zero', stats: { mean: 0, median: 0, max: 0 } };
  }

  const sorted = [...validNumbers].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;
  const median = n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const max = sorted[n - 1];

  const normalized = (strategy || 'auto').toLowerCase();
  let method = normalized;

  if (!['mean', 'median', 'max'].includes(method)) {
    // Auto-select according to dataset distribution (skewness & IQR outliers)
    let hasOutliers = false;
    if (n >= 4) {
      const q1 = percentile(sorted, 0.25);
      const q3 = percentile(sorted, 0.75);
      const iqr = q3 - q1;
      if (iqr > 0) {
        hasOutliers = sorted.some((v) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr);
      }
    }

    let skew = 0;
    if (n >= 3) {
      const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1);
      const std = Math.sqrt(variance);
      if (std > 0) {
        const m3 = sorted.reduce((acc, v) => acc + ((v - mean) / std) ** 3, 0);
        skew = (n / ((n - 1) * (n - 2))) * m3;
      }
    }

    method = hasOutliers || Math.abs(skew) >= 0.5 ? 'median' : 'mean';
  }

  const rawValue = method === 'mean' ? mean : method === 'max' ? max : median;
  const isAllInt = sorted.every((v) => Number.isInteger(v));
  const value = isAllInt ? Math.round(rawValue) : Number(rawValue.toFixed(1));

  return {
    value,
    method,
    stats: {
      mean: isAllInt ? Math.round(mean) : Number(mean.toFixed(1)),
      median: isAllInt ? Math.round(median) : Number(median.toFixed(1)),
      max: isAllInt ? Math.round(max) : Number(max.toFixed(1))
    }
  };
}

export function analyzeDatasetRows(rows) {
  if (!rows || rows.length === 0) {
    return {
      totalRows: 0,
      columns: [],
      duplicateCount: 0,
      missingCells: 0,
      numericColumns: [],
      qualityScore: 100
    };
  }

  const columns = Object.keys(rows[0]);
  const seen = new Set();
  let duplicateCount = 0;
  let missingCells = 0;

  for (const row of rows) {
    const key = getRowDedupKey(row, columns);
    if (seen.has(key)) duplicateCount++;
    else seen.add(key);

    for (const col of columns) {
      if (isMissingValue(row[col])) missingCells++;
    }
  }

  const numericColumns = columns.filter((col) => {
    let hasNumber = false;
    for (const row of rows) {
      const val = row[col];
      if (isMissingValue(val)) continue;
      if (typeof val === 'number' && Number.isFinite(val)) {
        hasNumber = true;
      } else {
        return false;
      }
    }
    return hasNumber;
  });

  const qualityScore =
    missingCells === 0 && duplicateCount === 0
      ? 100
      : Number(Math.max(40, Math.min(99.9, 100 - (missingCells * 3.5 + duplicateCount * 5.3))).toFixed(1));

  return {
    totalRows: rows.length,
    columns,
    duplicateCount,
    missingCells,
    numericColumns,
    qualityScore
  };
}

export function cleanDatasetRows(rows, strategy = 'auto') {
  if (!rows || rows.length === 0) {
    return {
      cleanedRows: [],
      duplicatesRemoved: 0,
      missingValuesImputed: 0,
      initialRows: 0,
      currentRows: 0,
      cleanQualityScore: 100,
      strategy,
      imputationDetails: []
    };
  }

  const columns = Object.keys(rows[0]);
  const seen = new Set();
  const deduped = [];
  let duplicatesRemoved = 0;

  // 1. Deduplicate
  for (const row of rows) {
    const key = getRowDedupKey(row, columns);
    if (seen.has(key)) {
      duplicatesRemoved++;
      continue;
    }
    seen.add(key);
    deduped.push({ ...row });
  }

  // 2. Detect numerical columns and compute imputation per column
  const numericColumns = new Set(
    columns.filter((col) => {
      let hasNumber = false;
      for (const row of deduped) {
        const val = row[col];
        if (isMissingValue(val)) continue;
        if (typeof val === 'number' && Number.isFinite(val)) {
          hasNumber = true;
        } else {
          return false;
        }
      }
      return hasNumber;
    })
  );

  const columnFills = {};
  const imputationDetails = [];
  let missingValuesImputed = 0;

  for (const col of columns) {
    const missingCount = deduped.filter((row) => isMissingValue(row[col])).length;
    if (missingCount === 0) continue;

    missingValuesImputed += missingCount;
    if (numericColumns.has(col)) {
      const validNumbers = deduped
        .map((row) => row[col])
        .filter((v) => typeof v === 'number' && Number.isFinite(v));
      const { value, method } = computeNumericImputation(validNumbers, strategy);
      columnFills[col] = value;
      imputationDetails.push({
        column: col,
        method,
        value,
        count: missingCount,
        isNumeric: true
      });
    } else {
      columnFills[col] = 'Unknown';
      imputationDetails.push({
        column: col,
        method: 'default_text',
        value: 'Unknown',
        count: missingCount,
        isNumeric: false
      });
    }
  }

  // 3. Apply replacements
  const cleanedRows = deduped.map((row) => {
    const next = { ...row };
    for (const [col, fillVal] of Object.entries(columnFills)) {
      if (isMissingValue(next[col])) {
        next[col] = fillVal;
      }
    }
    return next;
  });

  return {
    cleanedRows,
    duplicatesRemoved,
    missingValuesImputed,
    initialRows: rows.length,
    currentRows: cleanedRows.length,
    cleanQualityScore: 100,
    strategy,
    imputationDetails
  };
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseNumericCell(raw) {
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    return Number(raw);
  }
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) {
    return Number(raw.replace(/,/g, ''));
  }
  return null;
}

export function parseCsvText(text) {
  const cleanText = text.replace(/^\uFEFF/, '');
  const lines = cleanText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return { rows: [], columns: [] };
  }

  const headers = splitCsvLine(lines[0]).map((h, i) => h || `column_${i + 1}`);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const row = {};
    headers.forEach((header, idx) => {
      const raw = cells[idx] ?? '';
      if (isMissingValue(raw)) {
        row[header] = null;
      } else {
        const num = parseNumericCell(raw);
        row[header] = num !== null ? num : raw;
      }
    });
    rows.push(row);
  }

  return { rows, columns: headers };
}

export function buildDatasetDocumentInsight(rows, fileName, cleaningStats = {}) {
  const analysis = analyzeDatasetRows(rows);
  const numCols = analysis.numericColumns.filter((c) => !/^(id|.*_id|sr_?no|index)$/i.test(c));
  const metricCols = numCols.length > 0 ? numCols : analysis.numericColumns;

  const metricStats = metricCols.slice(0, 4).map((col) => {
    const vals = rows.map((r) => r[col]).filter((v) => typeof v === 'number' && Number.isFinite(v));
    const { stats } = computeNumericImputation(vals, 'mean');
    const sum = vals.reduce((a, b) => a + b, 0);
    return { col, sum, ...stats };
  });

  const statSummary = metricStats
    .map((m) => `${m.col}: total ${m.sum.toLocaleString()}, avg ${m.mean.toLocaleString()}, max ${m.max.toLocaleString()}`)
    .join('; ');

  const imputationList = (cleaningStats.imputationDetails || [])
    .map((d) => `${d.column} (${d.count} nulls replaced with ${d.value} via ${d.method})`)
    .join(', ');

  const keyPoints = [
    `Dataset contains ${analysis.totalRows} cleaned records across ${analysis.columns.length} columns (${analysis.columns.slice(0, 6).join(', ')}${analysis.columns.length > 6 ? '...' : ''}).`,
    ...(metricStats.length > 0 ? [`Key numeric metrics — ${statSummary}.`] : []),
    ...(imputationList ? [`Null Imputation applied: ${imputationList}.`] : ['Zero missing cells remain after validation.'])
  ];

  const recommendations = [
    'Review the MIS & Data Analytics charts for segment-level breakdowns.',
    'Download the generated Excel report in Reports & Executive Insights for stakeholder distribution.'
  ];

  return {
    id: `dataset-doc-${fileName}`,
    title: fileName,
    docType: fileName.toLowerCase().endsWith('.csv') ? 'CSV' : 'Excel',
    isDatasetDoc: true,
    size: `${Math.max(1, Math.round(JSON.stringify(rows).length / 1024))} KB`,
    pages: Math.max(1, Math.ceil(rows.length / 25)),
    uploadedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'ready',
    summary: `Uploaded dataset "${fileName}" with ${analysis.totalRows} rows and ${analysis.columns.length} columns. ${statSummary || 'Ready for dataset Q&A.'}`,
    keyPoints,
    recommendations
  };
}

export function answerDatasetQuestion(question, rows, fileName, cleaningStats = {}) {
  const analysis = analyzeDatasetRows(rows);
  const qLower = question.toLowerCase();
  const metricCols = analysis.numericColumns;

  if (!rows || rows.length === 0) {
    return {
      answer: `No rows are currently loaded for "${fileName}".`,
      citations: []
    };
  }

  const matchedCols = metricCols.filter((c) => qLower.includes(c.toLowerCase()));
  const targetCols = matchedCols.length > 0 ? matchedCols : metricCols.slice(0, 3);

  if (qLower.includes('null') || qLower.includes('missing') || qLower.includes('clean') || qLower.includes('imput')) {
    const details = cleaningStats.imputationDetails || [];
    if (details.length > 0) {
      const desc = details.map((d) => `• ${d.column}: ${d.count} null(s) replaced with ${d.value} (${d.method})`).join('\n');
      return {
        answer: `In "${fileName}", ${cleaningStats.duplicatesRemoved || 0} duplicate row(s) were removed and ${cleaningStats.missingValuesImputed || 0} missing cell(s) were replaced:\n${desc}`,
        citations: [{ page: 1, text: `${fileName} • Data Cleaning & Imputation Audit` }]
      };
    }
    return {
      answer: `"${fileName}" currently has ${analysis.totalRows} rows and ${analysis.missingCells} missing cells.`,
      citations: [{ page: 1, text: `${fileName} • Schema Audit` }]
    };
  }

  if (targetCols.length > 0) {
    const lines = targetCols.map((col) => {
      const vals = rows.map((r) => r[col]).filter((v) => typeof v === 'number' && Number.isFinite(v));
      const { stats } = computeNumericImputation(vals, 'mean');
      const sum = vals.reduce((a, b) => a + b, 0);
      const min = vals.length ? Math.min(...vals) : 0;
      return `• ${col}: Total = ${sum.toLocaleString()}, Mean = ${stats.mean.toLocaleString()}, Median = ${stats.median.toLocaleString()}, Min = ${min.toLocaleString()}, Max = ${stats.max.toLocaleString()}`;
    });
    return {
      answer: `Computed directly from "${fileName}" (${analysis.totalRows} rows):\n${lines.join('\n')}`,
      citations: targetCols.map((col, idx) => ({ page: idx + 1, text: `Column "${col}" across ${analysis.totalRows} rows` }))
    };
  }

  return {
    answer: `"${fileName}" contains ${analysis.totalRows} rows across columns: ${analysis.columns.join(', ')}.`,
    citations: [{ page: 1, text: `${fileName} • ${analysis.columns.length} columns` }]
  };
}
