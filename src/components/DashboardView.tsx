import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  Layers,
  FileText,
  IndianRupee,
  Sparkles,
  Building,
  Activity,
  Trash2,
  FolderDown,
  FileArchive
} from 'lucide-react';
import { StructureProject, DocumentSection, DocumentType, DocumentItem } from '../types';
import { formatRupees, formatCompactRupees } from '../utils/aiRateScanner';
import {
  downloadDocumentFile,
  downloadProjectArchive,
  downloadSectionArchive,
  downloadAllStructuresReport
} from '../utils/documentUtils';

interface DashboardViewProps {
  projects: StructureProject[];
  onOpenDocumentModal: (project: StructureProject, section: DocumentSection) => void;
  onDeleteDocument: (projectId: string, docType: DocumentType, docId: string) => void;
}

type FilterTab = 'all' | 'with-docs' | 'pending' | 'completed';

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onOpenDocumentModal,
  onDeleteDocument
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(projects[0]?.id || null);
  const [deleteConfirmDocId, setDeleteConfirmDocId] = useState<string | null>(null);

  // Calculate high-level aggregate metrics across all 53 plant structures
  const totalStructures = projects.length;
  const structuresWithDocs = projects.filter(
    (p) =>
      p.materialIndentStatus.documents.length > 0 ||
      p.poStatus.documents.length > 0 ||
      p.serviceIndentStatus.documents.length > 0 ||
      p.soStatus.documents.length > 0
  ).length;

  const grandTotalPoRupees = projects.reduce((acc, p) => acc + (p.totalPoAmount || 0), 0);
  const grandTotalSoRupees = projects.reduce((acc, p) => acc + (p.totalSoAmount || 0), 0);
  const grandTotalAllRupees = grandTotalPoRupees + grandTotalSoRupees;

  // Filter projects list based on search and selected tab
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const hasDocs =
      project.materialIndentStatus.documents.length > 0 ||
      project.poStatus.documents.length > 0 ||
      project.serviceIndentStatus.documents.length > 0 ||
      project.soStatus.documents.length > 0;

    if (activeFilter === 'with-docs') return hasDocs;
    if (activeFilter === 'pending') return !hasDocs;
    if (activeFilter === 'completed') return project.isComplete;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDeleteItem = (
    projectId: string,
    docType: DocumentType,
    docId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onDeleteDocument(projectId, docType, docId);
    setDeleteConfirmDocId(null);
  };

  return (
    <div id="dashboard-view-container" className="flex-1 flex flex-col gap-5 text-white">
      {/* Top Banner / Executive Overview - 2 Accesses: View & Download only */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#131d33] border border-[#1e293b] rounded-2xl p-4 md:p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse" />
            <h2 className="text-[18px] md:text-[20px] font-black text-[#f8fafc] tracking-tight">
              Structure Explorer & E&I Order Hub
            </h2>
          </div>
          <p className="text-[12px] text-[#94a3b8] mt-0.5">
            53 Plant Structures • Real-time AI Rate Scanning (₹ INR) • 2 Access Controls: View & Download
          </p>
        </div>

        {/* Dashboard Access: Download Master Plant Archive */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => downloadAllStructuresReport(projects)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1e293b] hover:bg-[#334155] text-[#4ade80] border border-[#334155] hover:border-[#4ade80]/50 rounded-xl font-bold text-[13px] transition-all shadow-md active:scale-95"
            title="Download Master Plant Report with all PO & SO Valuations"
          >
            <Download className="w-4 h-4" />
            <span>Download Master Report</span>
          </button>
        </div>
      </div>

      {/* Aggregate Valuation & Metric Cards (Dark Mode Bento Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Plant Units */}
        <div className="bg-[#131d33] border border-[#1e293b] rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
              Plant Structures
            </span>
            <span className="w-7 h-7 rounded-lg bg-[#1e293b] text-[#cbd5e1] flex items-center justify-center">
              <Building className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[24px] font-black text-[#f8fafc]">{totalStructures}</span>
            <span className="text-[11px] text-[#4ade80]">
              {structuresWithDocs} with files
            </span>
          </div>
          <p className="text-[10px] text-[#64748b] mt-1">ST-1 to ST-53 Units loaded</p>
        </div>

        {/* Metric 2: Total PO Value (in ₹ Rupees) */}
        <div className="bg-[#131d33] border border-[#1e293b] rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
              Total PO Value (₹)
            </span>
            <span className="w-7 h-7 rounded-lg bg-[#22c55e]/20 text-[#4ade80] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-[22px] font-black text-[#4ade80] font-mono">
              {formatCompactRupees(grandTotalPoRupees)}
            </span>
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-1 truncate">
            Exact: {formatRupees(grandTotalPoRupees)}
          </p>
        </div>

        {/* Metric 3: Total SO Value (in ₹ Rupees) */}
        <div className="bg-[#131d33] border border-[#1e293b] rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
              Total SO Value (₹)
            </span>
            <span className="w-7 h-7 rounded-lg bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-[22px] font-black text-[#38bdf8] font-mono">
              {formatCompactRupees(grandTotalSoRupees)}
            </span>
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-1 truncate">
            Exact: {formatRupees(grandTotalSoRupees)}
          </p>
        </div>

        {/* Metric 4: Combined Total Valuation */}
        <div className="bg-[#131d33] border border-[#1e293b] rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider">
              Grand Valuation (₹)
            </span>
            <span className="w-7 h-7 rounded-lg bg-[#a855f7]/20 text-[#c084fc] flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-[22px] font-black text-[#c084fc] font-mono">
              {formatCompactRupees(grandTotalAllRupees)}
            </span>
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-1">
            Total of all PO & SO Files Ingested
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#131d33] border border-[#1e293b] rounded-2xl p-3 shadow-md">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by structure ID (e.g. ST-1, ST-34) or name..."
            className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-9 pr-4 py-2 text-[13px] text-[#f8fafc] placeholder-[#64748b] focus:outline-hidden focus:border-[#4ade80]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'all', label: `All (${projects.length})` },
              { key: 'with-docs', label: `With Files (${structuresWithDocs})` },
              { key: 'pending', label: `Pending (${totalStructures - structuresWithDocs})` }
            ] as Array<{ key: FilterTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                activeFilter === tab.key
                  ? 'bg-[#22c55e] text-[#052e16] shadow-sm'
                  : 'bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] border border-[#334155]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 53 Plant Structures List */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center bg-[#131d33] border border-[#1e293b] rounded-2xl">
            <AlertCircle className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
            <p className="text-[14px] font-bold text-[#f8fafc]">No matching structures found</p>
            <p className="text-[12px] text-[#94a3b8]">Try adjusting your search query or filter.</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isExpanded = expandedId === project.id;
            const hasAnyDocs =
              project.materialIndentStatus.documents.length > 0 ||
              project.poStatus.documents.length > 0 ||
              project.serviceIndentStatus.documents.length > 0 ||
              project.soStatus.documents.length > 0;

            const totalDocCount =
              project.materialIndentStatus.documents.length +
              project.poStatus.documents.length +
              project.serviceIndentStatus.documents.length +
              project.soStatus.documents.length;

            return (
              <div
                key={project.id}
                className={`bg-[#131d33] border rounded-2xl transition-all overflow-hidden ${
                  isExpanded
                    ? 'border-[#4ade80]/50 shadow-xl ring-1 ring-[#4ade80]/30'
                    : 'border-[#1e293b] hover:border-[#334155]'
                }`}
              >
                {/* Structure Header Bar (Click to expand/collapse) */}
                <div
                  onClick={() => toggleExpand(project.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#18243e] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1e293b] border border-[#334155] text-[#4ade80] font-black flex items-center justify-center text-[12px] shrink-0">
                      {project.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-[#f8fafc]">
                          {project.name}
                        </h3>
                        {hasAnyDocs && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/30">
                            {totalDocCount} File{totalDocCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#94a3b8]">{project.description}</p>
                    </div>
                  </div>

                  {/* Summary, Valuations & Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      {project.totalPoAmount > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#4ade80] text-[11px] font-bold font-mono">
                          PO: {formatCompactRupees(project.totalPoAmount)}
                        </span>
                      )}
                      {project.totalSoAmount > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] text-[11px] font-bold font-mono">
                          SO: {formatCompactRupees(project.totalSoAmount)}
                        </span>
                      )}
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#94a3b8]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details: 4-Section Paired Grid (Material Indent + PO, Service Indent + SO) */}
                {/* STRICT 2 ACCESS CONTROLS: VIEW & DOWNLOAD ONLY */}
                {isExpanded && (
                  <div className="p-4 md:p-5 border-t border-[#1e293b] bg-[#0b0f17] flex flex-col gap-4 animate-in fade-in duration-150">
                    {/* Structure Info Row - 2 Accesses: View Details & Download Archive */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#131d33] border border-[#1e293b] text-[12px]">
                      <div className="flex items-center gap-4">
                        <span className="text-[#94a3b8]">
                          Structure ID: <strong className="text-white">{project.code}</strong>
                        </span>
                        <span className="text-[#94a3b8]">
                          Location: <strong className="text-white">{project.location}</strong>
                        </span>
                        <span className="text-[#94a3b8]">
                          Completion: <strong className="text-[#4ade80]">{project.overallCompletion}%</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadProjectArchive(project)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] border border-[#334155] hover:text-[#4ade80] flex items-center gap-1.5 transition-all"
                          title="Download all files of this plant structure"
                        >
                          <Download className="w-3.5 h-3.5 text-[#4ade80]" />
                          <span>Download Archive</span>
                        </button>
                      </div>
                    </div>

                    {/* 4 Document Status Cards in 2 Logical Procurement Pairs */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* PAIR 1: MATERIAL PROCUREMENT (Material Indent & PO) */}
                      <div className="bg-[#131d33] border border-[#1e293b] rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
                            <h4 className="text-[13px] font-black text-white uppercase tracking-wider">
                              Material Procurement Pair
                            </h4>
                          </div>
                          {project.totalPoAmount > 0 && (
                            <span className="text-[11px] font-bold text-[#4ade80] font-mono">
                              Total PO: {formatRupees(project.totalPoAmount)}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Item 1: Material Indent - 2 Accesses: View & Download */}
                          <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-white">
                                  Material Indent
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#0f172a] text-[#94a3b8]">
                                  {project.materialIndentStatus.documents.length} File{project.materialIndentStatus.documents.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#94a3b8] mt-1">
                                Requisition of E&I hardware & cables
                              </p>
                            </div>

                            {/* Direct Document Items List with Delete Option near each item */}
                            {project.materialIndentStatus.documents.length > 0 && (
                              <div className="space-y-1.5 my-1">
                                {project.materialIndentStatus.documents.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="p-2 rounded-lg bg-[#0f172a] border border-[#334155] flex items-center justify-between gap-2 text-[11px]"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-[#f8fafc] truncate" title={doc.name}>
                                        {doc.name}
                                      </p>
                                      <span className="text-[9px] text-[#64748b] font-mono">
                                        {doc.referenceNo}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => downloadDocumentFile(doc, project)}
                                        className="p-1 rounded hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#4ade80] transition-colors"
                                        title="Download this file (.xlsx)"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (deleteConfirmDocId === doc.id) {
                                            handleDeleteItem(project.id, 'MATERIAL_INDENT', doc.id, e);
                                          } else {
                                            setDeleteConfirmDocId(doc.id);
                                          }
                                        }}
                                        className={`p-1 rounded transition-colors ${
                                          deleteConfirmDocId === doc.id
                                            ? 'bg-[#ef4444] text-white'
                                            : 'hover:bg-[#ef4444]/20 text-[#94a3b8] hover:text-[#ef4444]'
                                        }`}
                                        title={deleteConfirmDocId === doc.id ? 'Click again to confirm delete' : 'Delete item'}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Section Level Actions: ONLY 2 ACCESSES (VIEW & DOWNLOAD) */}
                            <div className="flex items-center gap-2 pt-2 border-t border-[#334155]">
                              <button
                                onClick={() => onOpenDocumentModal(project, project.materialIndentStatus)}
                                className="flex-1 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#334155] text-[#cbd5e1] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#334155] transition-colors"
                                title="View Material Indents"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => downloadSectionArchive(project, project.materialIndentStatus)}
                                className="flex-1 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[#4ade80] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#334155] transition-colors"
                                title="Download Material Indents Archive"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>

                          {/* Item 2: Purchase Order (PO) - 2 Accesses: View PO & Rates, Download */}
                          <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#22c55e]/30 flex flex-col justify-between gap-3 shadow-sm">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#4ade80] flex items-center gap-1">
                                  <span>Purchase Order (PO)</span>
                                  <Sparkles className="w-2.5 h-2.5" />
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#22c55e]/20 text-[#4ade80]">
                                  {project.poStatus.documents.length} File{project.poStatus.documents.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="mt-1 flex items-baseline justify-between">
                                <span className="text-[10px] text-[#94a3b8]">PO Total Amount:</span>
                                <span className="text-[12px] font-mono font-bold text-[#4ade80]">
                                  {project.totalPoAmount > 0 ? formatRupees(project.totalPoAmount) : '₹ 0'}
                                </span>
                              </div>
                            </div>

                            {/* Direct PO Items List with Delete Option near each item */}
                            {project.poStatus.documents.length > 0 && (
                              <div className="space-y-1.5 my-1">
                                {project.poStatus.documents.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="p-2 rounded-lg bg-[#0f172a] border border-[#22c55e]/30 flex items-center justify-between gap-2 text-[11px]"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-[#f8fafc] truncate" title={doc.name}>
                                        {doc.name}
                                      </p>
                                      <div className="flex items-center justify-between text-[9px] text-[#94a3b8] mt-0.5">
                                        <span className="font-mono">{doc.referenceNo}</span>
                                        {doc.amount ? (
                                          <span className="font-bold text-[#4ade80] font-mono">
                                            {formatRupees(doc.amount)}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => downloadDocumentFile(doc, project)}
                                        className="p-1 rounded hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#4ade80] transition-colors"
                                        title="Download PO file (.xlsx)"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (deleteConfirmDocId === doc.id) {
                                            handleDeleteItem(project.id, 'PO', doc.id, e);
                                          } else {
                                            setDeleteConfirmDocId(doc.id);
                                          }
                                        }}
                                        className={`p-1 rounded transition-colors ${
                                          deleteConfirmDocId === doc.id
                                            ? 'bg-[#ef4444] text-white'
                                            : 'hover:bg-[#ef4444]/20 text-[#94a3b8] hover:text-[#ef4444]'
                                        }`}
                                        title={deleteConfirmDocId === doc.id ? 'Click again to confirm delete' : 'Delete PO item'}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Section Level Actions: ONLY 2 ACCESSES (VIEW & DOWNLOAD) */}
                            <div className="flex items-center gap-2 pt-2 border-t border-[#334155]">
                              <button
                                onClick={() => onOpenDocumentModal(project, project.poStatus)}
                                className="flex-1 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#052e16] text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                title="View PO & Rate Breakdown"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View POs</span>
                              </button>
                              <button
                                onClick={() => downloadSectionArchive(project, project.poStatus)}
                                className="flex-1 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[#4ade80] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#334155] transition-colors"
                                title="Download PO Excel Archive"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PAIR 2: SERVICES & CONTRACTING (Service Indent & SO) */}
                      <div className="bg-[#131d33] border border-[#1e293b] rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                            <h4 className="text-[13px] font-black text-white uppercase tracking-wider">
                              Services & Contracting Pair
                            </h4>
                          </div>
                          {project.totalSoAmount > 0 && (
                            <span className="text-[11px] font-bold text-[#38bdf8] font-mono">
                              Total SO: {formatRupees(project.totalSoAmount)}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Item 3: Service Indent - 2 Accesses: View & Download */}
                          <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] flex flex-col justify-between gap-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-white">
                                  Service Indent
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#0f172a] text-[#94a3b8]">
                                  {project.serviceIndentStatus.documents.length} File{project.serviceIndentStatus.documents.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#94a3b8] mt-1">
                                Scope of E&I erection & cabling works
                              </p>
                            </div>

                            {/* Direct Document Items List with Delete Option near each item */}
                            {project.serviceIndentStatus.documents.length > 0 && (
                              <div className="space-y-1.5 my-1">
                                {project.serviceIndentStatus.documents.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="p-2 rounded-lg bg-[#0f172a] border border-[#334155] flex items-center justify-between gap-2 text-[11px]"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-[#f8fafc] truncate" title={doc.name}>
                                        {doc.name}
                                      </p>
                                      <span className="text-[9px] text-[#64748b] font-mono">
                                        {doc.referenceNo}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => downloadDocumentFile(doc, project)}
                                        className="p-1 rounded hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#38bdf8] transition-colors"
                                        title="Download this file (.xlsx)"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (deleteConfirmDocId === doc.id) {
                                            handleDeleteItem(project.id, 'SERVICE_INDENT', doc.id, e);
                                          } else {
                                            setDeleteConfirmDocId(doc.id);
                                          }
                                        }}
                                        className={`p-1 rounded transition-colors ${
                                          deleteConfirmDocId === doc.id
                                            ? 'bg-[#ef4444] text-white'
                                            : 'hover:bg-[#ef4444]/20 text-[#94a3b8] hover:text-[#ef4444]'
                                        }`}
                                        title={deleteConfirmDocId === doc.id ? 'Click again to confirm delete' : 'Delete item'}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Section Level Actions: ONLY 2 ACCESSES (VIEW & DOWNLOAD) */}
                            <div className="flex items-center gap-2 pt-2 border-t border-[#334155]">
                              <button
                                onClick={() => onOpenDocumentModal(project, project.serviceIndentStatus)}
                                className="flex-1 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#334155] text-[#cbd5e1] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#334155] transition-colors"
                                title="View Service Indents"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => downloadSectionArchive(project, project.serviceIndentStatus)}
                                className="flex-1 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#334155] transition-colors"
                                title="Download Service Indents Excel Archive"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>

                          {/* Item 4: Service Order (SO) - 2 Accesses: View SO & Rates, Download */}
                          <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#38bdf8]/30 flex flex-col justify-between gap-3 shadow-sm">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#38bdf8] flex items-center gap-1">
                                  <span>Service Order (SO)</span>
                                  <Sparkles className="w-2.5 h-2.5" />
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#38bdf8]/20 text-[#38bdf8]">
                                  {project.soStatus.documents.length} File{project.soStatus.documents.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="mt-1 flex items-baseline justify-between">
                                <span className="text-[10px] text-[#94a3b8]">SO Total Amount:</span>
                                <span className="text-[12px] font-mono font-bold text-[#38bdf8]">
                                  {project.totalSoAmount > 0 ? formatRupees(project.totalSoAmount) : '₹ 0'}
                                </span>
                              </div>
                            </div>

                            {/* Direct SO Items List with Delete Option near each item */}
                            {project.soStatus.documents.length > 0 && (
                              <div className="space-y-1.5 my-1">
                                {project.soStatus.documents.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="p-2 rounded-lg bg-[#0f172a] border border-[#38bdf8]/30 flex items-center justify-between gap-2 text-[11px]"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-[#f8fafc] truncate" title={doc.name}>
                                        {doc.name}
                                      </p>
                                      <div className="flex items-center justify-between text-[9px] text-[#94a3b8] mt-0.5">
                                        <span className="font-mono">{doc.referenceNo}</span>
                                        {doc.amount ? (
                                          <span className="font-bold text-[#38bdf8] font-mono">
                                            {formatRupees(doc.amount)}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => downloadDocumentFile(doc, project)}
                                        className="p-1 rounded hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#38bdf8] transition-colors"
                                        title="Download SO file (.xlsx)"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (deleteConfirmDocId === doc.id) {
                                            handleDeleteItem(project.id, 'SO', doc.id, e);
                                          } else {
                                            setDeleteConfirmDocId(doc.id);
                                          }
                                        }}
                                        className={`p-1 rounded transition-colors ${
                                          deleteConfirmDocId === doc.id
                                            ? 'bg-[#ef4444] text-white'
                                            : 'hover:bg-[#ef4444]/20 text-[#94a3b8] hover:text-[#ef4444]'
                                        }`}
                                        title={deleteConfirmDocId === doc.id ? 'Click again to confirm delete' : 'Delete SO item'}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Section Level Actions: ONLY 2 ACCESSES (VIEW & DOWNLOAD) */}
                            <div className="flex items-center gap-2 pt-2 border-t border-[#334155]">
                              <button
                                onClick={() => onOpenDocumentModal(project, project.soStatus)}
                                className="flex-1 py-1.5 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] text-[#082f49] text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                title="View SO & Rate Breakdown"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View SOs</span>
                              </button>
                              <button
                                onClick={() => downloadSectionArchive(project, project.soStatus)}
                                className="flex-1 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#334155] transition-colors"
                                title="Download SO Archive"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
