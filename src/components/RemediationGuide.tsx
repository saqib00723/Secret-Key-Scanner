import React from 'react';
import { BookOpen, ShieldAlert, Key, GitBranch, Terminal, Lock, CheckCircle } from 'lucide-react';

export const RemediationGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <span>DevSecOps Secret Remediation & Security Guidelines</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Best practices for responding to leaked credentials and preventing hardcoded keys in source control
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Immediate Key Rotation */}
        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 space-y-3 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">1. Revoke & Rotate Credentials</h3>
              <p className="text-xs text-gray-400">Assume any exposed secret is compromised</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Deleting a secret from code or committing a quick fix does NOT purge it from git history.
            Immediately log into the service console (AWS, OpenAI, GitHub, Stripe) and <strong>rotate or invalidate</strong> the affected key.
          </p>
        </div>

        {/* Step 2: Environment Variables */}
        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 space-y-3 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">2. Externalize Secrets to .env</h3>
              <p className="text-xs text-gray-400">Keep credentials out of application code</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Store secrets in local environment files (<code className="text-emerald-400 font-mono">.env</code>) and load them dynamically at runtime:
          </p>
          <div className="bg-[#141417] p-3 rounded-xl border border-white/5 font-mono text-xs text-gray-300">
            <span className="text-gray-500"># Python</span><br />
            import os<br />
            api_key = os.getenv("OPENAI_API_KEY")
          </div>
        </div>

        {/* Step 3: Gitignore Setup */}
        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 space-y-3 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">3. Configure .gitignore</h3>
              <p className="text-xs text-gray-400">Prevent committing sensitive files</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Ensure your project <code className="text-blue-400 font-mono">.gitignore</code> includes environment files, private keys, and credential stores:
          </p>
          <div className="bg-[#141417] p-3 rounded-xl border border-white/5 font-mono text-xs text-emerald-400">
            .env<br />
            .env.local<br />
            *.pem<br />
            secrets.json
          </div>
        </div>

        {/* Step 4: Pre-commit Hooks */}
        <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 space-y-3 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">4. Automate Pre-Commit Scans</h3>
              <p className="text-xs text-gray-400">Catch secrets before git commit</p>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            Run KeySentinel automatically in a Git pre-commit hook so developer machines prevent leaks automatically:
          </p>
          <div className="bg-[#141417] p-3 rounded-xl border border-white/5 font-mono text-xs text-blue-400">
            # .git/hooks/pre-commit<br />
            python3 scanner.py . --json || exit 1
          </div>
        </div>
      </div>
    </div>
  );
};
