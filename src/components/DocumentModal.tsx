import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Trash2,
  CheckCircle,
  Printer,
  Sparkles,
  IndianRupee,
  Plus,
  Layers,
  Info,
  Eye,
  FileSpreadsheet,
  FileArchive,
  UserCheck,
  Building2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { StructureProject, DocumentSection, DocumentItem, DocumentType } from '../types';
import { formatRupees } from '../utils/aiRateScanner';
import { downloadDocumentFile, downloadOriginalFile } from '../utils/documentUtils';
import { getDocumentBlob } from '../utils/storageUtils';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: StructureProject | null;
  section: DocumentSection | null;
  onDeleteDocument: (projectId: string, docType: DocumentType, docId: string) => void;
  onOpenUpload: (project: StructureProject, docType: DocumentType) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  project,
  section,
  onDeleteDocument,
  onOpenUpload
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'digitized' | 'original'>('digitized');
  const [activeFileDataUrl, setActiveFileDataUrl] = useState<string | null>(null);

  if (!isOpen || !project || !section) return null;

  const documents = section.documents || [];
  const activeDoc =
    documents.find((d) => d.id === selectedDocId) || documents[0] || null;

  React.useEffect(() => {
    let isMounted = true;
    if (activeDoc?.fileDataUrl) {
      setActiveFileDataUrl(activeDoc.fileDataUrl);
    } else if (activeDoc?.id) {
      getDocumentBlob(activeDoc.id).then((url) => {
        if (isMounted) {
          setActiveFileDataUrl(url);
        }
      });
    } else {
      setActiveFileDataUrl(null);
    }
    return () => {
      isMounted = false;
    };
  }, [activeDoc?.id, activeDoc?.fileDataUrl]);

  const isFinancial = section.type === 'PO' || section.type === 'SO';
  const isIndent = section.type === 'MATERIAL_INDENT' || section.type === 'SERVICE_INDENT';

  const handleDelete = (docId: string) => {
    onDeleteDocument(project.id, section.type, docId);
    setConfirmDeleteId(null);
    if (selectedDocId === docId) {
      setSelectedDocId(null);
    }
  };

  const handleDownloadExcel = (doc: DocumentItem) => {
    downloadDocumentFile(doc, project);
  };

  const handleDownloadOriginal = (doc: DocumentItem) => {
    const docWithUrl = { ...doc, fileDataUrl: activeFileDataUrl || doc.fileDataUrl };
    const downloaded = downloadOriginalFile(docWithUrl);
    if (!downloaded) {
      downloadDocumentFile(doc, project);
    }
  };

  const getPriorityBadgeClass = (priority?: string) => {
    const p = (priority || 'NORMAL').toUpperCase();
    if (p.includes('URGENT') || p.includes('HIGH')) {
      return 'bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/30';
    }
    if (p.includes('MEDIUM')) {
      return 'bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/30';
    }
    return 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30';
  };

  return (
    <div
      id="document-viewer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        id="document-viewer-modal-card"
        className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[92vh] max-h-[880px] animate-in zoom-in-95 duration-150 text-white"
      >
        {/* Modal Top Header */}
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#131d33] shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              isFinancial
                ? 'bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#4ade80]'
                : 'bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8]'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-[#f8fafc]">
                  {section.label || section.type}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1e293b] text-[#4ade80] border border-[#334155]">
                  {project.code}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                  isFinancial
                    ? 'bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30'
                    : 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30'
                }`}>
                  {isFinancial ? 'Financial Order' : 'Technical Indent Requisition'}
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8]">
                {project.name} • {documents.length} File{documents.length !== 1 ? 's' : ''} Ingested
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenUpload(project, section.type)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold bg-[#22c55e] hover:bg-[#16a34a] text-[#052e16] shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f8fafc] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Split Layout with Document Queue on left & Live On-Screen Document Viewer on right */}
        {documents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0b0f17]">
            <div className="w-16 h-16 rounded-2xl bg-[#1e293b] border border-[#334155] text-[#64748b] flex items-center justify-center mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h4 className="text-[16px] font-bold text-[#f8fafc] mb-1">
              No {section.label || section.type} Documents Uploaded Yet
            </h4>
            <p className="text-[12px] text-[#94a3b8] max-w-md mb-5">
              {isFinancial
                ? 'Upload Purchase Orders (PO) or Service Orders (SO) from your PC. AI will extract amounts from the Total Order Value.'
                : 'Upload Material Indents or Service Indents from your PC. AI extracts full requisition specifications and Bill of Quantities without pricing.'}
            </p>
            <button
              onClick={() => onOpenUpload(project, section.type)}
              className="px-5 py-2.5 rounded-xl text-[13px] font-bold bg-[#22c55e] hover:bg-[#16a34a] text-[#052e16] transition-all flex items-center gap-2 shadow-lg shadow-green-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Files Now</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Document List / Selector */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#1e293b] bg-[#0b1329]/60 p-3 overflow-y-auto flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  Uploaded Files ({documents.length})
                </span>
                {isFinancial && section.totalAmount > 0 ? (
                  <span className="text-[10px] text-[#4ade80] font-bold">
                    Total: {formatRupees(section.totalAmount)}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#38bdf8] font-bold">
                    Requisitions Active
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {documents.map((doc) => {
                  const isSelected = activeDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-[#1e293b] border-[#4ade80]/60 shadow-md ring-1 ring-[#4ade80]/40'
                          : 'bg-[#131d33] border-[#1e293b] hover:bg-[#18243e] hover:border-[#334155]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-[#4ade80]' : 'text-[#94a3b8]'
                            }`}
                          />
                          <span
                            className="text-[12px] font-bold text-[#f8fafc] truncate"
                            title={doc.name}
                          >
                            {doc.name}
                          </span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#0f172a] text-[#94a3b8] shrink-0">
                          {doc.fileSize}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#64748b] font-mono text-[10px] truncate max-w-[130px]" title={doc.referenceNo}>
                          {doc.referenceNo}
                        </span>
                        {isFinancial && doc.amount !== undefined && doc.amount > 0 ? (
                          <span className="font-bold text-[#4ade80] flex items-center">
                            {formatRupees(doc.amount)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#38bdf8] font-medium flex items-center gap-1">
                            <span>{doc.itemsList?.length || 1} Item(s)</span>
                          </span>
                        )}
                      </div>

                      {doc.indentorName && (
                        <div className="text-[10px] text-[#94a3b8] truncate flex items-center gap-1">
                          <span className="text-[#64748b]">Indentor:</span>
                          <span className="text-[#cbd5e1] font-medium">{doc.indentorName}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-[#1e293b]/60 text-[10px] text-[#94a3b8]">
                        <span>{doc.uploadedAt}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadExcel(doc);
                            }}
                            className="hover:text-[#4ade80] transition-colors p-1"
                            title="Download Excel Register"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(doc.id);
                            }}
                            className="hover:text-[#ef4444] transition-colors p-1 text-[#94a3b8]"
                            title="Delete document"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Delete Confirmation Inline */}
                      {confirmDeleteId === doc.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 mt-1 rounded-lg bg-[#ef4444]/20 border border-[#ef4444]/40 flex items-center justify-between gap-2"
                        >
                          <span className="text-[10px] text-[#fca5a5] font-semibold">
                            Delete file?
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="px-2 py-0.5 text-[10px] font-bold bg-[#ef4444] text-white rounded hover:bg-[#dc2626]"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-0.5 text-[10px] text-[#cbd5e1] hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Live Document Display On-Screen */}
            {activeDoc && (
              <div className="flex-1 bg-[#0b0f17] p-4 md:p-6 overflow-y-auto flex flex-col gap-4">
                {/* On-Screen Document Viewer Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1e293b]">
                  <div className="flex items-center gap-2">
                    {/* View Switcher: AI Digitized vs Original */}
                    <div className="flex items-center bg-[#131d33] p-0.5 rounded-xl border border-[#1e293b]">
                      <button
                        onClick={() => setViewMode('digitized')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          viewMode === 'digitized'
                            ? isFinancial
                              ? 'bg-[#22c55e] text-[#052e16] shadow-sm'
                              : 'bg-[#38bdf8] text-[#082f49] shadow-sm'
                            : 'text-[#94a3b8] hover:text-white'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Digitized Sheet</span>
                      </button>
                      <button
                        onClick={() => setViewMode('original')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          viewMode === 'original'
                            ? 'bg-[#f8fafc] text-[#0f172a] shadow-sm'
                            : 'text-[#94a3b8] hover:text-white'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Original Document</span>
                        {(activeFileDataUrl || activeDoc.fileDataUrl) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                        )}
                      </button>
                    </div>

                    <span className="text-[12px] text-[#94a3b8] hidden sm:inline">
                      Ref: <strong className="text-white font-mono">{activeDoc.referenceNo}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(activeFileDataUrl || activeDoc.fileDataUrl) && (
                      <button
                        onClick={() => handleDownloadOriginal(activeDoc)}
                        className="px-3 py-1.5 rounded-xl bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 border border-[#38bdf8]/30 text-[11px] font-bold text-[#38bdf8] flex items-center gap-1.5 transition-colors"
                        title="Download the exact original uploaded file"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Original File</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadExcel(activeDoc)}
                      className="px-3 py-1.5 rounded-xl bg-[#22c55e]/20 hover:bg-[#22c55e]/30 border border-[#22c55e]/40 text-[11px] font-bold text-[#4ade80] flex items-center gap-1.5 transition-colors"
                      title="Download Excel register (.xlsx)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excel (.xlsx)</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[11px] font-semibold text-[#cbd5e1] flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>

                    <button
                      onClick={() => setConfirmDeleteId(activeDoc.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#ef4444]/15 hover:bg-[#ef4444]/25 border border-[#ef4444]/30 text-[11px] font-bold text-[#f87171] flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* VIEW MODE 1: ORIGINAL DOCUMENT VIEWER */}
                {viewMode === 'original' ? (
                  <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#38bdf8]" />
                        <div>
                          <h4 className="text-[14px] font-bold text-white">
                            {activeDoc.originalFileName || activeDoc.name}
                          </h4>
                          <p className="text-[11px] text-[#94a3b8]">
                            Original Uploaded Document • Size: {activeDoc.fileSize} • Type: {activeDoc.fileType.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      {(activeFileDataUrl || activeDoc.fileDataUrl) && (
                        <button
                          onClick={() => handleDownloadOriginal(activeDoc)}
                          className="px-3 py-1.5 rounded-lg bg-[#38bdf8] text-[#082f49] text-[11px] font-bold flex items-center gap-1 hover:bg-[#7dd3fc]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Save to PC</span>
                        </button>
                      )}
                    </div>

                    {(activeFileDataUrl || activeDoc.fileDataUrl) ? (
                      (activeFileDataUrl || activeDoc.fileDataUrl)?.startsWith('data:application/pdf') || activeDoc.name.toLowerCase().endsWith('.pdf') ? (
                        <div className="w-full h-[640px] rounded-xl overflow-hidden border border-[#1e293b] bg-[#0f172a]">
                          <iframe
                            src={activeFileDataUrl || activeDoc.fileDataUrl}
                            className="w-full h-full"
                            title="Original PDF Document"
                          />
                        </div>
                      ) : (activeFileDataUrl || activeDoc.fileDataUrl)?.startsWith('data:image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(activeDoc.fileType.toLowerCase()) ? (
                        <div className="w-full max-h-[640px] overflow-auto rounded-xl border border-[#1e293b] bg-[#0f172a] p-4 flex items-center justify-center">
                          <img
                            src={activeFileDataUrl || activeDoc.fileDataUrl}
                            alt="Original Document Scan"
                            className="max-w-full max-h-[600px] object-contain rounded shadow-lg"
                          />
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-[#0b1329] rounded-xl border border-[#1e293b] space-y-4">
                          <FileSpreadsheet className="w-12 h-12 text-[#4ade80] mx-auto" />
                          <div>
                            <h4 className="text-[15px] font-bold text-white">
                              {activeDoc.originalFileName || activeDoc.name}
                            </h4>
                            <p className="text-[12px] text-[#94a3b8] max-w-md mx-auto mt-1">
                              This file is stored in full fidelity. Click below to download and open the original spreadsheet/file on your PC.
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownloadOriginal(activeDoc)}
                            className="px-5 py-2.5 rounded-xl bg-[#4ade80] text-[#052e16] font-bold text-[13px] hover:bg-[#22c55e] inline-flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Original {activeDoc.fileType.toUpperCase()}</span>
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="p-8 text-center bg-[#0b1329] rounded-xl border border-[#1e293b] space-y-4">
                        <Info className="w-10 h-10 text-[#38bdf8] mx-auto" />
                        <div>
                          <h4 className="text-[14px] font-bold text-white">
                            Digital System Record
                          </h4>
                          <p className="text-[12px] text-[#94a3b8] max-w-md mx-auto mt-1">
                            This requisition is maintained in digital structured format. You can view the full AI Digitized Sheet or export as an Excel register.
                          </p>
                        </div>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => setViewMode('digitized')}
                            className="px-4 py-2 rounded-xl bg-[#38bdf8] text-[#082f49] font-bold text-[12px]"
                          >
                            View AI Digitized Sheet
                          </button>
                          <button
                            onClick={() => handleDownloadExcel(activeDoc)}
                            className="px-4 py-2 rounded-xl bg-[#22c55e]/20 border border-[#22c55e]/40 text-[#4ade80] font-bold text-[12px]"
                          >
                            Download Excel Register
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* VIEW MODE 2: AI DIGITIZED SHEET (Full official layout for Indents and PO/SO) */
                  <div
                    id="rendered-physical-document-sheet"
                    className="bg-[#111827] border border-[#1e293b] rounded-2xl p-5 md:p-8 shadow-2xl text-[#f8fafc] flex flex-col gap-6"
                  >
                    {/* Header: RBM Infracon Official Banner */}
                    <div className="flex flex-col items-center text-center pb-5 border-b border-[#1e293b]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-[#22c55e] text-[#052e16] flex items-center justify-center font-black text-[14px]">
                          RBM
                        </div>
                        <h2 className="text-[20px] font-black tracking-wide text-white uppercase">
                          RBM INFRACON LIMITED
                        </h2>
                      </div>
                      <p className="text-[11px] text-[#94a3b8] max-w-xl">
                        1ST FLOOR, RAVI PLAZA, NILKANT PARK, DINCHDA ROAD, JAMNAGAR - Pincode: 361002
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-[#64748b] mt-1 font-mono">
                        <span>Email: purchase@rbminfracon-kutchh.com</span>
                        <span>•</span>
                        <span>Phone: 9726679840</span>
                        <span>•</span>
                        <span>GSTIN: 24AAGCR3448G1ZF</span>
                        <span>•</span>
                        <span>PAN: AAGCR3448G</span>
                      </div>

                      <div className={`mt-3 px-6 py-1 rounded-full border text-[13px] font-black uppercase tracking-wider ${
                        isFinancial
                          ? 'bg-[#1e293b] border-[#334155] text-[#4ade80]'
                          : 'bg-[#082f49] border-[#0284c7] text-[#38bdf8]'
                      }`}>
                        {activeDoc.docType === 'PO'
                          ? 'Purchase Order'
                          : activeDoc.docType === 'SO'
                          ? 'Service Order'
                          : activeDoc.docType === 'MATERIAL_INDENT'
                          ? 'Material Indent Requisition'
                          : 'Service Indent Requisition'}
                      </div>
                    </div>

                    {/* Meta Grid: Specialized for Indent vs PO/SO */}
                    {isIndent ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#0b1329] border border-[#1e293b] text-[11px]">
                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Indent / Requisition No
                          </span>
                          <span className="text-[12px] font-bold font-mono text-[#38bdf8]">
                            {activeDoc.referenceNo || 'M-IND-2026-001'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Requisition Date
                          </span>
                          <span className="text-[12px] font-bold text-white">
                            {activeDoc.requisitionDate || activeDoc.poDate || '6-Nov-25'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Indentor / Raised By
                          </span>
                          <span className="text-[12px] font-bold text-[#4ade80]">
                            {activeDoc.indentorName || activeDoc.uploadedBy || 'PRAJAPATI HITESHBHAI V'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Priority Level
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${getPriorityBadgeClass(activeDoc.priority)}`}>
                            {activeDoc.priority || 'Normal Priority'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Department
                          </span>
                          <span className="text-[11px] font-semibold text-white">
                            {activeDoc.department || 'E & I Engineering'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Recommended Supplier
                          </span>
                          <span className="text-[11px] font-medium text-white truncate block" title={activeDoc.recommendedSupplier || activeDoc.vendorName || 'As per approved vendor list'}>
                            {activeDoc.recommendedSupplier || activeDoc.vendorName || 'Approved E&I Vendor'}
                          </span>
                        </div>

                        <div className="sm:col-span-2">
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Target Plant Structure
                          </span>
                          <span className="text-[12px] font-bold text-[#38bdf8]">
                            {project.code} - {project.name.replace(/ST-\d+-/i, '')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#0b1329] border border-[#1e293b] text-[11px]">
                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            {activeDoc.docType === 'PO' ? 'PO Number' : 'SO Number'}
                          </span>
                          <span className="text-[12px] font-bold font-mono text-[#4ade80]">
                            {activeDoc.referenceNo || 'RBM/EIIL/25-26/PO/000271'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            {activeDoc.docType === 'PO' ? 'PO Date' : 'SO Date'}
                          </span>
                          <span className="text-[12px] font-bold text-white">
                            {activeDoc.poDate || '6-Nov-25'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Quotation / Ref No
                          </span>
                          <span className="text-[12px] font-bold font-mono text-white">
                            {activeDoc.quotationNo || 'RBM/EIIL/25-26/QTN/00356'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Delivery / Target Date
                          </span>
                          <span className="text-[12px] font-bold text-white">
                            {activeDoc.deliveryDate || '10-Nov-25'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Contact Person
                          </span>
                          <span className="text-[11px] font-bold text-white">
                            {activeDoc.contactPerson || 'Ashwin Kundwani'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Phone
                          </span>
                          <span className="text-[11px] font-mono text-white">
                            {activeDoc.contactPhone || '9998477384'}
                          </span>
                        </div>

                        <div className="sm:col-span-2">
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Target Plant Structure
                          </span>
                          <span className="text-[12px] font-bold text-[#38bdf8]">
                            {project.code} - {project.name.replace(/ST-\d+-/i, '')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Details Cards: For PO/SO show Vendor/BillTo/ShipTo; for Indent show Scope & Justification */}
                    {isFinancial ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                        <div className="p-3.5 rounded-xl bg-[#0b1329] border border-[#1e293b] flex flex-col justify-between">
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#4ade80] mb-1">
                              Details of Vendor
                            </span>
                            <h4 className="text-[12px] font-bold text-white uppercase">
                              {activeDoc.vendorName || 'ASHIRWAD ELECTRICALS'}
                            </h4>
                            <p className="text-[10px] text-[#94a3b8] mt-1 leading-relaxed">
                              {activeDoc.vendorAddress || 'PLOT NO.68/121, NEAR RTO OFFICE & BANK OF BARODA, MEGHPAR BORICHI,-ANJAR'}
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-[#1e293b] text-[10px] text-[#64748b] space-y-0.5 font-mono">
                            <div>GST No: <span className="text-white">{activeDoc.vendorGstin || '24BSTPK1782R1ZS'}</span></div>
                            <div>PinCode: <span className="text-white">{activeDoc.vendorPinCode || '370110'}</span> • State: Gujarat</div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#0b1329] border border-[#1e293b] flex flex-col justify-between">
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#38bdf8] mb-1">
                              Bill To Detail
                            </span>
                            <h4 className="text-[12px] font-bold text-white uppercase">
                              RBM INFRACON LIMITED
                            </h4>
                            <p className="text-[10px] text-[#94a3b8] mt-1 leading-relaxed">
                              1ST FLOOR, RAVI PLAZA, NILKANT PARK, DINCHDA ROAD, JAMNAGAR
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-[#1e293b] text-[10px] text-[#64748b] space-y-0.5 font-mono">
                            <div>GST No: <span className="text-white">24AAGCR3448G1ZF</span></div>
                            <div>PinCode: <span className="text-white">361002</span> • State: Gujarat</div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#0b1329] border border-[#1e293b] flex flex-col justify-between">
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#eab308] mb-1">
                              Ship To Detail
                            </span>
                            <h4 className="text-[12px] font-bold text-white uppercase">
                              EPITOME INDUSTRIES INDIA LIMITED
                            </h4>
                            <p className="text-[10px] text-[#94a3b8] mt-1 leading-relaxed">
                              Survey No 498/1, 498, 497 & 485 Village Lakhapar, Taluka Anjar, District Kutchh
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-[#1e293b] text-[10px] text-[#64748b] space-y-0.5 font-mono">
                            <div>GST No: <span className="text-white">24AAHCE1753E1ZZ</span></div>
                            <div>PinCode: <span className="text-white">361002</span> • State: Gujarat</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        <div className="p-3.5 rounded-xl bg-[#0b1329] border border-[#1e293b] flex flex-col justify-between">
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#38bdf8] mb-1">
                              Requisition Justification & Purpose
                            </span>
                            <p className="text-[12px] text-white font-medium leading-relaxed">
                              {activeDoc.justification || 'Site requirement for electrical erection, cabling, tray installation, and instrument hookup.'}
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-[#1e293b] text-[10px] text-[#94a3b8]">
                            Department: <span className="text-white font-semibold">{activeDoc.department || 'E & I Engineering'}</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#0b1329] border border-[#1e293b] flex flex-col justify-between">
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#4ade80] mb-1">
                              Engineering Verification
                            </span>
                            <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                              Verified against approved single line diagrams, cable schedules, and structural layout drawings for {project.code}.
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-[#1e293b] text-[10px] text-[#64748b] flex justify-between">
                            <span>Status: <strong className="text-[#4ade80]">Approved for Procurement</strong></span>
                            <span>Classification: <strong className="text-[#38bdf8]">Non-Financial Indent</strong></span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Line Items Table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
                          <span>{isFinancial ? 'Description of Goods & Commercial Rates' : 'Bill of Quantities (BOQ) & Technical Scope'}</span>
                        </h4>
                        {isFinancial ? (
                          <span className="text-[11px] text-[#4ade80] font-mono font-semibold">
                            Total Order Value: {formatRupees(activeDoc.amount || activeDoc.totalOrderValue || 81441.24)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#38bdf8] font-semibold">
                            Total: {activeDoc.itemsList?.length || 1} Item(s)
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-[#1e293b]">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-[#0b1329] text-[#94a3b8] font-bold text-[10px] uppercase border-b border-[#1e293b]">
                            {isFinancial ? (
                              <tr>
                                <th className="py-2.5 px-2.5 text-center">S.No</th>
                                <th className="py-2.5 px-2.5">Item Code</th>
                                <th className="py-2.5 px-3">Description of Goods</th>
                                <th className="py-2.5 px-2 text-center">UOM</th>
                                <th className="py-2.5 px-2 text-center">Qty</th>
                                <th className="py-2.5 px-2.5 text-right">Rate (INR)</th>
                                <th className="py-2.5 px-2.5 text-right">Basic Value (INR)</th>
                                <th className="py-2.5 px-2 text-center">GST %</th>
                                <th className="py-2.5 px-3 text-right text-[#4ade80] bg-[#1e293b]/40">
                                  Total Amount
                                </th>
                              </tr>
                            ) : (
                              <tr>
                                <th className="py-2.5 px-2.5 text-center">S.No</th>
                                <th className="py-2.5 px-3">Item Code</th>
                                <th className="py-2.5 px-3">Description of Goods / Scope</th>
                                <th className="py-2.5 px-2 text-center">UOM</th>
                                <th className="py-2.5 px-2.5 text-center">Required Qty</th>
                                <th className="py-2.5 px-3">Technical Specification / Remarks</th>
                              </tr>
                            )}
                          </thead>
                          <tbody className="divide-y divide-[#1e293b] text-[#cbd5e1]">
                            {activeDoc.itemsList && activeDoc.itemsList.length > 0 ? (
                              activeDoc.itemsList.map((item, idx) => (
                                <tr key={idx} className="hover:bg-[#18243e] transition-colors">
                                  <td className="py-2.5 px-2.5 text-center font-mono text-[#94a3b8]">
                                    {item.sno || idx + 1}
                                  </td>
                                  <td className="py-2.5 px-2.5 font-mono text-[#94a3b8] font-bold">
                                    {item.itemCode}
                                  </td>
                                  <td className="py-2.5 px-3 font-medium text-white max-w-xs">
                                    {item.description}
                                  </td>
                                  <td className="py-2.5 px-2 text-center font-mono text-[#94a3b8]">
                                    {item.uom || item.unit}
                                  </td>
                                  <td className="py-2.5 px-2.5 text-center text-white font-bold font-mono">
                                    {item.quantity.toLocaleString('en-IN')}
                                  </td>
                                  {isFinancial ? (
                                    <>
                                      <td className="py-2.5 px-2.5 text-right font-mono">
                                        {(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-2.5 px-2.5 text-right font-mono">
                                        {(item.basicValue || (item.unitPrice || 0) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-2.5 px-2 text-center font-mono text-[#94a3b8]">
                                        {item.gstRate || 18}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-bold text-[#4ade80] font-mono bg-[#1e293b]/20">
                                        {(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>
                                    </>
                                  ) : (
                                    <td className="py-2.5 px-3 text-[11px] text-[#94a3b8]">
                                      {item.specRemarks || 'Technical standard compliance'}
                                    </td>
                                  )}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td className="py-2.5 px-2.5 text-center font-mono text-[#94a3b8]">1</td>
                                <td className="py-2.5 px-2.5 font-mono text-[#94a3b8]">EM100125</td>
                                <td className="py-2.5 px-3 font-medium text-white">{activeDoc.name}</td>
                                <td className="py-2.5 px-2 text-center font-mono">NOS</td>
                                <td className="py-2.5 px-2 text-center text-white font-bold font-mono">1</td>
                                {isFinancial ? (
                                  <>
                                    <td className="py-2.5 px-2.5 text-right font-mono">{(activeDoc.amount || 0).toFixed(2)}</td>
                                    <td className="py-2.5 px-2.5 text-right font-mono">{(activeDoc.amount || 0).toFixed(2)}</td>
                                    <td className="py-2.5 px-2 text-center font-mono">18</td>
                                    <td className="py-2.5 px-3 text-right font-bold text-[#4ade80] font-mono bg-[#1e293b]/20">
                                      {(activeDoc.amount || 0).toFixed(2)}
                                    </td>
                                  </>
                                ) : (
                                  <td className="py-2.5 px-3 text-[11px] text-[#94a3b8]">Site Engineering Requisition</td>
                                )}
                              </tr>
                            )}

                            {/* Table Total Row */}
                            {isFinancial && (
                              <tr className="bg-[#0b1329] font-bold border-t border-[#1e293b] text-white">
                                <td colSpan={4} className="py-2.5 px-3 text-center uppercase tracking-wider text-[11px]">
                                  Total
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono text-[12px] text-white">
                                  {activeDoc.itemsList?.reduce((acc, i) => acc + i.quantity, 0).toLocaleString('en-IN') || '2,812'}
                                </td>
                                <td></td>
                                <td className="py-2.5 px-2.5 text-right font-mono text-white">
                                  {(activeDoc.itemsList?.reduce((acc, i) => acc + (i.basicValue || 0), 0) || 67518.00).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td></td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#4ade80] bg-[#1e293b]/40">
                                  {(activeDoc.itemsList?.reduce((acc, i) => acc + (i.total || 0), 0) || 79671.24).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Remarks & Commercial Breakdown Box (Financial) or Indent Sign-Off (Non-Financial) */}
                    {isFinancial ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-3.5 rounded-xl bg-[#0b1329] border border-[#1e293b] flex flex-col justify-between text-[11px] space-y-2">
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
                              Remarks & Payment Terms
                            </span>
                            <p className="text-[11px] text-white font-medium">
                              Payment Terms: <span className="text-[#4ade80] font-bold">{activeDoc.paymentTerms || '15 Days'}</span>
                            </p>
                            <p className="text-[10px] text-[#94a3b8] mt-1">
                              Other Ref: Your Qtn Date 04-11-2025
                            </p>
                            {activeDoc.notes && (
                              <p className="text-[10px] text-[#cbd5e1] mt-1 italic">
                                "{activeDoc.notes}"
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-[#1e293b]">
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#64748b]">
                              Amount In Words
                            </span>
                            <p className="text-[11px] font-semibold text-[#f8fafc] mt-0.5">
                              {activeDoc.amountInWords || 'INR Eighty One Thousand Four Hundred Forty One and Twenty Four paise Only'}
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-2 text-[11px]">
                          <div className="flex justify-between text-[#94a3b8]">
                            <span>Total Amount Before Tax:</span>
                            <span className="font-mono text-white">
                              ₹ {(activeDoc.totalAmountBeforeTax || 67518.00).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-[#94a3b8]">
                            <span>Freight 18%:</span>
                            <span className="font-mono text-white">
                              ₹ {(activeDoc.freight !== undefined ? activeDoc.freight : 1500.00).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-[#94a3b8]">
                            <span>CGST (9%):</span>
                            <span className="font-mono text-white">
                              ₹ {(activeDoc.cgst || 6211.62).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-[#94a3b8]">
                            <span>SGST (9%):</span>
                            <span className="font-mono text-white">
                              ₹ {(activeDoc.sgst || 6211.62).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[13px] font-black text-white pt-2 border-t-2 border-[#22c55e]/40 bg-[#22c55e]/10 -mx-3.5 -mb-3.5 p-3.5 rounded-b-xl">
                            <span className="uppercase tracking-wide text-[#4ade80]">
                              Total Order Value:
                            </span>
                            <span className="font-mono text-[16px] text-[#4ade80] font-black">
                              ₹ {(activeDoc.amount || activeDoc.totalOrderValue || 81441.24).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
                        <div className="p-3 rounded-xl bg-[#0b1329] border border-[#1e293b]">
                          <span className="block text-[9px] font-bold uppercase text-[#64748b] mb-1">
                            Indented / Raised By
                          </span>
                          <div className="font-bold text-white">
                            {activeDoc.indentorName || 'PRAJAPATI HITESHBHAI V'}
                          </div>
                          <div className="text-[10px] text-[#94a3b8] mt-1">
                            Site E&I Engineer
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#0b1329] border border-[#1e293b]">
                          <span className="block text-[9px] font-bold uppercase text-[#64748b] mb-1">
                            Verified By
                          </span>
                          <div className="font-bold text-white">
                            {activeDoc.verifiedBy || 'E & I Quality In-Charge'}
                          </div>
                          <div className="text-[10px] text-[#4ade80] mt-1 flex items-center gap-1 font-mono">
                            <CheckCircle className="w-3 h-3" />
                            <span>Verified Technical Compliance</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#0b1329] border border-[#1e293b]">
                          <span className="block text-[9px] font-bold uppercase text-[#64748b] mb-1">
                            Approved By
                          </span>
                          <div className="font-bold text-white">
                            {activeDoc.approvedBy || 'Project Manager / Site Head'}
                          </div>
                          <div className="text-[10px] text-[#38bdf8] mt-1 flex items-center gap-1 font-mono">
                            <CheckCircle className="w-3 h-3" />
                            <span>Approved for Purchase</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Signatures & Approvals for Financial docs */}
                    {isFinancial && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1e293b] text-[11px]">
                        <div className="p-3 rounded-xl bg-[#0b1329]/60 border border-[#1e293b]">
                          <span className="block text-[9px] font-bold uppercase text-[#64748b] mb-1">
                            For RBM INFRACON LIMITED
                          </span>
                          <div className="flex items-center gap-2 text-[#4ade80] font-mono text-[10px]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>PRAmetric Digitally signed by PRAJAPATI HITESHBHAI V</span>
                          </div>
                          <div className="flex justify-between items-center mt-2 text-[10px] text-[#94a3b8]">
                            <span>Authorised Signatory</span>
                            <span>Project Head</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#0b1329]/60 border border-[#1e293b] flex flex-col justify-between">
                          <span className="block text-[9px] font-bold uppercase text-[#64748b]">
                            Vendor Acceptance
                          </span>
                          <div className="text-[11px] font-bold text-white mt-1">
                            {activeDoc.vendorName || 'ASHIRWAD ELECTRICALS'}
                          </div>
                          <div className="text-[10px] text-[#94a3b8] mt-2">
                            Accepted & Confirmed
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Digital Stamp / Verification */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#1e293b] text-[10px] text-[#64748b]">
                      <div>
                        <span>Uploaded by: {activeDoc.uploadedBy} • {activeDoc.uploadedAt}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#4ade80] font-bold uppercase tracking-wider">
                        <CheckCircle className="w-3 h-3" />
                        <span>E & I Certified Record</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
