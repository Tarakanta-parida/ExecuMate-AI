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

function formatColumnTitle(col) {
  return String(col).replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function isMoneyColumn(col) {
  return /revenue|sales|price|cost|spend|income|salary|budget|profit|amount|value|gmv/i.test(col);
}

function isPercentColumn(col) {
  return /margin|pct|percent|rate|ratio|discount/i.test(col) && !/price|cost/i.test(col);
}

function formatKpiMetricValue(col, num) {
  if (!Number.isFinite(num)) return '0';
  const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (isPercentColumn(col)) return `${formatted}%`;
  if (isMoneyColumn(col)) return `$${formatted}`;
  return formatted;
}

function resolveKpiIconKey(col, aggType = 'total') {
  if (aggType === 'records') return 'records';
  if (aggType === 'columns') return 'columns';
  const name = String(col || '');
  if (/defect|return|error|reject|loss|damage/i.test(name)) return 'defect';
  if (isPercentColumn(name)) return 'percent';
  if (/revenue|sales|total_?amount|amount|spend|income|turnover|gmv|salary|budget|profit/i.test(name)) return 'revenue';
  if (/negotiated_?price|unit_?price|price|cost/i.test(name)) return 'price';
  if (/quantity|qty|units|volume|count|stock|order/i.test(name)) {
    return aggType === 'avg' ? 'avg_quantity' : 'quantity';
  }
  if (aggType === 'max') return 'max';
  if (aggType === 'avg') return 'average';
  return 'metric';
}

export function formatCategoryLabel(col, rawVal) {
  if (rawVal === null || rawVal === undefined || rawVal === '') return 'Unknown';
  const strVal = String(rawVal);
  if (/^sex$/i.test(col)) {
    if (strVal === '1') return 'Male (1)';
    if (strVal === '0') return 'Female (0)';
  }
  if (/^(target|outcome|condition|churn)$/i.test(col)) {
    if (strVal === '1') return 'Positive (1)';
    if (strVal === '0') return 'Negative (0)';
  }
  if (/^survived$/i.test(col)) {
    if (strVal === '1') return 'Survived (1)';
    if (strVal === '0') return 'Not Survived (0)';
  }
  if (/^pclass$/i.test(col)) {
    return `Class ${strVal}`;
  }
  return strVal;
}

export function getDatasetColumnRoles(rows, columns = [], numericColumns = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const numSet = new Set(numericColumns || []);

  const isIdColumn = (col) => /^(id|.*_id|po_?id|sr_?no|index|row_?id)$/i.test(col);
  const isDateColumn = (col) => /date|time|timestamp|period|month|year/i.test(col);

  // Compute distinct value counts (cardinality) using sample
  const cardinality = {};
  const sample = safeRows.slice(0, 1000);
  for (const col of columns) {
    const uniqueVals = new Set();
    for (const r of sample) {
      if (r[col] !== null && r[col] !== undefined && r[col] !== '') {
        uniqueVals.add(r[col]);
      }
    }
    cardinality[col] = uniqueVals.size;
  }

  // 1. String / enum categorical columns
  const textCols = columns.filter((c) => !numSet.has(c) && !isIdColumn(c) && !isDateColumn(c));

  // 2. Discrete numeric columns with low cardinality (e.g. sex: 0/1, target: 0/1, cp: 0/1/2/3, pclass: 1/2/3)
  const discreteNumericCols = columns.filter((c) => {
    if (!numSet.has(c) || isIdColumn(c)) return false;
    const card = cardinality[c] || 0;
    return card >= 2 && card <= 15 && card < safeRows.length;
  });

  const sortedDiscrete = [...discreteNumericCols].sort((a, b) => (cardinality[a] || 0) - (cardinality[b] || 0));
  const categoricalCols = [...textCols, ...sortedDiscrete];

  // Fallback if no categorical columns found: pick non-id columns with lowest cardinality
  if (categoricalCols.length === 0) {
    const nonIdCols = columns.filter((c) => !isIdColumn(c));
    const sortedByCard = [...nonIdCols].sort((a, b) => (cardinality[a] || 0) - (cardinality[b] || 0));
    if (sortedByCard.length > 0) categoricalCols.push(sortedByCard[0]);
    if (sortedByCard.length > 1) categoricalCols.push(sortedByCard[1]);
  }

  // Continuous numeric metrics (higher cardinality or quantitative measurements)
  const continuousMetrics = columns.filter((c) => {
    if (!numSet.has(c) || isIdColumn(c)) return false;
    const card = cardinality[c] || 0;
    return card > 15 || !discreteNumericCols.includes(c);
  });

  const allNumericMetrics = (numericColumns || []).filter((c) => !isIdColumn(c));
  const preferredMetrics = continuousMetrics.length > 0 ? continuousMetrics : allNumericMetrics;

  return {
    categoricalCols,
    textCols,
    discreteNumericCols,
    continuousMetrics: preferredMetrics.length > 0 ? preferredMetrics : (columns.length > 0 ? [columns[0]] : []),
    allMetrics: allNumericMetrics.length > 0 ? allNumericMetrics : (columns.length > 0 ? [columns[0]] : []),
    cardinality
  };
}

/**
 * Build up to 4 pure business KPI cards dynamically from any dataset's rows and numeric columns,
 * strictly ordered from most important (1st) to least important (4th).
 */
export function buildDatasetKpiCards(rows, columns = [], numericColumns = []) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const metrics = numericColumns.filter((c) => !/^(id|.*_id|sr_?no|index|po_?id)$/i.test(c));
  const activeMetrics = metrics.length > 0 ? metrics : numericColumns;

  if (activeMetrics.length === 0) {
    return [
      { label: 'Total Records', value: safeRows.length.toLocaleString(), tone: 'dark', iconKey: 'records' },
      { label: 'Columns Analyzed', value: columns.length.toLocaleString(), tone: 'blue', iconKey: 'columns' }
    ];
  }

  const getVals = (col) =>
    safeRows.map((r) => r[col]).filter((v) => typeof v === 'number' && Number.isFinite(v));
  const sumOf = (col) => getVals(col).reduce((a, b) => a + b, 0);
  const avgOf = (col) => {
    const vals = getVals(col);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const maxOf = (col) => {
    const vals = getVals(col);
    return vals.length > 0 ? Math.max(...vals) : 0;
  };

  const revCol = activeMetrics.find((c) => /revenue|sales|total_?amount|amount|spend|income|turnover|gmv/i.test(c));
  const qtyCol = activeMetrics.find((c) => /quantity|qty|units|volume|count/i.test(c) && !/defect|return|error/i.test(c));
  const priceCol = activeMetrics.find((c) => /negotiated_?price|unit_?price|price|cost|salary|budget/i.test(c));
  const marginCol = activeMetrics.find((c) => /margin|profit|discount|pct|percent/i.test(c));
  const defectCol = activeMetrics.find((c) => /defect|return|error|reject|loss/i.test(c));

  const candidates = [];
  const addCandidate = (card) => {
    if (!candidates.some((c) => c.label === card.label)) {
      candidates.push(card);
    }
  };

  // Priority 100: Headline Revenue / Sales
  if (revCol) {
    addCandidate({
      priority: 100,
      label: `Total ${formatColumnTitle(revCol)}`,
      value: formatKpiMetricValue(revCol, sumOf(revCol)),
      tone: 'dark',
      iconKey: resolveKpiIconKey(revCol, 'total')
    });
    addCandidate({
      priority: 62,
      label: `Avg ${formatColumnTitle(revCol)}`,
      value: formatKpiMetricValue(revCol, avgOf(revCol)),
      tone: 'blue',
      iconKey: resolveKpiIconKey(revCol, 'avg')
    });
  } else if (qtyCol && priceCol) {
    const estRevenue = safeRows.reduce((acc, r) => {
      const q = typeof r[qtyCol] === 'number' ? r[qtyCol] : 0;
      const p = typeof r[priceCol] === 'number' ? r[priceCol] : 0;
      return acc + q * p;
    }, 0);
    addCandidate({
      priority: 100,
      label: 'Total Revenue',
      value: `$${estRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      tone: 'dark',
      iconKey: 'revenue'
    });
  }

  // Priority 90: Margin / Profitability or Salary/Budget Total
  if (marginCol) {
    const isProfitSum = /profit/i.test(marginCol) && !/pct|percent|margin/i.test(marginCol);
    addCandidate({
      priority: 90,
      label: isProfitSum ? `Total ${formatColumnTitle(marginCol)}` : `Avg ${formatColumnTitle(marginCol)}`,
      value: formatKpiMetricValue(marginCol, isProfitSum ? sumOf(marginCol) : avgOf(marginCol)),
      tone: 'emerald',
      iconKey: resolveKpiIconKey(marginCol, isProfitSum ? 'total' : 'avg')
    });
  }

  // Priority 80 / 50: Total Quantity (2nd tier) & Avg Quantity (4th tier)
  if (qtyCol) {
    addCandidate({
      priority: 80,
      label: `Total ${formatColumnTitle(qtyCol)}`,
      value: formatKpiMetricValue(qtyCol, sumOf(qtyCol)),
      tone: 'emerald',
      iconKey: resolveKpiIconKey(qtyCol, 'total')
    });
    addCandidate({
      priority: 50,
      label: `Avg ${formatColumnTitle(qtyCol)}`,
      value: formatKpiMetricValue(qtyCol, avgOf(qtyCol)),
      tone: 'blue',
      iconKey: resolveKpiIconKey(qtyCol, 'avg')
    });
  }

  // Priority 90 / 70 / 60: Price, Cost, Salary, Budget
  if (priceCol) {
    const isAggregateSpend = /cost|salary|budget/i.test(priceCol);
    if (isAggregateSpend) {
      addCandidate({
        priority: /salary|budget/i.test(priceCol) ? 90 : 70,
        label: `Total ${formatColumnTitle(priceCol)}`,
        value: formatKpiMetricValue(priceCol, sumOf(priceCol)),
        tone: 'dark',
        iconKey: resolveKpiIconKey(priceCol, 'total')
      });
    }
    addCandidate({
      priority: 60,
      label: `Avg ${formatColumnTitle(priceCol)}`,
      value: formatKpiMetricValue(priceCol, avgOf(priceCol)),
      tone: 'blue',
      iconKey: resolveKpiIconKey(priceCol, 'avg')
    });
  }

  // Priority 40: Quality / Defect / Risk Metric
  if (defectCol) {
    addCandidate({
      priority: 40,
      label: `Total ${formatColumnTitle(defectCol)}`,
      value: formatKpiMetricValue(defectCol, sumOf(defectCol)),
      tone: 'amber',
      iconKey: resolveKpiIconKey(defectCol, 'total')
    });
  }

  // Fill remaining slots from any other numeric columns (Totals rank ahead of Averages)
  activeMetrics.forEach((col, idx) => {
    if (col === revCol || col === qtyCol || col === priceCol || col === marginCol || col === defectCol) return;
    addCandidate({
      priority: 30 - idx * 0.1,
      label: `Total ${formatColumnTitle(col)}`,
      value: formatKpiMetricValue(col, sumOf(col)),
      tone: idx === 0 ? 'dark' : 'emerald',
      iconKey: resolveKpiIconKey(col, 'total')
    });
    addCandidate({
      priority: 20 - idx * 0.1,
      label: `Avg ${formatColumnTitle(col)}`,
      value: formatKpiMetricValue(col, avgOf(col)),
      tone: 'blue',
      iconKey: resolveKpiIconKey(col, 'avg')
    });
  });

  // Fallback Max if dataset has only 1 numeric column
  if (candidates.length < 4 && activeMetrics[0]) {
    const c0 = activeMetrics[0];
    addCandidate({
      priority: 10,
      label: `Max ${formatColumnTitle(c0)}`,
      value: formatKpiMetricValue(c0, maxOf(c0)),
      tone: 'amber',
      iconKey: resolveKpiIconKey(c0, 'max')
    });
  }

  return candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4)
    .map(({ priority: _priority, ...card }) => card);
}

function extractTimeBucket(rawVal) {
  if (!rawVal) return null;
  const str = String(rawVal).trim();
  const isoMatch = /^(\d{4})-(\d{2})(?:-\d{2})?/.exec(str);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`;
  const parsed = Date.parse(str);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${d.getUTCFullYear()}-${m}`;
  }
  return null;
}

/**
 * Build data for two distinct business-impact charts:
 * 1) AreaChart: Time-series Financial Value & Cost Savings / Cost Trend
 * 2) ComposedChart (Bar + Line): Operational Quality Risk / Margin / Fulfillment Impact
 */
export function buildBusinessImpactCharts(rows, columns = [], numericColumns = [], preferredGroupCol = '') {
  const safeRows = Array.isArray(rows) ? rows : [];
  const roles = getDatasetColumnRoles(safeRows, columns, numericColumns);
  const textCols = roles.categoricalCols;
  const activeMetrics = roles.continuousMetrics.length > 0 ? roles.continuousMetrics : roles.allMetrics;

  const qtyCol = activeMetrics.find((c) => /quantity|qty|units|volume|count/i.test(c) && !/defect|return|error/i.test(c));
  const revCol = activeMetrics.find((c) => /revenue|sales|total_?amount|amount|spend|income|turnover|gmv/i.test(c));
  const costCol = activeMetrics.find((c) => /^cost$|total_?cost|expense/i.test(c));
  const unitPriceCol = activeMetrics.find((c) => /unit_?price|list_?price/i.test(c));
  const negPriceCol = activeMetrics.find((c) => /negotiated_?price|sale_?price|discounted_?price/i.test(c));
  const priceCol = negPriceCol || unitPriceCol || activeMetrics.find((c) => /price|rate|salary|budget/i.test(c));
  const defectCol = activeMetrics.find((c) => /defect|return|error|reject|loss/i.test(c));
  const marginCol = activeMetrics.find((c) => /margin|profit|discount|pct|percent/i.test(c));
  const statusCol = textCols.find((c) => /order_?status|status|compliance|tier|region/i.test(c));
  const dateCol = columns.find((c) => /order_?date|date|month|period|created/i.test(c));

  // --- Chart 3: AreaChart (Financial Value & Savings / Cost Trend) ---
  let trendTitle = 'Business Value Trend';
  let trendSubtitle = 'Financial impact over time';
  let primaryLabel = 'Value';
  let secondaryLabel = null;
  let trendIsCurrency = false;

  const hasSavingsPair = Boolean(qtyCol && unitPriceCol && negPriceCol);
  const hasRevCostPair = Boolean(revCol && costCol);

  if (hasSavingsPair) {
    trendTitle = 'Contract Spend & Negotiation Savings Trend';
    trendSubtitle = 'Negotiated contract value vs cost savings achieved';
    primaryLabel = 'Contract Value';
    secondaryLabel = 'Negotiated Savings';
    trendIsCurrency = true;
  } else if (hasRevCostPair) {
    trendTitle = 'Revenue vs Cost Trend';
    trendSubtitle = 'Gross revenue compared against operating cost';
    primaryLabel = 'Revenue';
    secondaryLabel = 'Cost';
    trendIsCurrency = true;
  } else if (revCol) {
    trendTitle = `${formatColumnTitle(revCol)} Performance Trend`;
    trendSubtitle = 'Cumulative revenue impact across periods';
    primaryLabel = formatColumnTitle(revCol);
    trendIsCurrency = true;
  } else if (qtyCol && priceCol) {
    trendTitle = 'Estimated Revenue Trend';
    trendSubtitle = 'Derived transaction value over time';
    primaryLabel = 'Estimated Revenue';
    trendIsCurrency = true;
  } else if (activeMetrics.length > 0) {
    const m0 = activeMetrics[0];
    const m1 = activeMetrics[1] || null;
    trendTitle = m1
      ? `${formatColumnTitle(m0)} vs ${formatColumnTitle(m1)} Trend`
      : `${formatColumnTitle(m0)} Trend`;
    trendSubtitle = 'Performance trajectory across dataset';
    primaryLabel = formatColumnTitle(m0);
    secondaryLabel = m1 ? formatColumnTitle(m1) : null;
    trendIsCurrency = isMoneyColumn(m0);
  }

  const trendBuckets = {};
  const useDateBuckets = Boolean(
    dateCol && safeRows.some((r) => extractTimeBucket(r[dateCol]) !== null)
  );
  const fallbackTrendGroup = textCols[0] || columns[0] || 'Segment';

  for (const r of safeRows) {
    const bucket = useDateBuckets
      ? (extractTimeBucket(r[dateCol]) || 'Unknown')
      : String(r[fallbackTrendGroup] ?? 'Segment');
    if (bucket === 'Unknown' && useDateBuckets) continue;

    if (!trendBuckets[bucket]) {
      trendBuckets[bucket] = { label: bucket, primary: 0, secondary: 0 };
    }

    if (hasSavingsPair) {
      const q = typeof r[qtyCol] === 'number' ? r[qtyCol] : 0;
      const up = typeof r[unitPriceCol] === 'number' ? r[unitPriceCol] : 0;
      const np = typeof r[negPriceCol] === 'number' ? r[negPriceCol] : up;
      trendBuckets[bucket].primary += q * np;
      trendBuckets[bucket].secondary += q * Math.max(0, up - np);
    } else if (hasRevCostPair) {
      trendBuckets[bucket].primary += typeof r[revCol] === 'number' ? r[revCol] : 0;
      trendBuckets[bucket].secondary += typeof r[costCol] === 'number' ? r[costCol] : 0;
    } else if (revCol) {
      trendBuckets[bucket].primary += typeof r[revCol] === 'number' ? r[revCol] : 0;
    } else if (qtyCol && priceCol) {
      const q = typeof r[qtyCol] === 'number' ? r[qtyCol] : 0;
      const p = typeof r[priceCol] === 'number' ? r[priceCol] : 0;
      trendBuckets[bucket].primary += q * p;
    } else if (activeMetrics.length > 0) {
      const m0 = activeMetrics[0];
      const m1 = activeMetrics[1];
      trendBuckets[bucket].primary += typeof r[m0] === 'number' ? r[m0] : 0;
      if (m1) {
        trendBuckets[bucket].secondary += typeof r[m1] === 'number' ? r[m1] : 0;
      }
    }
  }

  let trendData = Object.values(trendBuckets).map((item) => ({
    label: item.label,
    primary: Number(item.primary.toFixed(2)),
    secondary: secondaryLabel ? Number(item.secondary.toFixed(2)) : undefined
  }));

  if (useDateBuckets) {
    trendData.sort((a, b) => a.label.localeCompare(b.label));
    if (trendData.length > 18) {
      trendData = trendData.slice(-18);
    }
  } else {
    trendData.sort((a, b) => b.primary - a.primary);
    trendData = trendData.slice(0, 8);
  }

  // --- Chart 4: ComposedChart (Bar + Line Dual-Axis Risk & Operational Impact) ---
  const impactGroupCol =
    (defectCol && textCols[0]) ||
    statusCol ||
    (preferredGroupCol && textCols.includes(preferredGroupCol) && preferredGroupCol) ||
    textCols[0] ||
    columns[0] ||
    'Category';

  let impactTitle = 'Operational Risk & Efficiency Impact';
  let impactSubtitle = 'Volume vs efficiency rate';
  let barLabel = 'Impact';
  let lineLabel = 'Rate';
  let barIsCurrency = false;
  let lineSuffix = '';

  const impactGroups = {};
  for (const r of safeRows) {
    const rawVal = r[impactGroupCol];
    const key = formatCategoryLabel(impactGroupCol, rawVal);
    if (!impactGroups[key]) {
      impactGroups[key] = { label: key, count: 0, qtySum: 0, defectSum: 0, revSum: 0, marginSum: 0, m0Sum: 0, m1Sum: 0 };
    }
    const g = impactGroups[key];
    g.count += 1;
    if (qtyCol && typeof r[qtyCol] === 'number') g.qtySum += r[qtyCol];
    if (defectCol && typeof r[defectCol] === 'number') g.defectSum += r[defectCol];
    if (revCol && typeof r[revCol] === 'number') {
      g.revSum += r[revCol];
    } else if (qtyCol && priceCol) {
      const q = typeof r[qtyCol] === 'number' ? r[qtyCol] : 0;
      const p = typeof r[priceCol] === 'number' ? r[priceCol] : 0;
      g.revSum += q * p;
    }
    if (marginCol && typeof r[marginCol] === 'number') g.marginSum += r[marginCol];
    if (activeMetrics[0] && typeof r[activeMetrics[0]] === 'number') g.m0Sum += r[activeMetrics[0]];
    if (activeMetrics[1] && typeof r[activeMetrics[1]] === 'number') g.m1Sum += r[activeMetrics[1]];
  }

  let impactData = [];
  if (defectCol && qtyCol) {
    impactTitle = `Quality Risk & Defect Rate by ${formatColumnTitle(impactGroupCol)}`;
    impactSubtitle = `${formatColumnTitle(defectCol)} (bars) vs Defect Rate % (line)`;
    barLabel = formatColumnTitle(defectCol);
    lineLabel = 'Defect Rate';
    lineSuffix = '%';
    impactData = Object.values(impactGroups).map((g) => ({
      label: g.label,
      barValue: Number(g.defectSum.toFixed(1)),
      lineValue: g.qtySum > 0 ? Number(((g.defectSum / g.qtySum) * 100).toFixed(2)) : 0
    }));
  } else if (marginCol && (revCol || qtyCol)) {
    impactTitle = `Revenue vs Margin Efficiency by ${formatColumnTitle(impactGroupCol)}`;
    impactSubtitle = 'Total revenue (bars) vs average margin % (line)';
    barLabel = revCol ? formatColumnTitle(revCol) : 'Revenue';
    lineLabel = `Avg ${formatColumnTitle(marginCol)}`;
    barIsCurrency = true;
    lineSuffix = '%';
    impactData = Object.values(impactGroups).map((g) => ({
      label: g.label,
      barValue: Number(g.revSum.toFixed(2)),
      lineValue: g.count > 0 ? Number((g.marginSum / g.count).toFixed(1)) : 0
    }));
  } else if (revCol || (qtyCol && priceCol)) {
    impactTitle = `Business Value & Order Volume by ${formatColumnTitle(impactGroupCol)}`;
    impactSubtitle = 'Total value (bars) vs order count (line)';
    barLabel = 'Total Value';
    lineLabel = 'Orders';
    barIsCurrency = true;
    impactData = Object.values(impactGroups).map((g) => ({
      label: g.label,
      barValue: Number(g.revSum.toFixed(2)),
      lineValue: g.count
    }));
  } else {
    const m0 = activeMetrics[0] || 'Value';
    const m1 = activeMetrics[1] || activeMetrics[0] || 'Average';
    impactTitle = `${formatColumnTitle(m0)} & Avg ${formatColumnTitle(m1)} by ${formatColumnTitle(impactGroupCol)}`;
    impactSubtitle = 'Total volume (bars) vs per-record average (line)';
    barLabel = formatColumnTitle(m0);
    lineLabel = `Avg ${formatColumnTitle(m1)}`;
    impactData = Object.values(impactGroups).map((g) => ({
      label: g.label,
      barValue: Number(g.m0Sum.toFixed(2)),
      lineValue: g.count > 0 ? Number((g.m1Sum / g.count).toFixed(1)) : 0
    }));
  }

  impactData = impactData
    .sort((a, b) => b.barValue - a.barValue)
    .slice(0, 8);

  return {
    trend: {
      title: trendTitle,
      subtitle: trendSubtitle,
      primaryLabel,
      secondaryLabel,
      isCurrency: trendIsCurrency,
      data: trendData
    },
    impact: {
      title: impactTitle,
      subtitle: impactSubtitle,
      barLabel,
      lineLabel,
      barIsCurrency,
      lineSuffix,
      data: impactData
    }
  };
}
