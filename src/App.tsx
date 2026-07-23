import React, { useState } from 'react';
import { Finding, ScanResult, FileContextResponse } from './types';

export default function App() {
  const [scanMode, setScanMode] = useState<'upload' | 'path' | 'paste'>('upload');
  const [targetPath, setTargetPath] = useState<string>('sample_test_keys.py');
  const [pastedCode, setPastedCode] = useState<string>(
    '# Paste code or API keys here\nAWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"\nOPENAI_KEY = "sk-proj-492049204920492049204920492049204920"'
  );
  const [pastedFileName, setPastedFileName] = useState<string>('test_script.py');

  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileContent, setUploadedFileContent] = useState<string>('');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [contextData, setContextData] = useState<FileContextResponse | null>(null);
  const [loadingContext, setLoadingContext] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFileContent((event.target?.result as string) || '');
      };
      reader.readAsText(file);
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanProgress(15);
    setErrorMsg('');
    setScanResult(null);

    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 25;
      });
    }, 150);

    try {
      let body: any = {};

      if (scanMode === 'upload') {
        if (!uploadedFileContent) {
          throw new Error('Please select a file to upload first.');
        }
        body = {
          customFiles: [
            {
              path: uploadedFileName || 'uploaded_code.py',
              content: uploadedFileContent,
            },
          ],
        };
      } else if (scanMode === 'paste') {
        if (!pastedCode.trim()) {
          throw new Error('Please enter or paste code.');
        }
        body = {
          customFiles: [
            {
              path: pastedFileName || 'snippet.py',
              content: pastedCode,
            },
          ],
        };
      } else {
        if (!targetPath.trim()) {
          throw new Error('Please specify a valid folder or file path.');
        }
        body = { targetPath: targetPath.trim() };
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      clearInterval(progressInterval);
      setScanProgress(100);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Scan failed.');
      } else {
        setScanResult(data);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setErrorMsg(err.message || 'Error occurred while scanning.');
    } finally {
      setTimeout(() => {
        setIsScanning(false);
      }, 200);
    }
  };

  const handleOpenContext = async (finding: Finding) => {
    setSelectedFinding(finding);
    setContextData(null);
    setLoadingContext(true);

    try {
      const res = await fetch('/api/file-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filepath: finding.filepath,
          lineNumber: finding.line_number,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContextData(data);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingContext(false);
    }
  };

  const filteredFindings = (scanResult?.findings || []).filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.filepath.toLowerCase().includes(q) ||
      f.secret_type.toLowerCase().includes(q) ||
      f.masked_value.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans text-slate-800 bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm mb-6 space-y-4">
        {/* Main Title */}
        <h1 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">
          🛡️ KeySentinel - Secret Key Scanner
        </h1>

        {/* Developer Info */}
        <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs">
          <div className="font-semibold text-slate-700 uppercase tracking-wide mb-2 text-[11px]">
            Developer
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Name:</span>
            <span className="font-semibold text-slate-800">Saqib</span>
          </div>
        </div>
      </div>

      {/* Input / Scanner Controls Box */}
      <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm mb-6 space-y-4">
        <h2 className="font-bold text-sm text-slate-800 border-b border-slate-200 pb-2">
          Scan Options
        </h2>

        <div className="flex gap-6 text-xs font-medium text-slate-700">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="scanMode"
              checked={scanMode === 'upload'}
              onChange={() => setScanMode('upload')}
              className="text-slate-800"
            />
            <span>Upload File</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="scanMode"
              checked={scanMode === 'path'}
              onChange={() => setScanMode('path')}
              className="text-slate-800"
            />
            <span>Folder / Path</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="scanMode"
              checked={scanMode === 'paste'}
              onChange={() => setScanMode('paste')}
              className="text-slate-800"
            />
            <span>Paste Code</span>
          </label>
        </div>

        {scanMode === 'upload' && (
          <div className="space-y-2 text-xs">
            <label className="block font-medium text-slate-700">Choose file to analyze:</label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200"
            />
            {uploadedFileName && (
              <p className="text-emerald-700 font-mono text-[11px]">Selected: {uploadedFileName}</p>
            )}
          </div>
        )}

        {scanMode === 'path' && (
          <div className="text-xs space-y-1">
            <label className="block font-medium text-slate-700">Path to file or folder:</label>
            <input
              type="text"
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-slate-500"
              placeholder="e.g. sample_test_keys.py or standalone_test_file.py"
            />
          </div>
        )}

        {scanMode === 'paste' && (
          <div className="text-xs space-y-2">
            <div className="flex items-center gap-2">
              <label className="font-medium text-slate-700">File Name:</label>
              <input
                type="text"
                value={pastedFileName}
                onChange={(e) => setPastedFileName(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 font-mono text-xs w-48"
              />
            </div>
            <textarea
              value={pastedCode}
              onChange={(e) => setPastedCode(e.target.value)}
              rows={5}
              className="w-full border border-slate-300 rounded p-2 font-mono text-xs focus:outline-none focus:border-slate-500"
            ></textarea>
          </div>
        )}

        <button
          onClick={handleRunScan}
          disabled={isScanning}
          className="bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs px-4 py-2 rounded cursor-pointer disabled:opacity-50 transition-colors"
        >
          {isScanning ? 'Scanning...' : 'Start Scan'}
        </button>
      </div>

      {/* Progress Bar */}
      {isScanning && (
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm mb-6 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Scanning Progress</span>
            <span>{scanProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div
              className="bg-slate-800 h-full transition-all duration-200 rounded-full"
              style={{ width: `${scanProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Output */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 text-xs rounded mb-6 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Results Output */}
      {scanResult && (
        <div className="bg-white border border-slate-200 rounded-md p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
            <h2 className="font-bold text-sm text-slate-800">Scan Findings</h2>
            <div className="text-xs space-x-3 text-slate-600 font-mono">
              <span>Files Scanned: <strong>{scanResult.stats.files_scanned}</strong></span>
              <span>Secrets Found: <strong className={scanResult.stats.secrets_found > 0 ? "text-red-600" : "text-emerald-600"}>{scanResult.stats.secrets_found}</strong></span>
              <span>Duration: <strong>{scanResult.stats.duration_seconds}s</strong></span>
            </div>
          </div>

          <div className="text-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings by file path or secret type..."
              className="w-full border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:border-slate-500"
            />
          </div>

          {filteredFindings.length === 0 ? (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded">
              No secret keys or credentials were detected in the provided input.
            </p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">File Path</th>
                    <th className="p-2.5 w-16 text-center">Line</th>
                    <th className="p-2.5">Secret Type</th>
                    <th className="p-2.5">Masked Value</th>
                    <th className="p-2.5 w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {filteredFindings.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-800 max-w-xs truncate">{item.filepath}</td>
                      <td className="p-2.5 text-center font-bold text-slate-700">{item.line_number}</td>
                      <td className="p-2.5 text-red-700 font-sans font-medium">{item.secret_type}</td>
                      <td className="p-2.5 text-slate-900">{item.masked_value}</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleOpenContext(item)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-2 py-1 rounded text-[11px] cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Line Context Inspection Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-300 rounded-md max-w-2xl w-full p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                Line Inspection — Line {selectedFinding.line_number}
              </h3>
              <button
                onClick={() => setSelectedFinding(null)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs font-mono text-slate-600 break-all">{selectedFinding.filepath}</p>

            <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-xs max-h-60 overflow-y-auto space-y-1">
              {loadingContext ? (
                <p className="text-slate-400">Loading context lines...</p>
              ) : contextData && contextData.snippet ? (
                contextData.snippet.map((line) => (
                  <div
                    key={line.lineNum}
                    className={`flex space-x-2 px-1.5 py-0.5 rounded ${
                      line.isTarget ? 'bg-red-900/60 text-red-200 font-bold' : 'text-slate-400'
                    }`}
                  >
                    <span className="w-8 text-right text-slate-600 select-none">{line.lineNum}</span>
                    <span className="whitespace-pre">{line.text}</span>
                  </div>
                ))
              ) : (
                <div className="p-1">
                  <span className="text-red-400 font-bold">Target Line: </span>
                  <span>{selectedFinding.full_line}</span>
                </div>
              )}
            </div>

            <div className="text-right border-t border-slate-200 pt-3">
              <button
                onClick={() => setSelectedFinding(null)}
                className="bg-slate-800 text-white hover:bg-slate-900 px-3 py-1.5 rounded text-xs cursor-pointer font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
