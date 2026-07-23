import React, { useState, useEffect } from 'react';
import { Code, Download, Copy, Check, FileCode, Terminal } from 'lucide-react';

interface PythonSourceViewProps {
  onDownloadZip: () => void;
}

export const PythonSourceView: React.FC<PythonSourceViewProps> = ({ onDownloadZip }) => {
  const [filesData, setFilesData] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('main.py');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/python-files')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setFilesData(data.files);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filesList = ['main.py', 'gui.py', 'scanner.py', 'patterns.py', 'requirements.txt', 'README.md'];

  const copyCode = () => {
    const code = filesData[selectedFile] || '';
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeText = filesData[selectedFile] || '';
  const codeLines = codeText.split('\n');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Code className="w-5 h-5 text-blue-500" />
            <span>KeySentinel Python Application Source Code</span>
          </h2>
          <p className="text-xs text-gray-400">
            Complete, production-ready Python files for local CustomTkinter desktop execution
          </p>
        </div>

        <button
          onClick={onDownloadZip}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center space-x-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download All Files (.zip)</span>
        </button>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-[#18181B] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[550px]">
        {/* Left Sidebar File Picker */}
        <div className="w-full md:w-56 bg-[#141417] border-b md:border-b-0 md:border-r border-white/5 p-3 space-y-1">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-3 py-2">Project Files</div>
          {filesList.map((filename) => {
            const isActive = selectedFile === filename;
            return (
              <button
                key={filename}
                onClick={() => setSelectedFile(filename)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-mono transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#242427] text-blue-400 font-bold border border-white/10'
                    : 'text-gray-400 hover:bg-[#1C1C20] hover:text-white'
                }`}
              >
                <FileCode className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                <span>{filename}</span>
              </button>
            );
          })}

          <div className="pt-6 px-3 space-y-2">
            <div className="p-3 bg-[#1C1C20] border border-white/5 rounded-xl">
              <span className="text-[11px] font-bold text-amber-300 flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Run Locally</span>
              </span>
              <p className="text-[11px] text-gray-400 mt-1">
                Install dependencies and launch desktop GUI:
              </p>
              <code className="block bg-[#141417] text-emerald-400 text-[10px] p-1.5 rounded-lg mt-1.5 font-mono border border-white/5">
                pip install -r requirements.txt
              </code>
              <code className="block bg-[#141417] text-blue-400 text-[10px] p-1.5 rounded-lg mt-1 font-mono border border-white/5">
                python main.py
              </code>
            </div>
          </div>
        </div>

        {/* Right Code Display Box */}
        <div className="flex-1 flex flex-col bg-[#18181B]">
          {/* Header Bar */}
          <div className="px-5 py-3.5 bg-[#1C1C20] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono font-bold text-white">{selectedFile}</span>
              <span className="text-[10px] text-gray-500 font-mono">({codeLines.length} lines)</span>
            </div>

            <button
              onClick={copyCode}
              className="flex items-center space-x-1.5 text-xs bg-[#242427] hover:bg-[#2D2D32] text-white px-3 py-1.5 rounded-xl border border-white/5 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy File'}</span>
            </button>
          </div>

          {/* Code Content View */}
          <div className="p-4 flex-1 overflow-x-auto bg-[#0F0F12] font-mono text-xs text-[#E0E0E6] leading-relaxed max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="py-20 text-center text-gray-500">Loading code content...</div>
            ) : (
              <div className="space-y-0.5">
                {codeLines.map((line, idx) => (
                  <div key={idx} className="flex items-start space-x-4 hover:bg-[#18181B] rounded px-1">
                    <span className="w-10 text-right text-gray-600 select-none text-[11px]">{idx + 1}</span>
                    <span className="whitespace-pre flex-1 text-gray-300">{line || ' '}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
