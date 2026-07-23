import React from 'react';
import { TabType } from '../types';
import { Shield, Code, Search, Terminal, BookOpen, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onDownloadZip: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onDownloadZip }) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Scanner Dashboard', icon: Shield },
    { id: 'patterns' as TabType, label: 'Detection Patterns', icon: Search },
    { id: 'python-code' as TabType, label: 'Python Source Code', icon: Code },
    { id: 'playground' as TabType, label: 'Regex Playground', icon: Terminal },
    { id: 'guide' as TabType, label: 'Remediation Guide', icon: BookOpen },
  ];

  return (
    <header className="bg-[#18181B] border-b border-white/5 sticky top-0 z-30 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-lg font-bold tracking-tight text-white">KeySentinel</h1>
                <span className="text-blue-500 font-medium text-xs">v1.2.0</span>
              </div>
              <p className="text-xs text-gray-400">DevSecOps Static Secret Analysis Tool</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-[#141417] p-1.5 rounded-2xl border border-white/5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-gray-400 hover:bg-[#242427] hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Download Desktop App Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onDownloadZip}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-900/20 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Desktop App (.zip)</span>
              <span className="sm:hidden">Download</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex space-x-1 py-2 overflow-x-auto border-t border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${
                  isActive ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30' : 'text-gray-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
