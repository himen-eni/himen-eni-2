import React, { useState } from 'react';
import { X, Layers, Building, IndianRupee, User, MapPin } from 'lucide-react';
import { StructureProject } from '../types';

interface NewStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStructure: (structure: StructureProject) => void;
}

export const NewStructureModal: React.FC<NewStructureModalProps> = ({
  isOpen,
  onClose,
  onAddStructure
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState(`ST-${Math.floor(54 + Math.random() * 50)}`);
  const [phase, setPhase] = useState('Planning');
  const [location, setLocation] = useState('Adani Wilmar Site, Kutchh');
  const [manager, setManager] = useState('E & I Lead PM');
  const [budget, setBudget] = useState('500000');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: StructureProject = {
      id: `proj-${Date.now()}`,
      code: code || `ST-${Math.floor(54 + Math.random() * 50)}`,
      name: name.trim(),
      phase: phase,
      statusColor: phase === 'Complete' ? 'emerald' : 'gray',
      isComplete: phase === 'Complete',
      requiresAction: phase === 'Execution' || phase === 'Planning',
      lastUpdated: 'Just now',
      description: description || 'New plant structure E&I deployment unit.',
      overallCompletion: phase === 'Complete' ? 100 : phase === 'Execution' ? 25 : 0,
      location: location || 'Adani Wilmar Site, Kutchh',
      manager: manager || 'E & I Lead PM',
      budget: budget ? parseFloat(budget) : 500000,
      spent: 0,
      totalAmount: 0,
      totalPoAmount: 0,
      totalSoAmount: 0,
      materialIndentStatus: {
        type: 'MATERIAL_INDENT',
        label: 'Material Indent',
        status: 'Draft',
        count: 0,
        canDownload: false,
        canView: false,
        totalAmount: 0,
        documents: []
      },
      poStatus: {
        type: 'PO',
        label: 'Purchase Order (PO)',
        status: 'Pending',
        count: 0,
        canDownload: false,
        canView: false,
        totalAmount: 0,
        documents: []
      },
      serviceIndentStatus: {
        type: 'SERVICE_INDENT',
        label: 'Service Indent',
        status: 'Draft',
        count: 0,
        canDownload: false,
        canView: false,
        totalAmount: 0,
        documents: []
      },
      soStatus: {
        type: 'SO',
        label: 'Service Order (SO)',
        status: 'Pending',
        count: 0,
        canDownload: false,
        canView: false,
        totalAmount: 0,
        documents: []
      }
    };

    onAddStructure(newProject);
    onClose();
  };

  return (
    <div
      id="new-structure-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 text-white"
    >
      <div
        id="new-structure-modal-card"
        className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#131d33]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#22c55e] text-[#052e16] flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#f8fafc]">Add Plant Structure</h3>
              <p className="text-[11px] text-[#94a3b8]">Register new E&I engineering plant unit</p>
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

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
                Structure Code (e.g. ST-54)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-[13px] text-[#f8fafc] font-mono focus:outline-hidden focus:border-[#4ade80]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
                Project Phase
              </label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-[13px] text-[#f8fafc] focus:outline-hidden focus:border-[#4ade80]"
              >
                <option value="Planning">Planning</option>
                <option value="Execution">Execution</option>
                <option value="Phase 1">Phase 1</option>
                <option value="Phase 2">Phase 2</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
              Structure / Unit Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ST-54-Refinery Boiler Substation"
              required
              className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-[13px] text-[#f8fafc] focus:outline-hidden focus:border-[#4ade80]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
                Budget Allocation (₹ INR)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-[13px] text-[#4ade80] font-bold focus:outline-hidden focus:border-[#4ade80]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
                Engineering Lead
              </label>
              <input
                type="text"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-[13px] text-[#f8fafc] focus:outline-hidden focus:border-[#4ade80]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
              Location / Facility
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Adani Wilmar Site, Kutchh"
              className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-[13px] text-[#f8fafc] focus:outline-hidden focus:border-[#4ade80]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
              Description & Scope
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of electrical & instrumentation scope..."
              className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-[13px] text-[#f8fafc] focus:outline-hidden focus:border-[#4ade80]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-medium text-[#94a3b8] hover:bg-[#1e293b] hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-[13px] font-bold bg-[#22c55e] hover:bg-[#16a34a] text-[#052e16] rounded-xl transition-all shadow-md active:scale-95"
            >
              Add Structure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
