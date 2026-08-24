import React from 'react';
import { Zap, Bell, ShieldCheck, Activity } from 'lucide-react';
import { NotificationItem } from '../types';

interface HeaderProps {
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  onOpenNotifications,
  unreadCount
}) => {
  return (
    <header
      id="top-app-bar"
      className="bg-[#0f172a]/95 backdrop-blur-md fixed top-0 w-full z-50 border-b border-[#1e293b] flex items-center px-4 h-14 transition-colors text-white"
    >
      <div className="flex items-center gap-3 w-full max-w-7xl mx-auto">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#22c55e] text-[#052e16] flex items-center justify-center font-black shadow-md shadow-green-950/40">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] md:text-[19px] font-bold text-[#f8fafc] tracking-tight truncate">
                E & I Documents
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1e293b] text-[#4ade80] border border-[#334155]">
                <Activity className="w-2.5 h-2.5 mr-1" />
                Live Rates (₹)
              </span>
            </div>
            <p className="text-[10px] text-[#94a3b8] -mt-0.5 hidden md:block">
              Electrical & Instrumentation Procurement & Order Management
            </p>
          </div>
        </div>

        {/* Right action items */}
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {/* Notification Button */}
          <button
            id="btn-notifications"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-[#1e293b] hover:bg-[#334155] border border-[#334155] active:scale-95 transition-all text-[#cbd5e1]"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ef4444] rounded-full ring-2 ring-[#0f172a]" />
            )}
          </button>

          {/* User Profile Badge (Replaced girl's picture with official E&I Engineering badge) */}
          <div
            id="user-profile-badge"
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#1e293b] border border-[#334155] text-white hover:border-[#4ade80]/50 transition-all cursor-pointer"
            title="E & I Lead PM (RBM Infracon)"
          >
            <div className="w-6 h-6 rounded-lg bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/40 flex items-center justify-center text-[10px] font-black">
              EI
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[11px] font-semibold text-[#f8fafc] leading-tight">
                E & I Lead
              </span>
              <span className="text-[9px] text-[#94a3b8] leading-none">RBM Site Kutch</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
