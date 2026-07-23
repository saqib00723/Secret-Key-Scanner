import React, { useState } from 'react';
import { Search, Copy, Check, Shield, Key, AlertTriangle } from 'lucide-react';

interface PatternItem {
  name: string;
  pattern: string;
  category: string;
  description: string;
  sampleLeak: string;
}

export const PATTERNS_LIST: PatternItem[] = [
  {
    name: "AWS Access Key ID",
    pattern: "AKIA[0-9A-Z]{16}",
    category: "Cloud Provider",
    description: "Standard 20-character AWS IAM access key ID.",
    sampleLeak: "AKIAIOSFODNN7EXAMPLE"
  },
  {
    name: "AWS Secret Access Key",
    pattern: "(?i)aws_(?:secret|access)?_?key\\s*[:=]\\s*[\"']([0-9a-zA-Z/+]{40})[\"']",
    category: "Cloud Provider",
    description: "40-character secret key string associated with AWS IAM user.",
    sampleLeak: "aws_secret_key = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'"
  },
  {
    name: "OpenAI API Key",
    pattern: "sk-(?:proj-|admin-|[a-zA-Z0-9]{2,}-)?[a-zA-Z0-9]{32,}",
    category: "AI & ML",
    description: "Secret API token used for OpenAI API services.",
    sampleLeak: "sk-proj-49204920492049204920492049204920"
  },
  {
    name: "GitHub Personal Access Token",
    pattern: "ghp_[a-zA-Z0-9]{36}",
    category: "Version Control",
    description: "Classic GitHub PAT for repository access.",
    sampleLeak: "ghp_1234567890abcdefghijklmnopqrstuvwx"
  },
  {
    name: "GitHub Fine-Grained Token",
    pattern: "github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}",
    category: "Version Control",
    description: "New granular access token format introduced by GitHub.",
    sampleLeak: "github_pat_11AAAAAAA0123456789_abcdefghijklmnopqrstuvwxyz0123456789"
  },
  {
    name: "Slack Bot / User Token",
    pattern: "xox[baprs]-[a-zA-Z0-9]{10,48}",
    category: "Messaging",
    description: "Slack bot, app, user, or refresh authentication token.",
    sampleLeak: "xoxb-123456789012-345678901234-abcdefghijklmnopqrstuvwx"
  },
  {
    name: "Slack Webhook URL",
    pattern: "https://hooks.slack.com/services/T[a-zA-Z0-9_]{8,12}/B[a-zA-Z0-9_]{8,12}/[a-zA-Z0-9_]{24}",
    category: "Messaging",
    description: "Incoming webhook URL for broadcasting messages to Slack channels.",
    sampleLeak: "https://hooks.slack.com/services/T12345678/B12345678/123456789012345678901234"
  },
  {
    name: "Stripe Secret / Public Key",
    pattern: "(?:sk|pk)_(?:live|test)_[0-9a-zA-Z]{24,99}",
    category: "Payments",
    description: "API keys for Stripe payment processing.",
    sampleLeak: "sk_live_51Mz1234567890123456789012345678"
  },
  {
    name: "Google Cloud / Firebase API Key",
    pattern: "AIzaSy[0-9A-Za-z-_]{35}",
    category: "Cloud Provider",
    description: "Public/Private API key for Google Maps, Firebase, or GCP.",
    sampleLeak: "AIzaSyA1234567890abcdefghijklmnopqrst"
  },
  {
    name: "JSON Web Token (JWT)",
    pattern: "eyJ[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_.+/=]*",
    category: "Authentication",
    description: "Compact, URL-safe means of representing claims passed between two parties.",
    sampleLeak: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  },
  {
    name: "Private Key Header",
    pattern: "-----BEGIN (?:RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY-----",
    category: "Cryptography",
    description: "PEM-encoded private key file headers.",
    sampleLeak: "-----BEGIN RSA PRIVATE KEY-----"
  },
  {
    name: "Database Connection String",
    pattern: "(?:postgres|postgresql|mysql|mongodb|redis|mongodb\\+srv)://[^:\\s]+:([^@\\s]+)@[^:\\s]+:[0-9]+",
    category: "Database",
    description: "Connection strings containing inline username and password.",
    sampleLeak: "postgresql://admin:SecretPass123!@db.internal.net:5432/prod_db"
  },
  {
    name: "Generic Password / Secret Key",
    pattern: "(?i)(?:password|passwd|secret_key|api_secret|auth_token)\\s*[:=]\\s*[\"']([^\"']{8,})[\"']",
    category: "Generic Credentials",
    description: "Inline variable assignments assigning strings to password or secret keys.",
    sampleLeak: "secret_key = \"super_secret_session_pass_key_123\""
  }
];

export const PatternsView: React.FC = () => {
  const [copiedPattern, setCopiedPattern] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const copyToClipboard = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPattern(name);
    setTimeout(() => setCopiedPattern(null), 2000);
  };

  const filtered = PATTERNS_LIST.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.pattern.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-500" />
            <span>KeySentinel Rule Engine Patterns</span>
          </h2>
          <p className="text-xs text-gray-400">Built-in regular expressions defined in patterns.py</p>
        </div>

        <div className="relative sm:w-72">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search regex patterns..."
            className="w-full bg-[#141417] border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.name}
            className="bg-[#18181B] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex flex-col justify-between space-y-3 shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {item.category}
                </span>
                <button
                  onClick={() => copyToClipboard(item.pattern, item.name)}
                  className="text-xs text-gray-400 hover:text-white flex items-center space-x-1 p-1 hover:bg-[#242427] rounded-lg cursor-pointer transition-colors"
                >
                  {copiedPattern === item.name ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedPattern === item.name ? 'Copied' : 'Copy Regex'}</span>
                </button>
              </div>

              <h3 className="text-sm font-bold text-white mt-3">{item.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{item.description}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-white/5">
              <div>
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Compiled Regex:</span>
                <code className="block bg-[#141417] text-emerald-400 font-mono text-xs p-2.5 rounded-xl border border-white/5 overflow-x-auto mt-1">
                  {item.pattern}
                </code>
              </div>

              <div>
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Sample Target Format:</span>
                <code className="block bg-[#141417] text-amber-300 font-mono text-[11px] p-2.5 rounded-xl border border-white/5 overflow-x-auto mt-1">
                  {item.sampleLeak}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
