import React, { useState } from 'react';
import { Terminal, Play, AlertTriangle, CheckCircle2, Copy, Check } from 'lucide-react';
import { PATTERNS_LIST } from './PatternsView';

export const RegexPlayground: React.FC = () => {
  const [testText, setTestText] = useState<string>(
    `# Sample Configuration File\nAWS_KEY = "AKIAIOSFODNN7EXAMPLE"\nOPENAI = "sk-proj-9876543210abcdef9876543210abcdef"\nSLACK = "xoxb-123456789012-345678901234-abcdefghijklmnopqrstuvwx"\nDB_PASS = "postgresql://admin:SecretPass123!@localhost:5432/mydb"`
  );

  const [selectedPattern, setSelectedPattern] = useState<string>(PATTERNS_LIST[0].name);
  const [customRegex, setCustomRegex] = useState<string>(PATTERNS_LIST[0].pattern);
  const [matches, setMatches] = useState<{ line: number; text: string; match: string }[]>([]);
  const [tested, setTested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPattern = (name: string) => {
    setSelectedPattern(name);
    const p = PATTERNS_LIST.find((item) => item.name === name);
    if (p) {
      setCustomRegex(p.pattern);
    }
  };

  const handleTestRegex = () => {
    setError(null);
    setTested(true);
    setMatches([]);

    try {
      const regex = new RegExp(customRegex, 'g');
      const lines = testText.split('\n');
      const found: { line: number; text: string; match: string }[] = [];

      lines.forEach((lineText, idx) => {
        let m;
        // reset lastIndex for global regex
        regex.lastIndex = 0;
        while ((m = regex.exec(lineText)) !== null) {
          found.push({
            line: idx + 1,
            text: lineText,
            match: m[1] || m[0]
          });
          if (m.index === regex.lastIndex) regex.lastIndex++;
        }
      });

      setMatches(found);
    } catch (e: any) {
      setError(`Invalid Regular Expression: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-blue-500" />
          <span>Interactive Regex & Token Test Playground</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Paste custom code snippets or strings below to test KeySentinel regex matching in real time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Controls */}
        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 space-y-4 shadow-2xl">
          {/* Preset Selector */}
          <div>
            <label className="text-xs font-bold text-white block mb-1.5">Select Preset Pattern:</label>
            <select
              value={selectedPattern}
              onChange={(e) => handleSelectPattern(e.target.value)}
              className="w-full bg-[#141417] border border-white/5 rounded-xl px-3.5 py-2 text-xs text-gray-300 outline-none focus:border-blue-500/50"
            >
              {PATTERNS_LIST.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          {/* Custom Regex Input */}
          <div>
            <label className="text-xs font-bold text-white block mb-1.5">Regex Pattern String:</label>
            <input
              type="text"
              value={customRegex}
              onChange={(e) => setCustomRegex(e.target.value)}
              className="w-full bg-[#141417] border border-white/5 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-400 outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Test Textarea */}
          <div>
            <label className="text-xs font-bold text-white block mb-1.5">Test Code Snippet / Text:</label>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              rows={8}
              className="w-full bg-[#141417] border border-white/5 rounded-xl p-3.5 text-xs font-mono text-gray-200 outline-none focus:border-blue-500/50"
            />
          </div>

          <button
            onClick={handleTestRegex}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-900/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Test Pattern Against Snippet</span>
          </button>
        </div>

        {/* Results Box */}
        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 flex items-center justify-between">
              <span>Matching Results</span>
              {tested && (
                <span className="text-xs font-mono font-normal text-gray-400">
                  {matches.length} Matches Found
                </span>
              )}
            </h3>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                {error}
              </div>
            )}

            {!tested ? (
              <div className="py-20 text-center text-gray-500 text-xs">
                Click "Test Pattern Against Snippet" to view matching line outputs.
              </div>
            ) : matches.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-white">No Matches Detected</p>
                <p className="text-[11px] text-gray-400">The target regex did not find any matching strings in the snippet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {matches.map((m, idx) => (
                  <div key={idx} className="bg-[#141417] border border-white/5 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-blue-400 font-bold">Line {m.line}</span>
                      <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono">
                        Matched Value
                      </span>
                    </div>

                    <div className="bg-[#242427] p-2.5 rounded-lg text-xs font-mono text-amber-300 font-bold border border-white/5">
                      {m.match}
                    </div>

                    <div className="text-[11px] font-mono text-gray-400 truncate">
                      Full Line: {m.text}
                    </div>
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
