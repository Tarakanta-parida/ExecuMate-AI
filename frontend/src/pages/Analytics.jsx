import React, { useState, useMemo, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  BarChart2,
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  ArrowUpDown,
  Trash2,
  Package,
  Tag,
  Activity,
  Award,
  Database
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  Line
} from 'recharts';
import { useApp } from '../context/AppContext';
import { buildDatasetKpiCards, buildBusinessImpactCharts } from '../utils/dataCleaning';

const KPI_ICON_MAP = {
  revenue: { Icon: DollarSign, badgeClass: 'bg-emerald-50 text-emerald-600' },
  price: { Icon: Tag, badgeClass: 'bg-indigo-50 text-indigo-600' },
  avg_quantity: { Icon: TrendingUp, badgeClass: 'bg-blue-50 text-[#2563EB]' },
  quantity: { Icon: Package, badgeClass: 'bg-violet-50 text-violet-600' },
  percent: { Icon: Percent, badgeClass: 'bg-emerald-50 text-emerald-600' },
  defect: { Icon: AlertTriangle, badgeClass: 'bg-amber-50 text-amber-600' },
  max: { Icon: Award, badgeClass: 'bg-amber-50 text-amber-600' },
  records: { Icon: Database, badgeClass: 'bg-slate-100 text-slate-600' },
  columns: { Icon: Layers, badgeClass: 'bg-blue-50 text-[#2563EB]' },
  average: { Icon: TrendingUp, badgeClass: 'bg-blue-50 text-[#2563EB]' },
  metric: { Icon: Activity, badgeClass: 'bg-blue-50 text-[#2563EB]' }
};

export default function Analytics() {
  const {
    dataset,
    datasetName,
    datasetAnalysis,
    imputationStrategy,
    setImputationStrategy,
    isDataCleaned,
    cleaningStats,
    cleanData,
    resetData,
    loadUploadedDataset,
    clearDataset,
    isDatasetUploading,
    generateReportFromData,
    exportCleanedCsv
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [sortField, setSortField] = useState('revenue');
  const [sortDirection, setSortDirection] = useState('desc');
  const [slicerColumn, setSlicerColumn] = useState('');
  const [slicerValue, setSlicerValue] = useState('All');
  const [chartMetric, setChartMetric] = useState('');
  const [hoveredPieIndex, setHoveredPieIndex] = useState(null);

  const isStandardSchema = useMemo(() => {
    if (!dataset || dataset.length === 0) return true;
    const cols = Object.keys(dataset[0]);
    return ['id', 'date', 'region', 'category', 'units', 'revenue', 'margin'].every((k) => cols.includes(k));
  }, [dataset]);

  const dynamicColumns = useMemo(() => {
    if (!dataset || dataset.length === 0) return [];
    return Object.keys(dataset[0]);
  }, [dataset]);

  const numericMetrics = useMemo(() => {
    const numCols = datasetAnalysis.numericColumns || [];
    const nonId = numCols.filter((c) => !/^(id|.*_id|sr_?no|index|po_?id)$/i.test(c));
    return nonId.length > 0 ? nonId : numCols;
  }, [datasetAnalysis.numericColumns]);

  const slicerColumns = useMemo(() => {
    const numSet = new Set(datasetAnalysis.numericColumns || []);
    const categorical = dynamicColumns.filter(
      (c) => !numSet.has(c) && !/^(id|.*_id|po_?id|sr_?no|index)$/i.test(c) && !/date|time/i.test(c)
    );
    if (categorical.length > 0) return categorical;
    return dynamicColumns.filter((c) => !numSet.has(c));
  }, [dynamicColumns, datasetAnalysis.numericColumns]);

  // Reset slicer & chart metric when a new dataset is loaded
  useEffect(() => {
    setSlicerColumn(slicerColumns[0] || '');
    setSlicerValue('All');
    setChartMetric(numericMetrics[0] || '');
  }, [datasetName, slicerColumns.join('|'), numericMetrics.join('|')]);

  const slicerOptions = useMemo(() => {
    if (!slicerColumn || !dataset || dataset.length === 0) return [];
    const counts = {};
    for (const r of dataset) {
      const val = r[slicerColumn] !== null && r[slicerColumn] !== undefined ? String(r[slicerColumn]) : 'Unknown';
      counts[val] = (counts[val] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count }));
  }, [dataset, slicerColumn]);

  const slicedDataset = useMemo(() => {
    if (!slicerColumn || slicerValue === 'All') return dataset;
    return dataset.filter((r) => {
      const val = r[slicerColumn] !== null && r[slicerColumn] !== undefined ? String(r[slicerColumn]) : 'Unknown';
      return val === slicerValue;
    });
  }, [dataset, slicerColumn, slicerValue]);

  const dynamicKpiCards = useMemo(() => {
    return buildDatasetKpiCards(slicedDataset, dynamicColumns, datasetAnalysis.numericColumns);
  }, [slicedDataset, dynamicColumns, datasetAnalysis.numericColumns]);

  const businessImpactCharts = useMemo(() => {
    return buildBusinessImpactCharts(slicedDataset, dynamicColumns, datasetAnalysis.numericColumns, slicerColumn);
  }, [slicedDataset, dynamicColumns, datasetAnalysis.numericColumns, slicerColumn]);

  const customProfile = useMemo(() => {
    if (isStandardSchema || !slicedDataset || slicedDataset.length === 0) return null;
    const metricCol = (chartMetric && numericMetrics.includes(chartMetric)) ? chartMetric : numericMetrics[0] || null;

    const textCols = slicerColumns.length > 0 ? slicerColumns : dynamicColumns.filter((c) => !numericMetrics.includes(c));
    const groupCol = slicerColumn && textCols.includes(slicerColumn) ? slicerColumn : textCols[0] || null;
    const altGroupCol = textCols.find((c) => c !== groupCol) || groupCol;

    const barMap = {};
    const pieMap = {};
    if (groupCol) {
      for (const r of slicedDataset) {
        const gKey = r[groupCol] !== null && r[groupCol] !== undefined ? String(r[groupCol]) : 'Unknown';
        const val = metricCol && typeof r[metricCol] === 'number' ? r[metricCol] : 1;
        barMap[gKey] = (barMap[gKey] || 0) + val;
      }
    }
    if (altGroupCol) {
      for (const r of slicedDataset) {
        const pKey = r[altGroupCol] !== null && r[altGroupCol] !== undefined ? String(r[altGroupCol]) : 'Other';
        const val = metricCol && typeof r[metricCol] === 'number' ? r[metricCol] : 1;
        pieMap[pKey] = (pieMap[pKey] || 0) + val;
      }
    }

    const barData = Object.entries(barMap)
      .map(([name, value]) => ({ region: name, revenue: Number(value.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const pieData = Object.entries(pieMap)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return {
      metricCol,
      groupCol,
      altGroupCol,
      barData,
      pieData
    };
  }, [isStandardSchema, slicedDataset, numericMetrics, slicerColumns, dynamicColumns, slicerColumn, chartMetric]);

  // Chart aggregates by Region (respects active slicer)
  const regionChartData = useMemo(() => {
    if (!isStandardSchema && customProfile) {
      return customProfile.barData;
    }
    const map = {};
    for (const r of slicedDataset) {
      const reg = r.region || 'Unknown';
      if (!map[reg]) map[reg] = { region: reg, revenue: 0, units: 0 };
      if (typeof r.revenue === 'number') map[reg].revenue += r.revenue;
      if (typeof r.units === 'number') map[reg].units += r.units;
    }
    return Object.values(map);
  }, [slicedDataset, isStandardSchema, customProfile]);

  // Chart aggregates by Category (respects active slicer)
  const categoryChartData = useMemo(() => {
    if (!isStandardSchema && customProfile) {
      return customProfile.pieData;
    }
    const map = {};
    for (const r of slicedDataset) {
      const cat = r.category || 'Other';
      if (!map[cat]) map[cat] = { name: cat, value: 0 };
      if (typeof r.revenue === 'number') map[cat].value += r.revenue;
    }
    return Object.values(map);
  }, [slicedDataset, isStandardSchema, customProfile]);

  const COLORS = ['#2563EB', '#16A34A', '#D97706', '#9333EA', '#0EA5E9', '#EC4899'];

  const pieTotal = useMemo(
    () => categoryChartData.reduce((acc, item) => acc + (Number(item.value) || 0), 0),
    [categoryChartData]
  );

  const activePieItem =
    hoveredPieIndex !== null && categoryChartData[hoveredPieIndex]
      ? categoryChartData[hoveredPieIndex]
      : null;

  const renderPieTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0];
    const sliceName = item.name ?? item.payload?.name ?? 'Segment';
    const rawVal = Number(item.value) || 0;
    const pct = pieTotal > 0 ? ((rawVal / pieTotal) * 100).toFixed(1) : '0.0';
    const metricTitle = isStandardSchema ? 'Revenue' : (customProfile?.metricCol || 'Value').replace(/_/g, ' ');
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-md text-xs z-50">
        <div className="font-bold text-[#1E293B] flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.payload?.fill || COLORS[0] }}
          />
          <span>{sliceName}</span>
        </div>
        <div className="text-[#475569] mt-1 font-medium">
          {metricTitle}:{' '}
          <strong className="text-[#1E293B]">
            {isStandardSchema ? `$${rawVal.toLocaleString()}` : rawVal.toLocaleString()}
          </strong>{' '}
          <span className="text-[#64748B]">({pct}%)</span>
        </div>
      </div>
    );
  };

  const renderCartesianTooltip = (valueFormatter) => ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const sectionName = label || payload[0]?.payload?.region || payload[0]?.payload?.label || 'Segment';
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-md text-xs z-50 space-y-1">
        <div className="font-bold text-[#1E293B] border-b border-[#F1F5F9] pb-1">{sectionName}</div>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-[#475569]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || '#2563EB' }} />
              <span>{entry.name}:</span>
            </span>
            <strong className="text-[#1E293B]">{valueFormatter(entry.value, entry.name)}</strong>
          </div>
        ))}
      </div>
    );
  };

  const availableRegions = useMemo(() => {
    const regs = new Set();
    for (const r of dataset) {
      if (r.region) regs.add(r.region);
    }
    return Array.from(regs);
  }, [dataset]);

  // Filter & sort dataset for the preview table (respects active slicer)
  const filteredData = useMemo(() => {
    return slicedDataset
      .filter((row) => {
        const matchesRegion = !isStandardSchema || selectedRegion === 'All' || row.region === selectedRegion;
        const matchesSearch =
          searchTerm === '' ||
          Object.values(row).some((v) =>
            v !== null && v !== undefined && String(v).toLowerCase().includes(searchTerm.toLowerCase())
          );
        return matchesRegion && matchesSearch;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [slicedDataset, isStandardSchema, searchTerm, selectedRegion, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await loadUploadedDataset(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1E293B] flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-[#2563EB]" />
            MIS & Data Analytics Engine
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Automated dataset ingestion, duplicate cleansing, null-imputation, and Excel MIS reports
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className={`inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#CBD5E1] hover:border-blue-300 text-[#1E293B] rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors ${isDatasetUploading ? 'opacity-60 pointer-events-none' : ''}`}>
            <Upload className="w-4 h-4 text-[#2563EB]" />
            <span>{isDatasetUploading ? 'Uploading...' : 'Upload CSV / Excel'}</span>
            <input type="file" accept=".csv, .xlsx, .xls" className="hidden" disabled={isDatasetUploading} onChange={handleFileUpload} />
          </label>

          {dataset.length > 0 && (
            <>
              <select
                value={imputationStrategy}
                onChange={(e) => {
                  const nextStrategy = e.target.value;
                  setImputationStrategy(nextStrategy);
                  if (isDataCleaned) {
                    cleanData(nextStrategy);
                  }
                }}
                aria-label="Numerical null imputation method"
                title="Choose how numerical NULL values are replaced"
                className="px-3 py-2 bg-white border border-[#CBD5E1] hover:border-blue-300 text-[#1E293B] rounded-lg text-xs font-semibold shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="auto">Nulls: Auto (By Dataset)</option>
                <option value="mean">Nulls: Mean</option>
                <option value="median">Nulls: Median</option>
                <option value="max">Nulls: Max</option>
              </select>

              <button
                onClick={() => cleanData()}
                disabled={isDataCleaned}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-all ${
                  isDataCleaned
                    ? 'bg-emerald-600 opacity-90 cursor-default'
                    : 'bg-[#2563EB] hover:bg-blue-700'
                }`}
              >
                {isDataCleaned ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Data Cleaned
                  </>
                ) : (
                  <>
                    <Filter className="w-4 h-4" /> Clean my data
                  </>
                )}
              </button>

              <button
                onClick={() => generateReportFromData(undefined, 'Executive MIS', true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                title="Generate and download Excel MIS report for this analyzed dataset"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>

              {isDataCleaned && (
                <button
                  onClick={resetData}
                  className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-white rounded-lg border border-[#E2E8F0] transition-colors"
                  title="Reset to raw uploaded data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={clearDataset}
                className="p-2 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg border border-[#E2E8F0] transition-colors"
                title="Remove uploaded dataset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {dataset.length === 0 ? (
        <div className="bg-white border border-dashed border-[#CBD5E1] rounded-xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1E293B]">No Dataset Uploaded Yet</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
            Upload any CSV or Excel (`.xlsx` / `.xls`) file from your computer to clean numerical nulls (using mean, median, or max), visualize KPIs, and generate a tailored MIS report.
          </p>
          <label className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors">
            <Upload className="w-4 h-4" />
            <span>Upload CSV / Excel Dataset</span>
            <input type="file" accept=".csv, .xlsx, .xls" className="hidden" disabled={isDatasetUploading} onChange={handleFileUpload} />
          </label>
        </div>
      ) : (
        <>

      {/* Dataset Health & Audit Overview */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#1E293B]">{datasetName}</span>
                {isDataCleaned ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    CLEANSED & AUDITED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> RAW / DIRTY DATASET
                  </span>
                )}
              </div>
              <div className="text-xs text-[#64748B] mt-0.5">
                {dataset.length} Rows • {datasetAnalysis.columns.length} Columns • Ingested via Pandas Engine
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-[#64748B] block text-[11px]">Quality Score</span>
              <span className="font-bold text-sm text-[#1E293B]">
                {isDataCleaned ? `${cleaningStats.cleanQualityScore}%` : `${datasetAnalysis.qualityScore}%`}
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Duplicates</span>
              <span className={`font-bold text-sm ${isDataCleaned || datasetAnalysis.duplicateCount === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isDataCleaned
                  ? `${cleaningStats.duplicatesRemoved} removed`
                  : `${datasetAnalysis.duplicateCount} detected`}
              </span>
            </div>
            <div>
              <span className="text-[#64748B] block text-[11px]">Missing Cells</span>
              <span className={`font-bold text-sm ${isDataCleaned || datasetAnalysis.missingCells === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isDataCleaned
                  ? `${cleaningStats.missingValuesImputed} imputed`
                  : `${datasetAnalysis.missingCells} missing`}
              </span>
            </div>
          </div>
        </div>

        {isDataCleaned && cleaningStats.imputationDetails?.length > 0 && (
          <div className="mt-3 px-3 py-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex flex-wrap items-center gap-2 text-xs text-emerald-900">
            <span className="font-semibold">Null Imputation Applied:</span>
            {cleaningStats.imputationDetails.map((item) => (
              <span
                key={item.column}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-emerald-200 rounded text-[11px] font-medium"
              >
                <span className="font-semibold">{item.column}</span>
                <span>→</span>
                <span className="font-bold text-emerald-700">{item.value}</span>
                <span className="text-[#64748B]">({item.method})</span>
              </span>
            ))}
          </div>
        )}

        {/* Interactive Slicer */}
        {slicerColumns.length > 0 && (
          <div className="mt-4 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#1E293B] uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-[#2563EB]" /> Slicer
                </span>
                <select
                  value={slicerColumn}
                  onChange={(e) => {
                    setSlicerColumn(e.target.value);
                    setSlicerValue('All');
                  }}
                  aria-label="Slicer column"
                  className="bg-white border border-[#CBD5E1] rounded-md px-2 py-1 text-xs font-semibold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {slicerColumns.map((col) => (
                    <option key={col} value={col}>{col.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <select
                  value={slicerValue}
                  onChange={(e) => setSlicerValue(e.target.value)}
                  aria-label="Slicer value"
                  className="bg-white border border-[#CBD5E1] rounded-md px-2 py-1 text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
                >
                  <option value="All">All ({dataset.length})</option>
                  {slicerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value} ({opt.count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                <span>
                  Showing <strong className="text-[#1E293B]">{slicedDataset.length}</strong> of {dataset.length} rows
                </span>
                {slicerValue !== 'All' && (
                  <button
                    onClick={() => setSlicerValue('All')}
                    className="text-[#2563EB] hover:underline font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSlicerValue('All')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  slicerValue === 'All'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-blue-300'
                }`}
              >
                All
              </button>
              {slicerOptions.slice(0, 8).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSlicerValue(slicerValue === opt.value ? 'All' : opt.value)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    slicerValue === opt.value
                      ? 'bg-[#2563EB] text-white shadow-2xs'
                      : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-blue-300'
                  }`}
                >
                  {opt.value} <span className="opacity-70">({opt.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic KPI Bar (Pure KPIs with semantic icons reacting to Slicer) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          {dynamicKpiCards.map((kpi, idx) => {
            const valueColor =
              kpi.tone === 'emerald'
                ? 'text-emerald-600'
                : kpi.tone === 'blue'
                  ? 'text-[#2563EB]'
                  : kpi.tone === 'amber'
                    ? 'text-amber-600'
                    : 'text-[#1E293B]';
            const iconMeta = KPI_ICON_MAP[kpi.iconKey] || KPI_ICON_MAP.metric;
            const KpiIcon = iconMeta.Icon;
            return (
              <div
                key={idx}
                className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0]/70 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase truncate block">
                    {kpi.label}
                  </span>
                  <div className={`text-lg font-bold mt-0.5 truncate ${valueColor}`}>
                    {kpi.value}
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconMeta.badgeClass}`}>
                  <KpiIcon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                {isStandardSchema
                  ? 'Revenue by Geographic Region'
                  : customProfile?.groupCol
                    ? `${(customProfile.metricCol || 'Count').replace(/_/g, ' ')} by ${customProfile.groupCol.replace(/_/g, ' ')}`
                    : 'Dataset Breakdown'}
              </h2>
              <p className="text-xs text-[#64748B]">
                {isStandardSchema
                  ? 'Consolidated gross revenue breakdown ($USD)'
                  : `Aggregated from ${datasetName}${slicerValue !== 'All' ? ` • ${slicerColumn}: ${slicerValue}` : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isStandardSchema && numericMetrics.length > 1 && (
                <select
                  value={chartMetric}
                  onChange={(e) => setChartMetric(e.target.value)}
                  aria-label="Chart metric"
                  className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2 py-1 text-[#1E293B] font-semibold focus:outline-none"
                >
                  {numericMetrics.map((m) => (
                    <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              )}
              <span className="text-xs font-semibold text-[#2563EB] bg-blue-50 px-2 py-1 rounded">
                Aggregated
              </span>
            </div>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="region" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) =>
                    isStandardSchema
                      ? `$${v / 1000}k`
                      : v >= 1000
                        ? `${(v / 1000).toFixed(1)}k`
                        : `${v}`
                  }
                />
                <Tooltip
                  content={renderCartesianTooltip((v) =>
                    isStandardSchema ? `$${Number(v).toLocaleString()}` : Number(v).toLocaleString()
                  )}
                />
                <Bar
                  dataKey="revenue"
                  name={isStandardSchema ? 'Revenue' : (customProfile?.metricCol || 'Count').replace(/_/g, ' ')}
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E293B]">
              {isStandardSchema
                ? 'Revenue by Category'
                : customProfile?.altGroupCol
                  ? `Share by ${customProfile.altGroupCol}`
                  : 'Distribution'}
            </h2>
            <p className="text-xs text-[#64748B] mb-2">
              {isStandardSchema ? 'Mix of Cloud SaaS vs Hardware vs Services' : 'Top segment breakdown'}
            </p>
            <div className="h-48 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={74}
                    paddingAngle={3}
                    onMouseEnter={(_, idx) => setHoveredPieIndex(idx)}
                    onMouseLeave={() => setHoveredPieIndex(null)}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        opacity={hoveredPieIndex === null || hoveredPieIndex === index ? 1 : 0.45}
                        style={{ cursor: 'pointer', transition: 'opacity 150ms ease' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={renderPieTooltip} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center label displaying active pointed slice name & exact number */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B] truncate max-w-[82px]">
                  {activePieItem ? activePieItem.name : 'Total'}
                </span>
                <span className="text-xs font-bold text-[#1E293B] truncate max-w-[88px]">
                  {isStandardSchema
                    ? `$${Math.round(activePieItem ? activePieItem.value : pieTotal).toLocaleString()}`
                    : (activePieItem ? activePieItem.value : pieTotal).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#F1F5F9]">
            {categoryChartData.map((cat, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredPieIndex(idx)}
                onMouseLeave={() => setHoveredPieIndex(null)}
                className={`flex items-center justify-between text-xs px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  hoveredPieIndex === idx ? 'bg-blue-50/80' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[#1E293B] font-medium truncate">{cat.name}</span>
                </div>
                <span className="font-semibold text-[#64748B] shrink-0">
                  {isStandardSchema
                    ? `$${cat.value.toLocaleString()}`
                    : cat.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Business Impact Charts (Area Trend + Dual-Axis Composed Risk/Efficiency) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Area Chart — Business Value & Cost Savings / Cost Trend */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">{businessImpactCharts.trend.title}</h2>
              <p className="text-xs text-[#64748B]">{businessImpactCharts.trend.subtitle}</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded shrink-0">
              Business Impact
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={businessImpactCharts.trend.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="impactPrimaryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="impactSecondaryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => {
                    const prefix = businessImpactCharts.trend.isCurrency ? '$' : '';
                    if (v >= 1000000) return `${prefix}${(v / 1000000).toFixed(1)}M`;
                    if (v >= 1000) return `${prefix}${(v / 1000).toFixed(0)}k`;
                    return `${prefix}${v}`;
                  }}
                />
                <Tooltip
                  content={renderCartesianTooltip((v) =>
                    `${businessImpactCharts.trend.isCurrency ? '$' : ''}${Number(v).toLocaleString()}`
                  )}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="primary"
                  name={businessImpactCharts.trend.primaryLabel}
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#impactPrimaryGrad)"
                />
                {businessImpactCharts.trend.secondaryLabel && (
                  <Area
                    type="monotone"
                    dataKey="secondary"
                    name={businessImpactCharts.trend.secondaryLabel}
                    stroke="#16A34A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#impactSecondaryGrad)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Composed Dual-Axis Chart (Bar + Line) — Quality Risk / Efficiency Impact */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">{businessImpactCharts.impact.title}</h2>
              <p className="text-xs text-[#64748B]">{businessImpactCharts.impact.subtitle}</p>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded shrink-0">
              Risk &amp; Efficiency
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={businessImpactCharts.impact.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => {
                    const prefix = businessImpactCharts.impact.barIsCurrency ? '$' : '';
                    if (v >= 1000000) return `${prefix}${(v / 1000000).toFixed(1)}M`;
                    if (v >= 1000) return `${prefix}${(v / 1000).toFixed(0)}k`;
                    return `${prefix}${v}`;
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${v}${businessImpactCharts.impact.lineSuffix}`}
                />
                <Tooltip
                  content={renderCartesianTooltip((v, name) =>
                    name === businessImpactCharts.impact.lineLabel
                      ? `${Number(v).toLocaleString()}${businessImpactCharts.impact.lineSuffix}`
                      : `${businessImpactCharts.impact.barIsCurrency ? '$' : ''}${Number(v).toLocaleString()}`
                  )}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="barValue"
                  name={businessImpactCharts.impact.barLabel}
                  fill="#D97706"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="lineValue"
                  name={businessImpactCharts.impact.lineLabel}
                  stroke="#7C3AED"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#7C3AED' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Data Table Preview */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
        {/* Table Controls */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">Data Preview</span>
            <span className="text-[11px] text-[#64748B]">({filteredData.length} of {dataset.length} rows shown)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#1E293B] focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Region Filter */}
            {isStandardSchema && availableRegions.length > 0 && (
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-[#1E293B] focus:outline-none focus:bg-white"
              >
                <option value="All">All Regions</option>
                {availableRegions.map((reg) => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => exportCleanedCsv(filteredData, datasetName)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-lg text-xs font-semibold transition-colors"
              title="Download cleaned data as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Grid */}
        <div className="overflow-x-auto">
          {isStandardSchema ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0] font-semibold select-none">
                <tr>
                  <th className="py-3 px-4 cursor-pointer hover:text-[#1E293B]" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-1">ID <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-[#1E293B]" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-4 cursor-pointer hover:text-[#1E293B]" onClick={() => handleSort('region')}>
                    <div className="flex items-center gap-1">Region <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:text-[#1E293B]" onClick={() => handleSort('units')}>
                    <div className="flex items-center justify-end gap-1">Units <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:text-[#1E293B]" onClick={() => handleSort('revenue')}>
                    <div className="flex items-center justify-end gap-1">Revenue ($) <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer hover:text-[#1E293B]" onClick={() => handleSort('margin')}>
                    <div className="flex items-center justify-end gap-1">Margin (%) <ArrowUpDown className="w-3 h-3" /></div>
                  </th>
                  <th className="py-3 px-4">Client Tier</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredData.map((row, idx) => (
                  <tr key={`${row.id ?? idx}-${row.date ?? idx}`} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#64748B]">#{row.id}</td>
                    <td className="py-2.5 px-4 text-[#334155]">{row.date}</td>
                    <td className="py-2.5 px-4 font-medium text-[#1E293B]">{row.region}</td>
                    <td className="py-2.5 px-4 text-[#334155]">{row.category}</td>
                    <td className="py-2.5 px-4 text-right font-medium">
                      {row.units === null || row.units === undefined ? (
                        <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold">NULL</span>
                      ) : (
                        row.units
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-[#1E293B]">
                      {row.revenue === null || row.revenue === undefined ? (
                        <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold">NULL</span>
                      ) : (
                        `$${row.revenue.toLocaleString()}`
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold">
                      {row.margin === null || row.margin === undefined ? (
                        <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold">NULL</span>
                      ) : (
                        <span className={row.margin >= 50 ? 'text-emerald-600' : 'text-[#334155]'}>
                          {row.margin}%
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                        {row.clientTier}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" /> {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0] font-semibold select-none">
                <tr>
                  {dynamicColumns.map((col) => {
                    const isNumCol = datasetAnalysis.numericColumns.includes(col);
                    return (
                      <th
                        key={col}
                        className={`py-3 px-4 cursor-pointer hover:text-[#1E293B] ${isNumCol ? 'text-right' : ''}`}
                        onClick={() => handleSort(col)}
                      >
                        <div className={`flex items-center gap-1 ${isNumCol ? 'justify-end' : ''}`}>
                          {col} <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                    {dynamicColumns.map((col) => {
                      const val = row[col];
                      const isNumCol = datasetAnalysis.numericColumns.includes(col);
                      return (
                        <td key={col} className={`py-2.5 px-4 ${isNumCol ? 'text-right font-medium text-[#1E293B]' : 'text-[#334155]'}`}>
                          {val === null || val === undefined ? (
                            <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold">NULL</span>
                          ) : typeof val === 'number' ? (
                            val.toLocaleString()
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

