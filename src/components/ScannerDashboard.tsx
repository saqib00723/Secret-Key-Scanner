import React, { useState, useEffect } from 'react';
import { Finding, ScanResult, SampleRepo } from '../types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Play,
  Folder,
  Search,
  Download,
  Upload,
  RefreshCw,
  FileText,
  Clock,
  AlertTriangle,
  Eye,
  CheckCircle2,
  FileCode,
  Plus,
  X
} from 'lucide-react';

interface ScannerDashboardProps {
  onOpenContext: (finding: Finding) => void;
}

export const ScannerDashboard: React.FC<ScannerDashboardProps> = ({ onOpenContext }) => {
  const [scanMode, setScanMode] = useState<'sample' | 'path' | 'upload'>('sample');
  const [samples, setSamples] = useState<SampleRepo[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('vulnerable_app');
  const [customPath, setCustomPath] = useState<string>('');

  // Drag and drop / custom snippet state
  const [customFiles, setCustomFiles] = useState<{ path: string; content: string }[]>([
    {
      path: 'app/config.py',
      content: `AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"\nOPENAI_KEY = "sk-proj-1234567890abcdef1234567890abcdef"\nDEBUG = True`
    }
  ]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => {
        if (data.samples) {
          setSamples(data.samples);
          if (data.samples.length > 0) {
            setSelectedSampleId(data.samples[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleRunScan = async () => {
    setIsScanning(true);
    setErrorMsg(null);

    let payload: any = {};

    if (scanMode === 'sample') {
      const sampleObj = samples.find((s) => s.id === selectedSampleId);
      payload = { targetPath: sampleObj ? sampleObj.path : '' };
    } else if (scanMode === 'path') {
      payload = { targetPath: customPath.trim() };
    } else if (scanMode === 'upload') {
      payload = { customFiles };
    }

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Scan failed');
      }
      setScanResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during scanning');
    } finally {
      setIsScanning(false);
    }
  };

  // Auto-run first scan on mount
  useEffect(() => {
    if (samples.length > 0) {
      handleRunScan();
    }
  }, [samples]);

  const handleExport = (format: 'json' | 'txt') => {
    if (!scanResult || !scanResult.findings) return;

    if (format === 'json') {
      const jsonStr = JSON.stringify(scanResult, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keysentinel_report_${Date.now()}.json`;
      a.click();
    } else {
      let txt = `====================================================\n`;
      txt += `       KEYSENTINEL STATIC SECURITY SCAN REPORT      \n`;
      txt += `====================================================\n`;
      txt += `Date: ${new Date().toLocaleString()}\n`;
      txt += `Files Scanned: ${scanResult.stats.files_scanned}\n`;
      txt += `Secrets Found: ${scanResult.stats.secrets_found}\n`;
      txt += `Duration: ${scanResult.stats.duration_seconds}s\n`;
      txt += `----------------------------------------------------\n\n`;

      scanResult.findings.forEach((f, idx) => {
        txt += `[${idx + 1}] ${f.secret_type} (Line ${f.line_number})\n`;
        txt += `    File: ${f.filepath}\n`;
        txt += `    Masked Secret: ${f.masked_value}\n`;
        txt += `    Content: ${f.full_line}\n\n`;
      });

      const blob = new Blob([txt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keysentinel_report_${Date.now()}.txt`;
      a.click();
    }
  };

  const filteredFindings = scanResult?.findings.filter((f) => {
    const matchesSearch =
      f.filepath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.secret_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.masked_value.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || f.secret_type === categoryFilter;
    return matchesSearch && matchesCat;
  }) || [];

  const categories = Array.from(
    new Set(scanResult?.findings.map((f) => f.secret_type) || [])
  );

  return (
    <div className="space-y-6">
      {/* Target Selection & Scan Control Bar */}
      <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Folder className="w-5 h-5 text-blue-500" />
              <span>Select Scan Source</span>
            </h2>
            <p className="text-xs text-gray-400">Choose a sample codebase, directory path, or custom code files</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-[#141417] p-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => setScanMode('sample')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                scanMode === 'sample' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sample Projects
            </button>
            <button
              onClick={() => setScanMode('path')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                scanMode === 'path' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Local Folder Path
            </button>
            <button
              onClick={() => setScanMode('upload')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                scanMode === 'upload' ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              In-Browser Snippets
            </button>
          </div>
        </div>

        {/* Mode Specific Inputs */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
          {scanMode === 'sample' && (
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {samples.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSampleId(s.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedSampleId === s.id
                      ? 'bg-[#242427] border-blue-500/50 text-white shadow-md shadow-blue-900/10'
                      : 'bg-[#141417] border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{s.name}</span>
                    {selectedSampleId === s.id && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div className="text-[11px] mt-1 text-gray-400 leading-tight">{s.description}</div>
                </div>
              ))}
            </div>
          )}

          {scanMode === 'path' && (
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-gray-400">Absolute or Relative System Path:</label>
              <input
                type="text"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                placeholder="e.g. /home/user/my-project or ./samples/vulnerable_app"
                className="w-full bg-[#141417] border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:border-blue-500/50 outline-none font-mono"
              />
            </div>
          )}

          {scanMode === 'upload' && (
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">Custom Test Code Snippets</span>
                <button
                  onClick={() =>
                    setCustomFiles([
                      ...customFiles,
                      { path: `src/file_${customFiles.length + 1}.js`, content: `const API_KEY = "ghp_1234567890abcdefghijklmnopqrstuvwx";` }
                    ])
                  }
                  className="flex items-center space-x-1 text-xs text-blue-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add File</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {customFiles.map((file, idx) => (
                  <div key={idx} className="bg-[#141417] p-3 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      <input
                        type="text"
                        value={file.path}
                        onChange={(e) => {
                          const updated = [...customFiles];
                          updated[idx].path = e.target.value;
                          setCustomFiles(updated);
                        }}
                        className="bg-[#242427] border border-white/5 rounded-lg px-2.5 py-1 text-xs text-white font-mono flex-1 outline-none focus:border-blue-500/30"
                      />
                      {customFiles.length > 1 && (
                        <button
                          onClick={() => setCustomFiles(customFiles.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={file.content}
                      onChange={(e) => {
                        const updated = [...customFiles];
                        updated[idx].content = e.target.value;
                        setCustomFiles(updated);
                      }}
                      rows={2}
                      className="w-full bg-[#242427] border border-white/5 rounded-lg p-2 text-xs text-emerald-400 font-mono outline-none focus:border-blue-500/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Scan Trigger */}
          <div className="self-end">
            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="w-full md:w-auto bg-[#2D2D32] hover:bg-[#38383D] text-white px-6 py-2.5 rounded-xl text-xs font-semibold border border-white/10 transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Scanning Codebase...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                  <span>Execute Static Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
            <strong>Error:</strong> {errorMsg}
          </div>
        )}
      </div>

      {/* Summary Statistics Cards */}
      {scanResult && scanResult.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#18181B] border border-white/5 rounded-2xl p-5 flex items-center space-x-4 shadow-xl">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Files Analyzed</p>
              <h3 className="text-xl font-bold text-white font-mono">
                {scanResult.stats.files_scanned} <span className="text-xs font-normal text-gray-500">/ {scanResult.stats.total_files}</span>
              </h3>
            </div>
          </div>

          <div className="bg-[#18181B] border border-white/5 rounded-2xl p-5 flex items-center space-x-4 shadow-xl">
            <div
              className={`p-3 rounded-xl border ${
                scanResult.stats.secrets_found > 0
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Secrets Detected</p>
              <h3
                className={`text-xl font-bold font-mono ${
                  scanResult.stats.secrets_found > 0 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {scanResult.stats.secrets_found}
              </h3>
            </div>
          </div>

          <div className="bg-[#18181B] border border-white/5 rounded-2xl p-5 flex items-center space-x-4 shadow-xl">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Scan Duration</p>
              <h3 className="text-xl font-bold text-white font-mono">{scanResult.stats.duration_seconds}s</h3>
            </div>
          </div>

          <div className="bg-[#18181B] border border-white/5 rounded-2xl p-5 flex items-center space-x-4 shadow-xl">
            <div
              className={`p-3 rounded-xl border ${
                scanResult.stats.secrets_found === 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              {scanResult.stats.secrets_found === 0 ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400">Security Status</p>
              <h3
                className={`text-sm font-bold ${
                  scanResult.stats.secrets_found === 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {scanResult.stats.secrets_found === 0 ? 'CLEAN & SAFE' : 'HIGH RISK'}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Findings Table Area */}
      <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-base font-bold text-white">Scan Results & Findings</h3>
            <span className="text-xs font-mono text-gray-400 bg-[#141417] px-2.5 py-1 rounded-full border border-white/5">
              {filteredFindings.length} Items
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by file or type..."
                className="w-full bg-[#141417] border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500/50"
              />
            </div>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#141417] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-gray-300 outline-none focus:border-blue-500/50"
            >
              <option value="All">All Secret Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Export Report Buttons */}
            {scanResult && scanResult.findings.length > 0 && (
              <div className="flex items-center space-x-1 pl-2 border-l border-white/5">
                <button
                  onClick={() => handleExport('json')}
                  className="bg-[#242427] hover:bg-[#2D2D32] text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/5 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="bg-[#242427] hover:bg-[#2D2D32] text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/5 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>TXT</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="bg-[#141417] border border-white/5 rounded-xl overflow-hidden">
          {filteredFindings.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full inline-block border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white">No Hardcoded Secrets Found</h4>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No credentials, private keys, or API tokens matched KeySentinel rules in the selected codebase.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredFindings.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 hover:bg-[#1C1C20] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {item.secret_type}
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-400">
                        Line {item.line_number}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-gray-300 truncate max-w-xl">
                      {item.filepath}
                    </p>

                    <div className="flex items-center space-x-2 pt-0.5">
                      <span className="text-[11px] text-gray-500 font-sans">Masked Secret:</span>
                      <code className="text-xs font-mono font-medium text-gray-300 bg-[#242427] px-3 py-1 rounded-lg border border-white/5">
                        {item.masked_value}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onOpenContext(item)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-blue-900/20"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Context</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
