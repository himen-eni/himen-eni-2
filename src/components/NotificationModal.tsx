import React from 'react';
import { X, Bell, CheckCircle2, Clock, FileText, AlertCircle, Trash2 } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearNotifications: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearNotifications
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="notifications-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 text-white"
    >
      <div
        id="notifications-modal-card"
        className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
      >
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#131d33]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#4ade80] flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#f8fafc]">E & I Activity Logs</h3>
              <p className="text-[11px] text-[#94a3b8]">Procurement audit trail & rate calculations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f8fafc] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-[#94a3b8]">
              <Bell className="w-8 h-8 text-[#334155] mx-auto mb-2" />
              <p className="text-[13px] font-bold text-[#f8fafc]">No activity notifications</p>
              <p className="text-[11px] text-[#94a3b8]">System is ready for new document uploads.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border transition-all ${
                  n.read
                    ? 'bg-[#131d33] border-[#1e293b]'
                    : 'bg-[#1e293b] border-[#4ade80]/40 shadow-sm ring-1 ring-[#4ade80]/20'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 mt-0.5">
                    {n.type === 'approval' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                    ) : n.type === 'alert' ? (
                      <AlertCircle className="w-4 h-4 text-[#ef4444]" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#38bdf8]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-[12px] ${
                          n.read ? 'font-medium text-[#cbd5e1]' : 'font-bold text-[#f8fafc]'
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[9px] text-[#94a3b8] whitespace-nowrap">
                        {n.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] mt-0.5">{n.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[#1e293b] bg-[#131d33] flex justify-between items-center text-[12px]">
          <button
            onClick={onClearNotifications}
            className="flex items-center gap-1 text-[#94a3b8] hover:text-[#ef4444] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="px-3 py-1.5 rounded-xl bg-[#1e293b] border border-[#334155] text-[#cbd5e1] hover:bg-[#334155] font-semibold text-[11px] transition-colors"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-[#22c55e] text-[#052e16] hover:bg-[#16a34a] font-bold text-[11px] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
