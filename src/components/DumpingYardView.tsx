import React, { useState } from 'react';
import {
  FolderSync,
  Search,
  UploadCloud,
  FileText,
  Eye,
  Download,
  IndianRupee,
  Sparkles,
  Building,
  CheckCircle,
  Clock,
  Layers,
  Plus,
  AlertCircle,
  Trash2,
  FolderDown
} from 'lucide-react';
import { StructureProject, DocumentSection, DocumentType } from '../types';
import { formatRupees, formatCompactRupees } from '../utils/aiRateScanner';
import {
  downloadDocumentFile,
  downloadOriginalFileAsync,
  downloadProjectArchive,
  downloadSectionArchive,
  downloadAllStructuresReport
} from '../utils/documentUtils';

interface DumpingYardViewProps {
  projects: StructureProject[];
  onOpenDocumentModal: (project: StructureProject, section: DocumentSection, specificDocId?: string) => void;
  onOpenUpload: (project?: StructureProject, docType?: DocumentType) => void;
  onDeleteDocument: (projectId: string, docType: DocumentType, docId: string) => void;
}

export const DumpingYardView: React.FC<DumpingYardViewProps> = ({
  projects,
  onOpenDocumentModal,
  onOpenUpload,
  onDeleteDocument
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'MATERIAL' | 'SERVICE'>('ALL');
  const [deleteConfirmDocId, setDeleteConfirmDocId] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPoAllRupees = projects.reduce((acc, p) => acc + (p.totalPoAmount || 0), 0);
  const totalSoAllRupees = projects.reduce((acc, p) => acc + (p.totalSoAmount || 0), 0);

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
    <div id="dumping-yard-view-container" className="flex-1 flex flex-col gap-5 text-white">
      {/* Top Banner - 3 Access Features: Upload, Download, View */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#131d33] border border-[#1e293b] rounded-2xl p-4 md:p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#4ade80] flex items-center justify-center font-bold">
              <FolderSync className="w-4 h-4" />
            </div>
            <h2 className="text-[18px] md:text-[20px] font-black text-[#f8fafc] tracking-tight">
              Dumping Yard • Master Document Repository
            </h2>
          </div>
          <p className="text-[12px] text-[#94a3b8] mt-1">
            Full Ingestion Center • 3 Access Capabilities: Upload, Download & View • Item-level Deletion
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadAllStructuresReport(projects)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[12px] font-bold text-[#cbd5e1] hover:text-[#4ade80] transition-all"
            title="Download Master Repository Report"
          >
            <Download className="w-4 h-4 text-[#4ade80]" />
            <span>Export Archive</span>
          </button>
          <button
            onClick={() => onOpenUpload()}
            className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-[#052e16] rounded-xl font-bold text-[13px] transition-all shadow-md shadow-green-950/40 active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Multiple Documents</span>
          </button>
        </div>
      </div>

      {/* Search & Filter controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#131d33] border border-[#1e293b] rounded-2xl p-3 shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plant structures (ST-1 to ST-53)..."
            className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-9 pr-4 py-2 text-[13px] text-[#f8fafc] placeholder-[#64748b] focus:outline-hidden focus:border-[#4ade80]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              activeCategoryFilter === 'ALL'
                ? 'bg-[#22c55e] text-[#052e16]'
                : 'bg-[#1e293b] text-[#94a3b8] hover:text-white border border-[#334155]'
            }`}
          >
            All 4 Categories
          </button>
          <button
            onClick={() => setActiveCategoryFilter('MATERIAL')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              activeCategoryFilter === 'MATERIAL'
                ? 'bg-[#4ade80] text-[#052e16]'
                : 'bg-[#1e293b] text-[#94a3b8] hover:text-white border border-[#334155]'
            }`}
          >
            Material (Indent + PO)
          </button>
          <button
            onClick={() => setActiveCategoryFilter('SERVICE')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              activeCategoryFilter === 'SERVICE'
                ? 'bg-[#38bdf8] text-[#082f49]'
                : 'bg-[#1e293b] text-[#94a3b8] hover:text-white border border-[#334155]'
            }`}
          >
            Service (Indent + SO)
          </button>
        </div>
      </div>

      {/* 53 Plant Structures Bento Grid in Dumping Yard */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center bg-[#131d33] border border-[#1e293b] rounded-2xl">
            <AlertCircle className="w-8 h-8 text-[#94a3b8] mx-auto mb-2" />
            <p className="text-[14px] font-bold text-[#f8fafc]">No plant structure matches search</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const showMaterial = activeCategoryFilter === 'ALL' || activeCategoryFilter === 'MATERIAL';
            const showService = activeCategoryFilter === 'ALL' || activeCategoryFilter === 'SERVICE';

            return (
              <div
                key={project.id}
                className="bg-[#131d33] border border-[#1e293b] rounded-2xl p-4 md:p-5 shadow-lg flex flex-col gap-4 hover:border-[#334155] transition-all"
              >
                {/* Structure Header - with 3 accesses: Upload, Download Archive, View */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1e293b] gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1e293b] border border-[#334155] text-[#4ade80] font-black flex items-center justify-center text-[12px] shrink-0">
                      {project.code}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-white">{project.name}</h3>
                      <p className="text-[11px] text-[#94a3b8]">{project.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {project.totalPoAmount > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#4ade80] text-[11px] font-bold font-mono">
                        PO: {formatRupees(project.totalPoAmount)}
                      </span>
                    )}
                    {project.totalSoAmount > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] text-[11px] font-bold font-mono">
                        SO: {formatRupees(project.totalSoAmount)}
                      </span>
                    )}
                    <button
                      onClick={() => downloadProjectArchive(project)}
                      className="p-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[#cbd5e1] hover:text-[#4ade80] border border-[#334155]"
                      title="Download Structure Archive"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenUpload(project, 'MATERIAL_INDENT')}
                      className="px-2.5 py-1 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#052e16] text-[11px] font-bold flex items-center gap-1"
                      title="Upload file to structure"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>

                {/* 4 Category Repository Cards - EACH HAS 3 ACCESSES: UPLOAD, DOWNLOAD, VIEW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Category 1: Material Indent */}
                  {showMaterial && (
                    <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white">
                            Material Indent
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0f172a] text-[#94a3b8] font-bold">
                            {project.materialIndentStatus.documents.length} Files
                          </span>
                        </div>
                        <p className="text-[10px] text-[#94a3b8] mt-1">Material requisition sheets</p>
                      </div>

                      {/* Documents List with Delete Button near each item */}
                      {project.materialIndentStatus.documents.length > 0 && (
                        <div className="space-y-1 my-1">
                          {project.materialIndentStatus.documents.map((doc) => (
                            <div
                              key={doc.id}
                              onClick={() => onOpenDocumentModal(project, project.materialIndentStatus, doc.id)}
                              className="p-1.5 rounded-lg bg-[#0f172a] hover:bg-[#131d33] border border-[#334155] hover:border-[#38bdf8]/40 flex items-center justify-between gap-1.5 text-[10px] cursor-pointer transition-colors group"
                            >
                              <span className="truncate flex-1 text-[#f8fafc] group-hover:text-[#38bdf8]" title={doc.name}>
                                {doc.name}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDocumentModal(project, project.materialIndentStatus, doc.id);
                                  }}
                                  className="p-0.5 text-[#94a3b8] hover:text-[#38bdf8]"
                                  title="View document"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadOriginalFileAsync(doc, project);
                                  }}
                                  className="p-0.5 text-[#94a3b8] hover:text-[#4ade80]"
                                  title="Download file"
                                >
                                  <Download className="w-3 h-3" />
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
                                  className={`p-0.5 rounded ${
                                    deleteConfirmDocId === doc.id
                                      ? 'bg-[#ef4444] text-white px-1 text-[9px]'
                                      : 'text-[#94a3b8] hover:text-[#ef4444]'
                                  }`}
                                  title={deleteConfirmDocId === doc.id ? 'Confirm delete' : 'Delete item'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 3 ACCESS BUTTONS: UPLOAD, DOWNLOAD, VIEW */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-[#334155]">
                        <button
                          onClick={() => onOpenDocumentModal(project, project.materialIndentStatus)}
                          className="flex-1 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#334155] text-[#cbd5e1] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#334155]"
                          title="View all files"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => downloadSectionArchive(project, project.materialIndentStatus)}
                          className="py-1.5 px-2 rounded-lg bg-[#0f172a] hover:bg-[#334155] text-[#4ade80] text-[11px] font-bold border border-[#334155]"
                          title="Download Section Archive"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onOpenUpload(project, 'MATERIAL_INDENT')}
                          className="py-1.5 px-2 rounded-lg bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-[#4ade80] text-[11px] font-bold border border-[#22c55e]/30"
                          title="Upload Material Indent"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Category 2: Purchase Order (PO) - Placed next to Material Indent */}
                  {showMaterial && (
                    <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#22c55e]/30 flex flex-col justify-between gap-3 shadow-xs">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#4ade80] flex items-center gap-1">
                            <span>PO (Order)</span>
                            <Sparkles className="w-2.5 h-2.5" />
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#4ade80] font-bold">
                            {project.poStatus.documents.length} Files
                          </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                          <span className="text-[9px] text-[#94a3b8]">PO Total:</span>
                          <span className="font-mono font-bold text-[#4ade80]">
                            {project.totalPoAmount > 0 ? formatRupees(project.totalPoAmount) : '₹ 0'}
                          </span>
                        </div>
                      </div>

                      {/* Documents List with Delete Button near each item */}
                      {project.poStatus.documents.length > 0 && (
                        <div className="space-y-1 my-1">
                          {project.poStatus.documents.map((doc) => (
                            <div
                              key={doc.id}
                              onClick={() => onOpenDocumentModal(project, project.poStatus, doc.id)}
                              className="p-1.5 rounded-lg bg-[#0f172a] hover:bg-[#131d33] border border-[#22c55e]/30 hover:border-[#22c55e]/70 flex items-center justify-between gap-1.5 text-[10px] cursor-pointer transition-colors group"
                            >
                              <div className="truncate flex-1 min-w-0">
                                <span className="block text-[#f8fafc] group-hover:text-[#4ade80] truncate transition-colors" title={doc.name}>
                                  {doc.name}
                                </span>
                                {doc.amount ? (
                                  <span className="text-[9px] text-[#4ade80] font-mono">
                                    {formatRupees(doc.amount)}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDocumentModal(project, project.poStatus, doc.id);
                                  }}
                                  className="p-0.5 text-[#94a3b8] hover:text-[#4ade80]"
                                  title="View PO document & digitized sheet"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadOriginalFileAsync(doc, project);
                                  }}
                                  className="p-0.5 text-[#94a3b8] hover:text-[#4ade80]"
                                  title="Download PO file"
                                >
                                  <Download className="w-3 h-3" />
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
                                  className={`p-0.5 rounded ${
                                    deleteConfirmDocId === doc.id
                                      ? 'bg-[#ef4444] text-white px-1 text-[9px]'
                                      : 'text-[#94a3b8] hover:text-[#ef4444]'
                                  }`}
                                  title={deleteConfirmDocId === doc.id ? 'Confirm delete' : 'Delete PO item'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 3 ACCESS BUTTONS: UPLOAD, DOWNLOAD, VIEW */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-[#334155]">
                        <button
                          onClick={() => onOpenDocumentModal(project, project.poStatus)}
                          className="flex-1 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#052e16] text-[11px] font-bold flex items-center justify-center gap-1"
                          title="View PO and Rate Breakdown"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View POs</span>
                        </button>
                        <button
                          onClick={() => downloadSectionArchive(project, project.poStatus)}
                          className="py-1.5 px-2 rounded-lg bg-[#0f172a] hover:bg-[#334155] text-[#4ade80] text-[11px] font-bold border border-[#334155]"
                          title="Download PO Excel Archive"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onOpenUpload(project, 'PO')}
                          className="py-1.5 px-2 rounded-lg bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-[#4ade80] text-[11px] font-bold border border-[#22c55e]/30"
                          title="Upload PO"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Category 3: Service Indent */}
                  {showService && (
                    <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white">
                            Service Indent
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0f172a] text-[#94a3b8] font-bold">
                            {project.serviceIndentStatus.documents.length} Files
                          </span>
                        </div>
                        <p className="text-[10px] text-[#94a3b8] mt-1">Service scope requisitions</p>
                      </div>

                      {/* Documents List with Delete Button near each item */}
                      {project.serviceIndentStatus.documents.length > 0 && (
                        <div className="space-y-1 my-1">
                          {project.serviceIndentStatus.documents.map((doc) => (
                            <div
                              key={doc.id}
                              onClick={() => onOpenDocumentModal(project, project.serviceIndentStatus, doc.id)}
                              className="p-1.5 rounded-lg bg-[#0f172a] hover:bg-[#131d33] border border-[#334155] hover:border-[#38bdf8]/40 flex items-center justify-between gap-1.5 text-[10px] cursor-pointer transition-colors group"
                            >
                              <span className="truncate flex-1 text-[#f8fafc] group-hover:text-[#38bdf8]" title={doc.name}>
                                {doc.name}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDocumentModal(project, project.serviceIndentStatus, doc.id);
                                  }}
                                  className="p-0.5 text-[#94a3b8] hover:text-[#38bdf8]"
                                  title="View document"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadOriginalFileAsync(doc, project);
                                  }}
                                  className="p-0.5 text-[#94a3b8] hover:text-[#38bdf8]"
                                  title="Download Service Indent file"
                                >
                                  <Download className="w-3 h-3" />
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
                                  className={`p-0.5 rounded ${
                                    deleteConfirmDocId === doc.id
                                      ? 'bg-[#ef4444] text-white px-1 text-[9px]'
                                      : 'text-[#94a3b8] hover:text-[#ef4444]'
                                  }`}
                                  title={deleteConfirmDocId === doc.id ? 'Confirm delete' : 'Delete item'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 3 ACCESS BUTTONS: UPLOAD, DOWNLOAD, VIEW */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-[#334155]">
                        <button
                          onClick={() => onOpenDocumentModal(project, project.serviceIndentStatus)}
                          className="flex-1 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#334155] text-[#cbd5e1] text-[11px] font-bold flex items-center justify-center gap-1 border border-[#334155]"
                          title="View all files"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => downloadSectionArchive(project, project.serviceIndentStatus)}
                          className="py-1.5 px-2 rounded-lg bg-[#0f172a] hover:bg-[#334155] text-[#38bdf8] text-[11px] font-bold border border-[#334155]"
                          title="Download Service Indent Excel Archive"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onOpenUpload(project, 'SERVICE_INDENT')}
                          className="py-1.5 px-2 rounded-lg bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8] text-[11px] font-bold border border-[#38bdf8]/30"
                          title="Upload Service Indent"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Category 4: Service Order (SO) - Placed next to Service Indent */}
                  {showService && (
                    <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#38bdf8]/30 flex flex-col justify-between gap-3 shadow-xs">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#38bdf8] flex items-center gap-1">
                            <span>SO (Order)</span>
                            <Sparkles className="w-2.5 h-2.5" />
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold">
                            {project.soStatus.documents.length} Files
                          </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between text-[11px]">
                          <span className="text-[9px] text-[#94a3b8]">SO Total:</span>
                          <span className="font-mono font-bold text-[#38bdf8]">
                            {project.totalSoAmount > 0 ? formatRupees(project.totalSoAmount) : '₹ 0'}
                          </span>
                        </div>
                      </div>

                      {/* Documents List with Delete Button near each item */}
                      {project.soStatus.documents.length > 0 && (
                        <div className="space-y-1 my-1">
                          {project.soStatus.documents.map((doc) => (
                            <div
                              key={doc.id}
                              onClick={() => onOpenDocumentModal(project, project.soStatus, doc.id)}
                              className="p-1.5 rounded-lg bg-[#0f172a] hover:bg-[#131d33] border border-[#38bdf8]/30 hover:border-[#38bdf8]/70 flex items-center justify-between gap-1.5 text-[10px] cursor-pointer transition-colors group"
                            >
                              <div className="truncate flex-1 min-w-0">
                                <span className="block text-[#f8fafc] group-hover:text-[#38bdf8] truncate transition-colors" title={doc.name}>
                                  {doc.name}
                                </span>
                                {doc.amount ? (
                                  <span className="text-[9px] text-[#38bdf8] font-mono">
                                    {formatRupees(doc.amount)}
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenDocumentModal(project, project.soStatus, doc.id);
                                  }}
                                  className="p-0.5 text-[#94a3b8] hover:text-[#38bdf8]"
                                  title="View SO document & digitized sheet"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadOriginalFileAsync(doc, project);
                                  }}
                                  className="p-0.5 text-[#94a3b8] hover:text-[#38bdf8]"
                                  title="Download SO file"
                                >
                                  <Download className="w-3 h-3" />
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
                                  className={`p-0.5 rounded ${
                                    deleteConfirmDocId === doc.id
                                      ? 'bg-[#ef4444] text-white px-1 text-[9px]'
                                      : 'text-[#94a3b8] hover:text-[#ef4444]'
                                  }`}
                                  title={deleteConfirmDocId === doc.id ? 'Confirm delete' : 'Delete SO item'}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 3 ACCESS BUTTONS: UPLOAD, DOWNLOAD, VIEW */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-[#334155]">
                        <button
                          onClick={() => onOpenDocumentModal(project, project.soStatus)}
                          className="flex-1 py-1.5 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] text-[#082f49] text-[11px] font-bold flex items-center justify-center gap-1"
                          title="View SO and Rate Breakdown"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View SOs</span>
                        </button>
                        <button
                          onClick={() => downloadSectionArchive(project, project.soStatus)}
                          className="py-1.5 px-2 rounded-lg bg-[#0f172a] hover:bg-[#334155] text-[#38bdf8] text-[11px] font-bold border border-[#334155]"
                          title="Download SO Archive"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onOpenUpload(project, 'SO')}
                          className="py-1.5 px-2 rounded-lg bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8] text-[11px] font-bold border border-[#38bdf8]/30"
                          title="Upload SO"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
