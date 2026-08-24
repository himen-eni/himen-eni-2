import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  Plus,
  FileSpreadsheet,
  FileArchive,
  IndianRupee,
  Sparkles,
  CheckCircle,
  Info,
  Loader2,
  Cpu
} from 'lucide-react';
import { DocumentType, StructureProject, DocumentItem } from '../types';
import {
  scanDocumentWithAI,
  scanDocumentForRatesSync,
  AiScanResult,
  formatRupees
} from '../utils/aiRateScanner';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: StructureProject[];
  defaultProject?: StructureProject | null;
  defaultDocType?: DocumentType;
  onUploadSuccess: (projectId: string, docType: DocumentType, docs: DocumentItem[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  projects,
  defaultProject,
  defaultDocType = 'MATERIAL_INDENT',
  onUploadSuccess
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProject?.id || projects[0]?.id || ''
  );
  const [docType, setDocType] = useState<DocumentType>(defaultDocType);
  const [refNo, setRefNo] = useState('');
  const [amountRupees, setAmountRupees] = useState<string>('');
  const [vendorName, setVendorName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileDataUrls, setFileDataUrls] = useState<Record<string, string>>({});
  const [fileScanResults, setFileScanResults] = useState<Record<string, { amount: number; vendor: string; isAi?: boolean; refNo?: string; itemsCount?: number; indentor?: string }>>({});
  const [fileFullScans, setFileFullScans] = useState<Record<string, AiScanResult>>({});
  const [scanningStatus, setScanningStatus] = useState<Record<string, 'scanning' | 'done' | 'error'>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiScanningActive, setAiScanningActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const isFinancialDoc = docType === 'PO' || docType === 'SO';

  // Read a File into Base64 Data URL for persistent storage & viewing
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Sync defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultProject) setSelectedProjectId(defaultProject.id);
      if (defaultDocType) setDocType(defaultDocType);
      
      const prefix =
        defaultDocType === 'MATERIAL_INDENT'
          ? 'M-IND'
          : defaultDocType === 'SERVICE_INDENT'
          ? 'S-IND'
          : defaultDocType === 'PO'
          ? 'PO'
          : 'SO';
      
      setRefNo(`${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setSelectedFiles([]);
      setFileDataUrls({});
      setFileScanResults({});
      setFileFullScans({});
      setScanningStatus({});
      setAmountRupees('');
      setVendorName('');
      setNotes('');
      setErrorMsg('');
      setIsUploading(false);
    }
  }, [isOpen, defaultProject, defaultDocType]);

  if (!isOpen) return null;

  const handleCategoryChange = (newType: DocumentType) => {
    setDocType(newType);
    const prefix =
      newType === 'MATERIAL_INDENT'
        ? 'M-IND'
        : newType === 'SERVICE_INDENT'
        ? 'S-IND'
        : newType === 'PO'
        ? 'PO'
        : 'SO';
    setRefNo(`${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`);

    if (selectedFiles.length > 0) {
      runAiScanOnFiles(selectedFiles, newType);
    }
  };

  const runAiScanOnFiles = async (files: File[], currentType: DocumentType) => {
    const isFin = currentType === 'PO' || currentType === 'SO';
    setAiScanningActive(true);
    const newStatus: Record<string, 'scanning' | 'done' | 'error'> = {};
    files.forEach((f) => {
      newStatus[f.name] = 'scanning';
    });
    setScanningStatus(newStatus);

    const fullScans: Record<string, AiScanResult> = { ...fileFullScans };
    const scanSummaries: Record<string, { amount: number; vendor: string; isAi?: boolean; refNo?: string; itemsCount?: number; indentor?: string }> = { ...fileScanResults };

    try {
      // Run AI scanning for all files (both Indents and PO/SO)
      await Promise.all(
        files.map(async (file) => {
          try {
            const scan = await scanDocumentWithAI(
              file,
              currentType,
              targetProject?.name || 'Plant Structure'
            );
            fullScans[file.name] = scan;
            scanSummaries[file.name] = {
              amount: scan.amountInRupees,
              vendor: scan.vendorName,
              isAi: scan.isAiExtracted,
              refNo: scan.referenceNo,
              itemsCount: scan.itemsList?.length || 0,
              indentor: scan.indentorName
            };
            setScanningStatus((prev) => ({ ...prev, [file.name]: 'done' }));
          } catch (e) {
            console.error('Scan error for file:', file.name, e);
            const fallback = scanDocumentForRatesSync(
              file,
              currentType,
              targetProject?.name || 'Plant Structure'
            );
            fullScans[file.name] = fallback;
            scanSummaries[file.name] = {
              amount: fallback.amountInRupees,
              vendor: fallback.vendorName,
              isAi: false,
              refNo: fallback.referenceNo,
              itemsCount: fallback.itemsList?.length || 0,
              indentor: fallback.indentorName
            };
            setScanningStatus((prev) => ({ ...prev, [file.name]: 'done' }));
          }
        })
      );

      setFileFullScans(fullScans);
      setFileScanResults(scanSummaries);

      // Compute total sum and first vendor / reference
      let totalScanned = 0;
      let firstVendor = '';
      let firstRefNo = '';

      files.forEach((file) => {
        const item = scanSummaries[file.name];
        if (item) {
          totalScanned += item.amount;
          if (!firstVendor && item.vendor) firstVendor = item.vendor;
        }
        const full = fullScans[file.name];
        if (full && full.referenceNo && !firstRefNo) {
          firstRefNo = full.referenceNo;
        }
      });

      if (isFin && totalScanned > 0 && !amountRupees) {
        setAmountRupees(totalScanned.toFixed(2));
      } else if (!isFin) {
        setAmountRupees('');
      }

      if (firstVendor && !vendorName) {
        setVendorName(firstVendor);
      }
      if (firstRefNo && files.length === 1) {
        setRefNo(firstRefNo);
      }
    } finally {
      setAiScanningActive(false);
    }
  };

  const addFilesToSelection = async (newFiles: FileList | File[]) => {
    const filesArray = Array.from(newFiles);
    if (filesArray.length === 0) return;

    const updatedList = [...selectedFiles];
    const existingNames = new Set(selectedFiles.map((f) => f.name));
    const newUrls: Record<string, string> = { ...fileDataUrls };

    for (const f of filesArray) {
      if (!existingNames.has(f.name)) {
        updatedList.push(f);
        try {
          const dataUrl = await readFileAsDataUrl(f);
          newUrls[f.name] = dataUrl;
        } catch (err) {
          console.warn('Error reading data url for:', f.name, err);
        }
      }
    }

    setSelectedFiles(updatedList);
    setFileDataUrls(newUrls);
    runAiScanOnFiles(updatedList, docType);
    setErrorMsg('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToSelection(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToSelection(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const fileToRemove = selectedFiles[indexToRemove];
    const updated = selectedFiles.filter((_, idx) => idx !== indexToRemove);
    setSelectedFiles(updated);

    if (fileToRemove) {
      const updatedUrls = { ...fileDataUrls };
      delete updatedUrls[fileToRemove.name];
      setFileDataUrls(updatedUrls);

      const updatedScanResults = { ...fileScanResults };
      delete updatedScanResults[fileToRemove.name];
      setFileScanResults(updatedScanResults);

      const updatedFullScans = { ...fileFullScans };
      delete updatedFullScans[fileToRemove.name];
      setFileFullScans(updatedFullScans);
    }

    if (updated.length > 0 && isFinancialDoc) {
      const newTotal = updated.reduce((sum, f) => sum + (fileScanResults[f.name]?.amount || 0), 0);
      if (newTotal > 0) {
        setAmountRupees(newTotal.toFixed(2));
      }
    } else if (updated.length === 0) {
      setFileScanResults({});
      setFileFullScans({});
      setAmountRupees('');
    }
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setFileDataUrls({});
    setFileScanResults({});
    setFileFullScans({});
    setScanningStatus({});
    setAmountRupees('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return <FileSpreadsheet className="w-4 h-4 text-[#4ade80]" />;
    }
    if (ext === 'zip' || ext === 'rar') {
      return <FileArchive className="w-4 h-4 text-[#f59e0b]" />;
    }
    return <FileText className="w-4 h-4 text-[#38bdf8]" />;
  };

  const totalFilesSizeMB = (
    selectedFiles.reduce((acc, file) => acc + file.size, 0) /
    (1024 * 1024)
  ).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setErrorMsg('Please select a target plant structure.');
      return;
    }

    if (selectedFiles.length === 0) {
      setErrorMsg('Please select at least one file from your PC.');
      return;
    }

    setIsUploading(true);

    setTimeout(() => {
      const isSingleFile = selectedFiles.length === 1;
      const userEnteredTotal = isFinancialDoc && amountRupees ? parseFloat(amountRupees) : 0;

      const generatedDocs: DocumentItem[] = selectedFiles.map((file, idx) => {
        const ext = (file.name.split('.').pop()?.toLowerCase() || 'pdf') as any;
        const savedFullScan = fileFullScans[file.name];
        const individualScanAmount = fileScanResults[file.name]?.amount;
        const individualVendor = fileScanResults[file.name]?.vendor;

        const fileTargetAmount = isFinancialDoc
          ? (isSingleFile && userEnteredTotal > 0 ? userEnteredTotal : (savedFullScan?.totalOrderValue || individualScanAmount || 0))
          : 0;

        const scan = savedFullScan && (!isSingleFile || !isFinancialDoc || userEnteredTotal <= 0 || Math.abs(userEnteredTotal - savedFullScan.totalOrderValue) < 0.01)
          ? savedFullScan
          : scanDocumentForRatesSync(
              file,
              docType,
              targetProject?.name || 'Plant Structure',
              fileTargetAmount,
              isSingleFile && vendorName ? vendorName : (individualVendor || vendorName)
            );

        const itemRefNo =
          selectedFiles.length > 1
            ? `${refNo ? `${refNo}-${idx + 1}` : scan.referenceNo}`
            : refNo || scan.referenceNo || `${docType}-${Date.now().toString().slice(-4)}`;

        const fileSizeStr =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.max(1, Math.round(file.size / 1024))} KB`;

        return {
          id: `doc-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          originalFileName: file.name,
          fileDataUrl: fileDataUrls[file.name] || '',
          referenceNo: itemRefNo,
          docType: docType,
          status: 'Approved',
          uploadedAt: 'Just now',
          uploadedBy: 'E & I Lead PM (RBM Site)',
          fileSize: fileSizeStr,
          fileType: ['pdf', 'xlsx', 'docx', 'csv', 'png', 'jpg', 'zip'].includes(ext) ? ext : 'pdf',
          amount: isFinancialDoc ? (scan.totalOrderValue || scan.amountInRupees) : 0,
          vendorName: scan.vendorName,
          vendorAddress: scan.vendorAddress,
          vendorGstin: scan.vendorGstin,
          vendorPinCode: scan.vendorPinCode,
          poDate: scan.poDate,
          requisitionDate: scan.requisitionDate,
          indentorName: scan.indentorName,
          priority: scan.priority,
          justification: scan.justification,
          approvedBy: scan.approvedBy,
          verifiedBy: scan.verifiedBy,
          recommendedSupplier: scan.recommendedSupplier,
          quotationNo: scan.quotationNo,
          deliveryDate: scan.deliveryDate,
          contactPerson: scan.contactPerson,
          contactPhone: scan.contactPhone,
          contactEmail: scan.contactEmail,
          paymentTerms: scan.paymentTerms,
          totalAmountBeforeTax: scan.totalAmountBeforeTax,
          freight: scan.freight,
          cgst: scan.cgst,
          sgst: scan.sgst,
          totalOrderValue: scan.totalOrderValue,
          amountInWords: scan.amountInWords,
          billToDetails: scan.billToDetails,
          shipToDetails: scan.shipToDetails,
          department: scan.department || 'E & I Engineering',
          notes: notes || undefined,
          aiScanned: true,
          itemsList: scan.itemsList
        };
      });

      onUploadSuccess(selectedProjectId, docType, generatedDocs);
      setIsUploading(false);
      onClose();
    }, 400);
  };

  return (
    <div
      id="upload-document-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        id="upload-document-modal-card"
        className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 text-white"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#131d33]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#22c55e] text-[#052e16] flex items-center justify-center font-black">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-[#f8fafc]">
                  Upload E&I Documents
                </h3>
                {isFinancialDoc ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Rate Scanner (₹)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30">
                    Requisition Indent
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#94a3b8]">
                {isFinancialDoc
                  ? 'PO/SO values extracted directly from the "Total Order Value" (e.g. ₹ 81,441.24)'
                  : 'Material & Service Indents are non-financial requisition documents (no rates/amounts)'}
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#fca5a5] rounded-xl text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Target Plant Structure Selection */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1.5">
              Target Plant Structure (ST-1 to ST-53)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3.5 py-2.5 text-[13px] text-[#f8fafc] focus:outline-hidden focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Document Categories (Paired as requested: Material Indent + PO, Service Indent + SO) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                Document Category & Pairing
              </label>
              <span className="text-[10px] text-[#94a3b8]">
                {isFinancialDoc ? 'Financial Order' : 'Non-Financial Indent'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Group 1: Material Procurement */}
              <div className="space-y-1.5 p-2 rounded-xl bg-[#131d33] border border-[#1e293b]">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
                  Material Procurement
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('MATERIAL_INDENT')}
                    className={`py-2 px-2 text-[11px] font-bold rounded-lg border transition-all text-center ${
                      docType === 'MATERIAL_INDENT'
                        ? 'bg-[#22c55e] text-[#052e16] border-[#22c55e] shadow-sm'
                        : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155] hover:bg-[#334155]'
                    }`}
                  >
                    Material Indent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('PO')}
                    className={`py-2 px-2 text-[11px] font-bold rounded-lg border transition-all text-center flex items-center justify-center gap-1 ${
                      docType === 'PO'
                        ? 'bg-[#22c55e] text-[#052e16] border-[#22c55e] shadow-sm'
                        : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155] hover:bg-[#334155]'
                    }`}
                  >
                    <span>PO (Order)</span>
                    <Sparkles className="w-2.5 h-2.5 opacity-80" />
                  </button>
                </div>
              </div>

              {/* Group 2: Services & Contracting */}
              <div className="space-y-1.5 p-2 rounded-xl bg-[#131d33] border border-[#1e293b]">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                  Services & Contracting
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('SERVICE_INDENT')}
                    className={`py-2 px-2 text-[11px] font-bold rounded-lg border transition-all text-center ${
                      docType === 'SERVICE_INDENT'
                        ? 'bg-[#38bdf8] text-[#082f49] border-[#38bdf8] shadow-sm'
                        : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155] hover:bg-[#334155]'
                    }`}
                  >
                    Service Indent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('SO')}
                    className={`py-2 px-2 text-[11px] font-bold rounded-lg border transition-all text-center flex items-center justify-center gap-1 ${
                      docType === 'SO'
                        ? 'bg-[#38bdf8] text-[#082f49] border-[#38bdf8] shadow-sm'
                        : 'bg-[#1e293b] text-[#cbd5e1] border-[#334155] hover:bg-[#334155]'
                    }`}
                  >
                    <span>SO (Order)</span>
                    <Sparkles className="w-2.5 h-2.5 opacity-80" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Non-financial notice for Indents */}
          {!isFinancialDoc && (
            <div className="p-3 bg-[#38bdf8]/10 border border-[#38bdf8]/30 rounded-xl text-[12px] text-[#7dd3fc] flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#38bdf8]" />
              <div>
                <strong className="text-white block font-semibold">
                  {docType === 'MATERIAL_INDENT' ? 'Material Indent' : 'Service Indent'} (Non-Financial Requisition)
                </strong>
                <span>
                  Indents specify required materials, specifications, and scope of work without any pricing. Monetary amounts apply exclusively to PO and SO procurement documents.
                </span>
              </div>
            </div>
          )}

          {/* Multi-file Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                Select File(s) from PC
              </label>
              <span className="text-[10px] text-[#4ade80] font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Multi-selection enabled
              </span>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#4ade80] bg-[#22c55e]/15'
                  : selectedFiles.length > 0
                  ? 'border-[#22c55e] bg-[#22c55e]/10'
                  : 'border-[#334155] hover:border-[#64748b] bg-[#131d33]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.png,.jpg,.jpeg,.zip,.txt"
              />
              <UploadCloud
                className={`w-7 h-7 mx-auto mb-1.5 ${
                  selectedFiles.length > 0 ? 'text-[#4ade80]' : 'text-[#64748b]'
                }`}
              />

              {selectedFiles.length === 0 ? (
                <div>
                  <p className="text-[13px] font-bold text-[#f8fafc]">
                    Click to select multiple files or drag & drop here
                  </p>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">
                    Hold <kbd className="px-1 py-0.5 bg-[#1e293b] border border-[#334155] rounded text-[10px] text-white">Ctrl</kbd> or <kbd className="px-1 py-0.5 bg-[#1e293b] border border-[#334155] rounded text-[10px] text-white">Shift</kbd> in PC Explorer to select multiple documents
                  </p>
                  <p className="text-[10px] text-[#64748b] mt-1">
                    Supports PO/SO PDFs, Excel Worksheets, Indents, Word & Scans
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[13px] font-bold text-[#4ade80]">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} queued
                  </p>
                  <p className="text-[11px] text-[#cbd5e1] mt-0.5">
                    Total: {totalFilesSizeMB} MB • Click or drag to add more
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Files Queue / List */}
          {selectedFiles.length > 0 && (
            <div className="bg-[#131d33] border border-[#1e293b] rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
                  <span>Selected Files Queue ({selectedFiles.length})</span>
                  {isFinancialDoc && (
                    <span className="text-[#4ade80] text-[9px] bg-[#22c55e]/20 px-1.5 py-0.5 rounded font-mono">
                      PO/SO Rates Active
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-[#4ade80] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add More</span>
                  </button>
                  <span className="text-[#334155]">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllFiles}
                    className="text-[11px] text-[#ef4444] hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Scrollable files list */}
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, index) => {
                  const fileSizeStr =
                    file.size > 1024 * 1024
                      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${Math.max(1, Math.round(file.size / 1024))} KB`;
                  const scannedInfo = isFinancialDoc ? fileScanResults[file.name] : null;
                  const isScanning = scanningStatus[file.name] === 'scanning';

                  return (
                    <div
                      key={`${file.name}-${index}`}
                      className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-1.5 flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFileIcon(file.name)}
                        <span className="text-[12px] font-medium text-[#f8fafc] truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[9px] text-[#94a3b8] shrink-0 bg-[#0f172a] px-1.5 py-0.5 rounded">
                          {fileSizeStr}
                        </span>

                        {isScanning ? (
                          <span className="text-[9px] text-[#38bdf8] font-medium bg-[#38bdf8]/10 border border-[#38bdf8]/30 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 animate-pulse">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            Analyzing with Gemini AI...
                          </span>
                        ) : isFinancialDoc ? (
                          scannedInfo && scannedInfo.amount > 0 ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {scannedInfo.isAi && (
                                <span className="text-[9px] text-[#a855f7] bg-[#a855f7]/15 px-1.5 py-0.5 rounded border border-[#a855f7]/30 flex items-center gap-1 font-semibold">
                                  <Sparkles className="w-2.5 h-2.5 text-[#c084fc]" />
                                  AI Scanned
                                </span>
                              )}
                              {scannedInfo.vendor && (
                                <span className="text-[9px] text-[#94a3b8] bg-[#0f172a] px-1.5 py-0.5 rounded border border-[#334155] max-w-[120px] truncate" title={scannedInfo.vendor}>
                                  {scannedInfo.vendor}
                                </span>
                              )}
                              <span className="text-[10px] text-[#4ade80] font-bold bg-[#22c55e]/15 px-1.5 py-0.5 rounded border border-[#22c55e]/30 flex items-center gap-0.5">
                                <IndianRupee className="w-2.5 h-2.5" />
                                {scannedInfo.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          ) : null
                        ) : (
                          scannedInfo ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] text-[#38bdf8] bg-[#38bdf8]/15 px-1.5 py-0.5 rounded border border-[#38bdf8]/30 flex items-center gap-1 font-semibold">
                                <Sparkles className="w-2.5 h-2.5 text-[#38bdf8]" />
                                AI Extracted Indent
                              </span>
                              {scannedInfo.itemsCount ? (
                                <span className="text-[9px] text-[#cbd5e1] bg-[#0f172a] px-1.5 py-0.5 rounded border border-[#334155]">
                                  {scannedInfo.itemsCount} Items
                                </span>
                              ) : null}
                              {scannedInfo.refNo ? (
                                <span className="text-[9px] text-[#94a3b8] bg-[#0f172a] px-1.5 py-0.5 rounded border border-[#334155] font-mono">
                                  {scannedInfo.refNo}
                                </span>
                              ) : null}
                            </div>
                          ) : null
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-[#94a3b8] hover:text-[#ef4444] p-1 rounded transition-colors shrink-0"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reference No & Amount Inputs (Rates in Rupees ₹ only for PO/SO) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
                Reference / Document No
              </label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder={isFinancialDoc ? 'e.g. PO-2026-1044' : 'e.g. M-IND-2026-1044'}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-[13px] text-[#f8fafc] focus:outline-hidden focus:border-[#4ade80]"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  {isFinancialDoc ? 'Total Order Value (₹ INR)' : 'Financial Value'}
                </label>
                {isFinancialDoc && (
                  <span className="text-[9px] text-[#4ade80] font-mono font-semibold">
                    Net Order Total
                  </span>
                )}
              </div>
              
              {isFinancialDoc ? (
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4ade80] font-bold text-[13px]">
                      ₹
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={amountRupees}
                      onChange={(e) => setAmountRupees(e.target.value)}
                      placeholder="e.g. 81441.24"
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-7 pr-3 py-2 text-[13px] text-[#4ade80] font-bold focus:outline-hidden focus:border-[#4ade80]"
                    />
                  </div>
                  {amountRupees && !isNaN(parseFloat(amountRupees)) && (
                    <p className="text-[10px] text-[#94a3b8] mt-0.5">
                      Total Order Value: <span className="text-[#4ade80] font-semibold">{formatRupees(parseFloat(amountRupees))}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="w-full bg-[#1e293b]/60 border border-[#334155] rounded-xl px-3 py-2 text-[12px] text-[#94a3b8] italic">
                  Non-financial document (₹ 0)
                </div>
              )}
            </div>
          </div>

          {/* Vendor / Supplier / Requisitioner */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
              {isFinancialDoc ? 'Vendor / Contracting Entity' : 'Requisitioning Division / Store'}
            </label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder={isFinancialDoc ? 'e.g. ABB India Ltd. / RBM Infracon Ltd.' : 'e.g. E & I Site Material Store'}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-[13px] text-[#f8fafc] focus:outline-hidden focus:border-[#4ade80]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
              Specification & Engineering Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add E&I remarks, inspection notes, or requisition details..."
              className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-[13px] text-[#f8fafc] focus:outline-hidden focus:border-[#4ade80]"
            />
          </div>

          {/* Submit buttons */}
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
              disabled={isUploading || selectedFiles.length === 0}
              className="px-5 py-2 text-[13px] font-bold bg-[#22c55e] hover:bg-[#16a34a] text-[#052e16] rounded-xl transition-all flex items-center gap-2 shadow-md shadow-green-950/50 disabled:opacity-50 active:scale-95"
            >
              {isUploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#052e16] border-t-transparent rounded-full animate-spin" />
                  <span>Ingesting {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>
                    Upload {selectedFiles.length > 0 ? `(${selectedFiles.length} Files)` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
