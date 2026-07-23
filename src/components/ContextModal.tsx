import React, { useEffect, useState } from 'react';
import { Finding, FileContextResponse } from '../types';
import { X, Copy, Check, FileCode, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ContextModalProps {
  finding: Finding | null;
  onClose: () => void;
}

export const ContextModal: React.FC<ContextModalProps> = ({ finding, onClose }) => {
  const [contextData, setContextData] = useState<FileContextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!finding) return;

    setLoading(true);
    setError(null);

    fetch('/api/file-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filepath: finding.filepath,
        lineNumber: finding.line_number,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('File not accessible on server');
        return res.json();
      })
      .then((data) => setContextData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [finding]);

  if (!finding) return null;

  const copySnippet = () => {
    if (!finding) return;
    const textToCopy = `File: ${finding.filepath}:${finding.line_number}\nSecret Type: ${finding.secret_type}\nMasked Token: ${finding.masked_value}\nLine: ${finding.full_line}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#18181B] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1C1C20] border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>{finding.secret_type}</span>
                <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  Line {finding.line_number}
                </span>
              </h3>
              <p className="text-xs text-gray-400 font-mono truncate max-w-lg">{finding.filepath}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#242427] rounded-lg transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Secret Summary Banner */}
          <div className="bg-[#141417] p-4 rounded-xl border border-white/5 flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                Detected Secret Value (Masked)
              </span>
              <div className="text-base font-mono font-bold text-amber-300 mt-1">
                {finding.masked_value}
              </div>
            </div>
            <button
              onClick={copySnippet}
              className="flex items-center space-x-1.5 text-xs bg-[#242427] hover:bg-[#2D2D32] text-gray-200 px-3 py-1.5 rounded-xl border border-white/5 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Finding'}</span>
            </button>
          </div>

          {/* Code Context Box */}
          <div className="bg-[#0F0F12] border border-white/5 rounded-xl p-4 font-mono text-xs overflow-x-auto">
            <div className="text-[11px] text-gray-500 uppercase font-sans mb-3 flex items-center justify-between border-b border-white/5 pb-2">
              <span className="flex items-center space-x-1.5">
                <FileCode className="w-3.5 h-3.5" />
                <span>Source Code Context</span>
              </span>
              <span>Lines {contextData ? `${contextData.snippet[0]?.lineNum} - ${contextData.snippet[contextData.snippet.length - 1]?.lineNum}` : finding.line_number}</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-gray-500 animate-pulse">
                Loading code context snippet...
              </div>
            ) : error ? (
              <div className="bg-[#141417] p-3 rounded-xl border border-white/5 text-gray-200">
                <div className="text-red-400 font-bold mb-1">Target Line:</div>
                <div className="bg-[#18181B] p-2 rounded-lg text-amber-300 border border-red-500/30 font-mono">
                  {finding.line_number} | {finding.full_line}
                </div>
              </div>
            ) : contextData ? (
              <div className="space-y-1">
                {contextData.snippet.map((line) => (
                  <div
                    key={line.lineNum}
                    className={`flex items-start space-x-3 px-2 py-1 rounded-lg transition-colors ${
                      line.isTarget
                        ? 'bg-red-500/10 border-l-4 border-red-500 text-white font-bold'
                        : 'text-gray-400 hover:bg-[#18181B]'
                    }`}
                  >
                    <span className={`w-10 text-right select-none ${line.isTarget ? 'text-red-400 font-bold' : 'text-gray-600'}`}>
                      {line.lineNum}
                    </span>
                    <span className="whitespace-pre font-mono flex-1">{line.text}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Remediation Guide Box */}
          <div className="bg-[#1C1C20] border border-amber-500/20 rounded-xl p-4">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>Recommended Security Remediation</span>
            </h4>
            <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-white">Revoke Immediately:</strong> Rotate or revoke this credential in the provider console (AWS, OpenAI, GitHub, etc.).
              </li>
              <li>
                <strong className="text-white">Use Environment Variables:</strong> Replace inline string with <code className="bg-[#141417] text-emerald-400 px-1.5 py-0.5 rounded-md border border-white/5">os.getenv("VARIABLE")</code> or <code className="bg-[#141417] text-emerald-400 px-1.5 py-0.5 rounded-md border border-white/5">process.env.VARIABLE</code>.
              </li>
              <li>
                <strong className="text-white">Git History Clean-Up:</strong> If already committed, remove the secret from Git history using <code className="bg-[#141417] text-blue-400 px-1.5 py-0.5 rounded-md border border-white/5">git-filter-repo</code> or BFG Repo-Cleaner.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#1C1C20] border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#242427] hover:bg-[#2D2D32] text-white text-xs font-semibold px-4 py-2 rounded-xl border border-white/5 transition-all cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
