import React from 'react';
import { LayoutGrid, FolderSync, Plus, Layers, IndianRupee } from 'lucide-react';
import { TabType } from '../types';

interface NavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenNewStructure?: () => void;
  onOpenUpload?: () => void;
  totalPoSum?: number;
  totalSoSum?: number;
}

export const BottomNav: React.FC<NavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden bg-[#0f172a]/95 backdrop-blur-md fixed bottom-0 left-0 right-0 w-full z-50 border-t border-[#1e293b] shadow-2xl flex justify-around items-center h-16 pb-[max(env(safe-area-inset-bottom,8px),8px)] px-4 text-white"
    >
      {/* Dashboard Tab */}
      <button
        id="nav-tab-dashboard"
        onClick={() => onTabChange('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 h-full group transition-all active:scale-95 duration-150 ${
          activeTab === 'dashboard' ? 'text-[#4ade80]' : 'text-[#94a3b8]'
        }`}
      >
        <div
          className={`flex items-center justify-center rounded-xl px-5 py-1 mb-0.5 transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#22c55e]/20 text-[#4ade80] font-semibold border border-[#22c55e]/30'
              : 'hover:bg-[#1e293b]'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
        </div>
        <span
          className={`text-[11px] tracking-wide ${
            activeTab === 'dashboard' ? 'font-bold text-[#4ade80]' : 'font-medium text-[#94a3b8]'
          }`}
        >
          Structure Explorer
        </span>
      </button>

      {/* Dumping Yard Tab */}
      <button
        id="nav-tab-dumping-yard"
        onClick={() => onTabChange('dumping-yard')}
        className={`flex flex-col items-center justify-center flex-1 h-full group transition-all active:scale-95 duration-150 ${
          activeTab === 'dumping-yard' ? 'text-[#4ade80]' : 'text-[#94a3b8]'
        }`}
      >
        <div
          className={`flex items-center justify-center rounded-xl px-5 py-1 mb-0.5 transition-all ${
            activeTab === 'dumping-yard'
              ? 'bg-[#22c55e]/20 text-[#4ade80] font-semibold border border-[#22c55e]/30'
              : 'hover:bg-[#1e293b]'
          }`}
        >
          <FolderSync className="w-5 h-5" />
        </div>
        <span
          className={`text-[11px] tracking-wide ${
            activeTab === 'dumping-yard' ? 'font-bold text-[#4ade80]' : 'font-medium text-[#94a3b8]'
          }`}
        >
          Dumping Yard
        </span>
      </button>
    </nav>
  );
};

export const SidebarNav: React.FC<NavProps> = ({
  activeTab,
  onTabChange,
  onOpenNewStructure,
  onOpenUpload,
  totalPoSum = 0,
  totalSoSum = 0
}) => {
  return (
    <aside
      id="desktop-sidebar-nav"
      className="hidden md:flex fixed top-14 left-0 w-64 h-[calc(100vh-3.5rem)] border-r border-[#1e293b] bg-[#0f172a] flex-col p-4 gap-4 z-40 text-white"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider pl-2 mb-1.5">
          E & I Navigation
        </h2>

        {/* Dashboard Button */}
        <button
          id="desktop-btn-dashboard"
          onClick={() => onTabChange('dashboard')}
          className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left text-[13px] transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#22c55e]/15 text-[#4ade80] font-bold shadow-sm border border-[#22c55e]/30'
              : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f8fafc]'
          }`}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span>Structure Explorer</span>
        </button>

        {/* Dumping Yard Button */}
        <button
          id="desktop-btn-dumping-yard"
          onClick={() => onTabChange('dumping-yard')}
          className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left text-[13px] transition-all ${
            activeTab === 'dumping-yard'
              ? 'bg-[#22c55e]/15 text-[#4ade80] font-bold shadow-sm border border-[#22c55e]/30'
              : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f8fafc]'
          }`}
        >
          <FolderSync className="w-4 h-4 shrink-0" />
          <span>Dumping Yard (Repository)</span>
        </button>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="mt-2 pt-3 border-t border-[#1e293b] flex flex-col gap-2">
        <h2 className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider pl-2 mb-1">
          Quick Ingestion
        </h2>
        {onOpenUpload && (
          <button
            id="btn-sidebar-upload-doc"
            onClick={onOpenUpload}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[12px] font-bold text-[#052e16] bg-[#22c55e] hover:bg-[#16a34a] rounded-xl transition-all shadow-sm active:scale-98"
          >
            <Layers className="w-4 h-4" />
            <span>Upload E&I Documents</span>
          </button>
        )}
        {onOpenNewStructure && (
          <button
            id="btn-sidebar-new-structure"
            onClick={onOpenNewStructure}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[12px] font-medium text-[#cbd5e1] bg-[#1e293b] hover:bg-[#334155] rounded-xl border border-[#334155] transition-colors"
          >
            <Plus className="w-4 h-4 text-[#4ade80]" />
            <span>Add Plant Structure</span>
          </button>
        )}
      </div>

      {/* Rupee Valuation Summary Card */}
      <div className="mt-2 p-3 rounded-xl bg-[#131d33] border border-[#1e293b]">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#94a3b8] uppercase mb-2">
          <span>E & I Value Summary</span>
          <IndianRupee className="w-3 h-3 text-[#4ade80]" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#94a3b8]">Total PO Value:</span>
            <span className="font-bold text-[#4ade80]">
              {totalPoSum > 0 ? `₹ ${(totalPoSum / 100000).toFixed(2)} L` : '₹ 0'}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[#94a3b8]">Total SO Value:</span>
            <span className="font-bold text-[#38bdf8]">
              {totalSoSum > 0 ? `₹ ${(totalSoSum / 100000).toFixed(2)} L` : '₹ 0'}
            </span>
          </div>
        </div>
      </div>

      {/* System Status summary */}
      <div className="mt-auto p-3 rounded-xl bg-[#131d33] border border-[#1e293b]">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#94a3b8] mb-1">
          <span>AI RATE ENGINE</span>
          <span className="flex items-center gap-1 text-[#4ade80] text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            Active (₹ INR)
          </span>
        </div>
        <p className="text-[11px] text-[#64748b] leading-tight">
          Auto-scans PO/SO documents and calculates total structure valuation in Rupees.
        </p>
      </div>
    </aside>
  );
};
