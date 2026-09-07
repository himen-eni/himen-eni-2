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
  Cpu,
  ChevronDown,
  ChevronUp,
  Eye,
  Layers,
  Copy,
  Check,
  Building2,
  Hash,
  Trash2
} from 'lucide-react';
import { DocumentType, StructureProject, DocumentItem } from '../types';
import {
  scanDocumentWithAI,
  scanDocumentForRatesSync,
  AiScanResult,
  formatRupees,
  numberToWords
} from '../utils/aiRateScanner';
import { saveDocumentBlob } from '../utils/storageUtils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: StructureProject[];
  defaultProject?: StructureProject | null;
  defaultDocType?: DocumentType;
  onUploadSuccess: (projectId: string, docType: DocumentType, docs: DocumentItem[]) => void;
}

export interface FileCustomMeta {
  refNo: string;
  vendor: string;
  amount: string;
  indentor: string;
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
  const [fileCustomMeta, setFileCustomMeta] = useState<Record<string, FileCustomMeta>>({});
  const [expandedDocName, setExpandedDocName] = useState<string | null>(null);
  const [copiedDocName, setCopiedDocName] = useState<string | null>(null);
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
      
      setRefNo('');
      setSelectedFiles([]);
      setFileDataUrls({});
      setFileScanResults({});
      setFileFullScans({});
      setFileCustomMeta({});
      setExpandedDocName(null);
      setCopiedDocName(null);
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
    setRefNo('');

    if (selectedFiles.length > 0) {
      runAiScanOnFiles(selectedFiles, newType);
    }
  };

  const updateFileMeta = (fileName: string, field: keyof FileCustomMeta, value: string) => {
    setFileCustomMeta((prev) => ({
      ...prev,
      [fileName]: {
        refNo: field === 'refNo' ? value : (prev[fileName]?.refNo || ''),
        vendor: field === 'vendor' ? value : (prev[fileName]?.vendor || ''),
        amount: field === 'amount' ? value : (prev[fileName]?.amount || ''),
        indentor: field === 'indentor' ? value : (prev[fileName]?.indentor || ''),
      }
    }));

    if (selectedFiles.length === 1) {
      if (field === 'refNo') setRefNo(value);
      if (field === 'vendor') setVendorName(value);
      if (field === 'amount') setAmountRupees(value);
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
    const newMetas: Record<string, FileCustomMeta> = { ...fileCustomMeta };

    try {
      // Run AI scanning for all files independently (strictly isolated per file)
      await Promise.all(
        files.map(async (file, idx) => {
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
            newMetas[file.name] = {
              refNo: newMetas[file.name]?.refNo || scan.referenceNo || `${currentType}-${Date.now().toString().slice(-4)}-${idx + 1}`,
              vendor: newMetas[file.name]?.vendor || scan.vendorName || (isFin ? 'E & I Vendor' : 'E & I Site Material Store'),
              amount: newMetas[file.name]?.amount || (isFin && scan.amountInRupees > 0 ? scan.amountInRupees.toFixed(2) : ''),
              indentor: newMetas[file.name]?.indentor || scan.indentorName || '',
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
            newMetas[file.name] = {
              refNo: newMetas[file.name]?.refNo || fallback.referenceNo || `${currentType}-${Date.now().toString().slice(-4)}-${idx + 1}`,
              vendor: newMetas[file.name]?.vendor || fallback.vendorName || (isFin ? 'E & I Vendor' : 'E & I Site Material Store'),
              amount: newMetas[file.name]?.amount || (isFin && fallback.amountInRupees > 0 ? fallback.amountInRupees.toFixed(2) : ''),
              indentor: newMetas[file.name]?.indentor || fallback.indentorName || '',
            };
            setScanningStatus((prev) => ({ ...prev, [file.name]: 'done' }));
          }
        })
      );

      setFileFullScans(fullScans);
      setFileScanResults(scanSummaries);
      setFileCustomMeta(newMetas);

      // Compute total sum and first vendor / reference for display
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

      const updatedMeta = { ...fileCustomMeta };
      delete updatedMeta[fileToRemove.name];
      setFileCustomMeta(updatedMeta);
    }

    if (updated.length > 0 && isFinancialDoc) {
      const newTotal = updated.reduce((sum, f) => {
        const customAmt = fileCustomMeta[f.name]?.amount;
        if (customAmt && !isNaN(parseFloat(customAmt))) {
          return sum + parseFloat(customAmt);
        }
        return sum + (fileScanResults[f.name]?.amount || 0);
      }, 0);
      if (newTotal > 0) {
        setAmountRupees(newTotal.toFixed(2));
      }
    } else if (updated.length === 0) {
      setFileScanResults({});
      setFileFullScans({});
      setFileCustomMeta({});
      setAmountRupees('');
    }
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setFileDataUrls({});
    setFileScanResults({});
    setFileFullScans({});
    setFileCustomMeta({});
    setScanningStatus({});
    setAmountRupees('');
    setExpandedDocName(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      const isSingleFile = selectedFiles.length === 1;

      const generatedDocs: DocumentItem[] = selectedFiles.map((file, idx) => {
        const ext = (file.name.split('.').pop()?.toLowerCase() || 'pdf') as any;
        const savedFullScan = fileFullScans[file.name];
        const custom = fileCustomMeta[file.name];

        // Specific, isolated reference number for this document
        const itemRefNo = (
          custom?.refNo ||
          (isSingleFile && refNo ? refNo : '') ||
          savedFullScan?.referenceNo ||
          `${docType}-${Date.now().toString().slice(-4)}-${idx + 1}`
        ).trim();

        // Specific, isolated vendor/contractor for this document
        const itemVendor = (
          custom?.vendor ||
          (isSingleFile && vendorName ? vendorName : '') ||
          savedFullScan?.vendorName ||
          (isFinancialDoc ? 'E & I Vendor' : 'E & I Site Material Store')
        ).trim();

        // Specific, isolated amount for this document
        let itemAmount = 0;
        if (isFinancialDoc) {
          if (custom?.amount && !isNaN(parseFloat(custom.amount))) {
            itemAmount = parseFloat(custom.amount);
          } else if (isSingleFile && amountRupees && !isNaN(parseFloat(amountRupees))) {
            itemAmount = parseFloat(amountRupees);
          } else if (savedFullScan && (savedFullScan.totalOrderValue || savedFullScan.amountInRupees)) {
            itemAmount = savedFullScan.totalOrderValue || savedFullScan.amountInRupees || 0;
          }
        }

        // Isolated line items from this file ONLY
        const itemsList =
          savedFullScan && savedFullScan.itemsList && savedFullScan.itemsList.length > 0
            ? savedFullScan.itemsList
            : (savedFullScan?.itemsList || []);

        // Isolated raw text and verbatim scanned lines from this file ONLY
        const extractedFullText = savedFullScan?.extractedFullText || '';
        const rawLines =
          savedFullScan?.rawLines && savedFullScan.rawLines.length > 0
            ? savedFullScan.rawLines
            : (extractedFullText ? extractedFullText.split(/\r?\n/).filter(Boolean) : []);

        const uniqueDocId = `doc-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;

        const fileSizeStr =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.max(1, Math.round(file.size / 1024))} KB`;

        const basicVal = itemAmount > 0 ? Math.round((itemAmount / 1.18) * 100) / 100 : (savedFullScan?.totalAmountBeforeTax || 0);
        const halfTax = itemAmount > 0 ? Math.round(((itemAmount - basicVal) / 2) * 100) / 100 : (savedFullScan?.cgst || 0);

        return {
          id: uniqueDocId,
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
          amount: itemAmount,
          vendorName: itemVendor,
          vendorAddress: savedFullScan?.vendorAddress || (isFinancialDoc ? 'PLOT NO 58, GIDC ESTATE, ANJAR, KUTCHH, GUJARAT - 370110' : undefined),
          vendorGstin: savedFullScan?.vendorGstin || (isFinancialDoc ? '24AGSPA8318R1ZV' : undefined),
          vendorPinCode: savedFullScan?.vendorPinCode || '370110',
          poDate: savedFullScan?.poDate || new Date().toLocaleDateString('en-GB'),
          requisitionDate: savedFullScan?.requisitionDate || new Date().toLocaleDateString('en-GB'),
          indentorName: custom?.indentor || savedFullScan?.indentorName || 'E & I Site Engineer',
          priority: savedFullScan?.priority || 'Medium',
          justification: savedFullScan?.justification || `Site requirement for ${targetProject?.name || 'Plant Structure'}`,
          approvedBy: savedFullScan?.approvedBy || 'PRAJAPATI HITESHBHAI V',
          verifiedBy: savedFullScan?.verifiedBy || 'E & I Quality Lead',
          recommendedSupplier: savedFullScan?.recommendedSupplier || itemVendor,
          quotationNo: savedFullScan?.quotationNo || 'EIIL/AE/25-26/014',
          deliveryDate: savedFullScan?.deliveryDate || 'As per schedule',
          contactPerson: savedFullScan?.contactPerson || 'E & I Site Lead',
          contactPhone: savedFullScan?.contactPhone || '9726679840',
          contactEmail: savedFullScan?.contactEmail || 'purchase@rbminfracon-kutchh.com',
          paymentTerms: savedFullScan?.paymentTerms || (isFinancialDoc ? '30 Days from MRN' : 'Non-Financial Requisition'),
          totalAmountBeforeTax: basicVal,
          freight: savedFullScan?.freight || 0,
          cgst: halfTax,
          sgst: halfTax,
          totalOrderValue: itemAmount,
          amountInWords: isFinancialDoc && itemAmount > 0 ? (savedFullScan?.amountInWords || numberToWords(itemAmount)) : 'Non-Financial Requisition',
          billToDetails: savedFullScan?.billToDetails,
          shipToDetails: savedFullScan?.shipToDetails,
          department: savedFullScan?.department || (docType === 'MATERIAL_INDENT' ? 'E & I Procurement' : 'E & I Execution'),
          notes: notes || undefined,
          aiScanned: true,
          itemsList: itemsList,
          extractedFullText: extractedFullText,
          rawLines: rawLines,
        };
      });

      // Save each uploaded document's binary payload into IndexedDB so it can be viewed/downloaded forever
      await Promise.all(
        generatedDocs.map(async (doc) => {
          if (doc.fileDataUrl) {
            try {
              await saveDocumentBlob(doc.id, doc.fileDataUrl);
            } catch (err) {
              console.warn('IDB save error for:', doc.name, err);
            }
          }
        })
      );

      onUploadSuccess(selectedProjectId, docType, generatedDocs);
      setIsUploading(false);
      onClose();
    } catch (err) {
      console.error('Error during document ingestion:', err);
      setErrorMsg('Failed to process documents. Please check file format and try again.');
      setIsUploading(false);
    }
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

          {/* Selected Files & Document-Specific Identification Section */}
          {selectedFiles.length === 0 ? null : selectedFiles.length === 1 ? (
            /* --- SINGLE FILE LAYOUT --- */
            <div className="space-y-3">
              {/* File Info Card */}
              {selectedFiles.map((file) => {
                const fileSizeStr =
                  file.size > 1024 * 1024
                    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                    : `${Math.max(1, Math.round(file.size / 1024))} KB`;
                const isScanning = scanningStatus[file.name] === 'scanning';
                const scan = fileFullScans[file.name];
                const isExpanded = expandedDocName === file.name;
                const lineCount = scan?.rawLines?.length || (scan?.extractedFullText ? scan.extractedFullText.split(/\r?\n/).filter(Boolean).length : 0);
                const itemCount = scan?.itemsList?.length || 0;

                return (
                  <div key={file.name} className="bg-[#131d33] border border-[#1e293b] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFileIcon(file.name)}
                        <span className="text-[13px] font-semibold text-[#f8fafc] truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] text-[#94a3b8] shrink-0 bg-[#0f172a] px-2 py-0.5 rounded border border-[#334155]">
                          {fileSizeStr}
                        </span>
                        {isScanning ? (
                          <span className="text-[10px] text-[#38bdf8] font-medium bg-[#38bdf8]/10 border border-[#38bdf8]/30 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Analyzing Word-to-Word...
                          </span>
                        ) : scan ? (
                          <span className="text-[10px] text-[#4ade80] font-semibold bg-[#22c55e]/15 border border-[#22c55e]/30 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                            <Sparkles className="w-3 h-3 text-[#4ade80]" />
                            {itemCount} Items • {lineCount} Lines Scanned
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedDocName(isExpanded ? null : file.name)}
                          className="px-2 py-1 text-[11px] font-medium text-[#38bdf8] bg-[#0284c7]/15 hover:bg-[#0284c7]/25 border border-[#0284c7]/30 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>{isExpanded ? 'Hide Scanned Lines' : 'Preview Scanned Lines'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(0)}
                          className="text-[#94a3b8] hover:text-[#ef4444] p-1 rounded transition-colors"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Word-to-Word Verbatim Preview Drawer */}
                    {isExpanded && scan && (
                      <div className="mt-2 pt-2 border-t border-[#1e293b] space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
                          <span className="font-semibold text-[#cbd5e1] flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
                            Verbatim Word-to-Word Transcription ({lineCount} lines)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (scan.extractedFullText) {
                                navigator.clipboard.writeText(scan.extractedFullText);
                                setCopiedDocName(file.name);
                                setTimeout(() => setCopiedDocName(null), 2000);
                              }
                            }}
                            className="text-[#38bdf8] hover:underline flex items-center gap-1"
                          >
                            {copiedDocName === file.name ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedDocName === file.name ? 'Copied!' : 'Copy Text'}</span>
                          </button>
                        </div>

                        {/* Extracted Line Items Table if any */}
                        {scan.itemsList && scan.itemsList.length > 0 && (
                          <div className="border border-[#1e293b] rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                            <table className="w-full text-[11px] text-left">
                              <thead className="bg-[#0f172a] text-[#94a3b8] uppercase text-[9px] sticky top-0 font-mono">
                                <tr>
                                  <th className="p-1.5 pl-2">#</th>
                                  <th className="p-1.5">Description</th>
                                  <th className="p-1.5 text-right">Qty</th>
                                  <th className="p-1.5">Unit</th>
                                  {isFinancialDoc && <th className="p-1.5 text-right">Rate (₹)</th>}
                                  {isFinancialDoc && <th className="p-1.5 text-right pr-2">Total (₹)</th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1e293b] text-[#cbd5e1]">
                                {scan.itemsList.map((it, idx) => (
                                  <tr key={idx} className="hover:bg-[#1e293b]/50">
                                    <td className="p-1.5 pl-2 text-[#64748b] font-mono">{it.sno || idx + 1}</td>
                                    <td className="p-1.5 font-medium max-w-[200px] truncate" title={it.description}>{it.description}</td>
                                    <td className="p-1.5 text-right font-mono">{it.quantity}</td>
                                    <td className="p-1.5 text-[#94a3b8]">{it.uom || it.unit || 'NOS'}</td>
                                    {isFinancialDoc && (
                                      <td className="p-1.5 text-right font-mono text-[#94a3b8]">
                                        {it.unitPrice ? it.unitPrice.toLocaleString('en-IN') : '-'}
                                      </td>
                                    )}
                                    {isFinancialDoc && (
                                      <td className="p-1.5 text-right pr-2 font-mono text-[#4ade80] font-semibold">
                                        {it.total ? it.total.toLocaleString('en-IN') : '-'}
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Raw Lines Scrollable Monospace Box */}
                        <div className="bg-[#0b1120] border border-[#1e293b] rounded-lg p-2 max-h-40 overflow-y-auto font-mono text-[10px] text-[#94a3b8] leading-relaxed space-y-0.5">
                          {scan.rawLines && scan.rawLines.length > 0 ? (
                            scan.rawLines.map((line, lIdx) => (
                              <div key={lIdx} className="flex gap-2 hover:bg-[#1e293b]/40 px-1 rounded">
                                <span className="text-[#475569] select-none shrink-0 w-6 text-right">{lIdx + 1}</span>
                                <span className="text-[#e2e8f0] whitespace-pre-wrap">{line}</span>
                              </div>
                            ))
                          ) : scan.extractedFullText ? (
                            scan.extractedFullText.split(/\r?\n/).map((line, lIdx) => (
                              <div key={lIdx} className="flex gap-2 hover:bg-[#1e293b]/40 px-1 rounded">
                                <span className="text-[#475569] select-none shrink-0 w-6 text-right">{lIdx + 1}</span>
                                <span className="text-[#e2e8f0] whitespace-pre-wrap">{line}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[#64748b] italic">No direct lines parsed.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Single File Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
                    Reference / Document No
                  </label>
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => {
                      setRefNo(e.target.value);
                      if (selectedFiles[0]) updateFileMeta(selectedFiles[0].name, 'refNo', e.target.value);
                    }}
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
                          onChange={(e) => {
                            setAmountRupees(e.target.value);
                            if (selectedFiles[0]) updateFileMeta(selectedFiles[0].name, 'amount', e.target.value);
                          }}
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

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
                  {isFinancialDoc ? 'Vendor / Contracting Entity' : 'Requisitioning Division / Store'}
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => {
                    setVendorName(e.target.value);
                    if (selectedFiles[0]) updateFileMeta(selectedFiles[0].name, 'vendor', e.target.value);
                  }}
                  placeholder={isFinancialDoc ? 'e.g. ABB India Ltd. / RBM Infracon Ltd.' : 'e.g. E & I Site Material Store'}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-3 py-2 text-[13px] text-[#f8fafc] focus:outline-hidden focus:border-[#4ade80]"
                />
              </div>
            </div>
          ) : (
            /* --- MULTI-FILE ISOLATION LAYOUT (ZERO DATA MIXING GUARANTEE) --- */
            <div className="space-y-3">
              {/* Isolation Banner */}
              <div className="bg-[#1e1b4b]/60 border border-[#4338ca] rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#a5b4fc] shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-[#e0e7ff] block">
                      Multi-Document Separation Active ({selectedFiles.length} Documents)
                    </span>
                    <span className="text-[10px] text-[#c7d2fe]">
                      Each document retains its personal identification, reference number, and scanned line items. No data mixing occurs.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearAllFiles}
                  className="text-[11px] text-[#ef4444] hover:underline font-semibold shrink-0"
                >
                  Clear All
                </button>
              </div>

              {/* Individual Document Cards List */}
              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {selectedFiles.map((file, idx) => {
                  const fileSizeStr =
                    file.size > 1024 * 1024
                      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${Math.max(1, Math.round(file.size / 1024))} KB`;
                  const isScanning = scanningStatus[file.name] === 'scanning';
                  const scan = fileFullScans[file.name];
                  const meta = fileCustomMeta[file.name] || { refNo: '', vendor: '', amount: '', indentor: '' };
                  const isExpanded = expandedDocName === file.name;
                  const lineCount = scan?.rawLines?.length || (scan?.extractedFullText ? scan.extractedFullText.split(/\r?\n/).filter(Boolean).length : 0);
                  const itemCount = scan?.itemsList?.length || 0;

                  return (
                    <div
                      key={`${file.name}-${idx}`}
                      className="bg-[#131d33] border border-[#1e293b] rounded-xl p-3 space-y-2.5 transition-all shadow-sm hover:border-[#334155]"
                    >
                      {/* Document Personal Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[10px] font-bold bg-[#1e293b] text-[#38bdf8] px-2 py-0.5 rounded font-mono border border-[#334155] shrink-0">
                            Doc #{idx + 1}
                          </span>
                          {getFileIcon(file.name)}
                          <span className="text-[12px] font-semibold text-[#f8fafc] truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[9px] text-[#94a3b8] bg-[#0f172a] px-1.5 py-0.5 rounded border border-[#334155] shrink-0">
                            {fileSizeStr}
                          </span>

                          {isScanning ? (
                            <span className="text-[9px] text-[#38bdf8] font-medium bg-[#38bdf8]/10 border border-[#38bdf8]/30 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 animate-pulse">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              Scanning Word-to-Word...
                            </span>
                          ) : scan ? (
                            <span className="text-[9px] text-[#4ade80] font-semibold bg-[#22c55e]/15 border border-[#22c55e]/30 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                              <Sparkles className="w-2.5 h-2.5 text-[#4ade80]" />
                              {itemCount} Items • {lineCount} Lines
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setExpandedDocName(isExpanded ? null : file.name)}
                            className="px-2 py-1 text-[10px] font-semibold text-[#38bdf8] bg-[#0284c7]/15 hover:bg-[#0284c7]/25 border border-[#0284c7]/30 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isExpanded ? 'Hide' : 'Inspect'} Lines</span>
                            {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="text-[#94a3b8] hover:text-[#ef4444] p-1 rounded transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Personal Document Identification Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-[#1e293b]/70">
                        {/* Reference / PO No */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-[#94a3b8] mb-0.5">
                            Doc Reference No
                          </label>
                          <input
                            type="text"
                            value={meta.refNo}
                            onChange={(e) => updateFileMeta(file.name, 'refNo', e.target.value)}
                            placeholder={isFinancialDoc ? 'PO-2026-...' : 'M-IND-2026-...'}
                            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-[12px] text-[#f8fafc] font-mono focus:outline-hidden focus:border-[#4ade80]"
                          />
                        </div>

                        {/* Vendor / Contractor / Requisitioner */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-[#94a3b8] mb-0.5">
                            {isFinancialDoc ? 'Vendor / Contractor' : 'Requisitioner / Dept'}
                          </label>
                          <input
                            type="text"
                            value={meta.vendor}
                            onChange={(e) => updateFileMeta(file.name, 'vendor', e.target.value)}
                            placeholder={isFinancialDoc ? 'ABB India / Schneider' : 'E & I Site Store'}
                            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-[12px] text-[#f8fafc] focus:outline-hidden focus:border-[#4ade80]"
                          />
                        </div>

                        {/* Financial Value or Category Specific */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-[#94a3b8] mb-0.5">
                            {isFinancialDoc ? 'Document Value (₹ INR)' : 'Indent Status'}
                          </label>
                          {isFinancialDoc ? (
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-[#4ade80] font-bold text-[11px]">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={meta.amount}
                                onChange={(e) => updateFileMeta(file.name, 'amount', e.target.value)}
                                placeholder="e.g. 81441.24"
                                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg pl-5 pr-2 py-1.5 text-[12px] text-[#4ade80] font-mono font-bold focus:outline-hidden focus:border-[#4ade80]"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={meta.indentor || 'E & I Execution'}
                              onChange={(e) => updateFileMeta(file.name, 'indentor', e.target.value)}
                              placeholder="e.g. E & I Execution"
                              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 text-[12px] text-[#94a3b8] focus:outline-hidden focus:border-[#38bdf8]"
                            />
                          )}
                        </div>
                      </div>

                      {/* Expandable Word-to-Word Lines & Table Items Drawer */}
                      {isExpanded && scan && (
                        <div className="mt-2 pt-2 border-t border-[#1e293b] space-y-2 bg-[#0b1120]/60 p-2.5 rounded-lg">
                          <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
                            <span className="font-semibold text-[#cbd5e1] flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
                              <span>Isolated Content for: <span className="text-white font-mono">{file.name}</span> ({lineCount} lines)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (scan.extractedFullText) {
                                  navigator.clipboard.writeText(scan.extractedFullText);
                                  setCopiedDocName(file.name);
                                  setTimeout(() => setCopiedDocName(null), 2000);
                                }
                              }}
                              className="text-[#38bdf8] hover:underline flex items-center gap-1 text-[10px]"
                            >
                              {copiedDocName === file.name ? <Check className="w-3 h-3 text-[#4ade80]" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedDocName === file.name ? 'Copied!' : 'Copy Document Text'}</span>
                            </button>
                          </div>

                          {/* Items Table for this Document */}
                          {scan.itemsList && scan.itemsList.length > 0 && (
                            <div className="border border-[#1e293b] rounded-lg overflow-hidden max-h-32 overflow-y-auto">
                              <table className="w-full text-[10px] text-left">
                                <thead className="bg-[#0f172a] text-[#94a3b8] uppercase text-[9px] sticky top-0 font-mono">
                                  <tr>
                                    <th className="p-1 pl-2">#</th>
                                    <th className="p-1">Description</th>
                                    <th className="p-1 text-right">Qty</th>
                                    <th className="p-1">Unit</th>
                                    {isFinancialDoc && <th className="p-1 text-right">Rate (₹)</th>}
                                    {isFinancialDoc && <th className="p-1 text-right pr-2">Total (₹)</th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e293b] text-[#cbd5e1]">
                                  {scan.itemsList.map((it, itemIdx) => (
                                    <tr key={itemIdx} className="hover:bg-[#1e293b]/50">
                                      <td className="p-1 pl-2 text-[#64748b] font-mono">{it.sno || itemIdx + 1}</td>
                                      <td className="p-1 font-medium max-w-[180px] truncate" title={it.description}>{it.description}</td>
                                      <td className="p-1 text-right font-mono">{it.quantity}</td>
                                      <td className="p-1 text-[#94a3b8]">{it.uom || it.unit || 'NOS'}</td>
                                      {isFinancialDoc && (
                                        <td className="p-1 text-right font-mono text-[#94a3b8]">
                                          {it.unitPrice ? it.unitPrice.toLocaleString('en-IN') : '-'}
                                        </td>
                                      )}
                                      {isFinancialDoc && (
                                        <td className="p-1 text-right pr-2 font-mono text-[#4ade80] font-semibold">
                                          {it.total ? it.total.toLocaleString('en-IN') : '-'}
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Word-to-Word Raw Lines */}
                          <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-2 max-h-32 overflow-y-auto font-mono text-[9px] text-[#94a3b8] leading-relaxed space-y-0.5">
                            {scan.rawLines && scan.rawLines.length > 0 ? (
                              scan.rawLines.map((line, lIdx) => (
                                <div key={lIdx} className="flex gap-2 hover:bg-[#1e293b]/40 px-1 rounded">
                                  <span className="text-[#475569] select-none shrink-0 w-5 text-right">{lIdx + 1}</span>
                                  <span className="text-[#e2e8f0] whitespace-pre-wrap">{line}</span>
                                </div>
                              ))
                            ) : scan.extractedFullText ? (
                              scan.extractedFullText.split(/\r?\n/).map((line, lIdx) => (
                                <div key={lIdx} className="flex gap-2 hover:bg-[#1e293b]/40 px-1 rounded">
                                  <span className="text-[#475569] select-none shrink-0 w-5 text-right">{lIdx + 1}</span>
                                  <span className="text-[#e2e8f0] whitespace-pre-wrap">{line}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-[#64748b] italic">No text lines recorded for this document.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total Aggregate Card for Multi-upload */}
              {isFinancialDoc && (
                <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-[#94a3b8]">
                    Aggregate Total across <strong className="text-white font-mono">{selectedFiles.length}</strong> documents:
                  </span>
                  <span className="text-[#4ade80] font-bold text-[13px] font-mono">
                    ₹{' '}
                    {selectedFiles
                      .reduce((sum, f) => {
                        const amt = fileCustomMeta[f.name]?.amount;
                        if (amt && !isNaN(parseFloat(amt))) return sum + parseFloat(amt);
                        return sum + (fileScanResults[f.name]?.amount || 0);
                      }, 0)
                      .toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">
              General Specification & Engineering Remarks
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
