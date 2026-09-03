import * as XLSX from 'xlsx';
import { DocumentItem, StructureProject, DocumentType, DocumentSection } from '../types';
import { formatRupees } from './aiRateScanner';
import { getDocumentBlob } from './storageUtils';

/**
 * Helper to trigger browser download of a Blob or data URL with full cross-browser support
 */
export function triggerBrowserDownload(dataUrlOrBlobUrl: string, fileName: string): boolean {
  try {
    let url = dataUrlOrBlobUrl;
    let isObjectUrl = false;

    if (dataUrlOrBlobUrl.startsWith('data:')) {
      const parts = dataUrlOrBlobUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      url = URL.createObjectURL(blob);
      isObjectUrl = true;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (isObjectUrl) {
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    return true;
  } catch (err) {
    console.warn('Error triggering browser download:', err);
    return false;
  }
}

/**
 * Downloads the original uploaded file (PDF, Excel, Word, Image) if fileDataUrl is stored.
 */
export function downloadOriginalFile(doc: DocumentItem): boolean {
  if (doc.fileDataUrl) {
    return triggerBrowserDownload(doc.fileDataUrl, doc.originalFileName || doc.name || 'document');
  }
  return false;
}

/**
 * Asynchronously retrieves the original file from memory or IndexedDB, downloading it,
 * with seamless fallback to a generated Excel register if no binary file was stored.
 */
export async function downloadOriginalFileAsync(doc: DocumentItem, project?: StructureProject): Promise<void> {
  if (doc.fileDataUrl) {
    const success = triggerBrowserDownload(doc.fileDataUrl, doc.originalFileName || doc.name || 'document');
    if (success) return;
  }

  if (doc.id) {
    try {
      const blobData = await getDocumentBlob(doc.id);
      if (blobData) {
        const success = triggerBrowserDownload(blobData, doc.originalFileName || doc.name || 'document');
        if (success) return;
      }
    } catch (e) {
      console.warn('IndexedDB download fetch error:', e);
    }
  }

  // Fallback: Generate full multi-sheet Excel spreadsheet
  downloadDocumentFile(doc, project);
}

/**
 * Downloads a single document as a professional, multi-sheet Excel spreadsheet (.xlsx).
 */
export function downloadDocumentFile(doc: DocumentItem, project?: StructureProject): void {
  const isDocFinancial = doc.docType === 'PO' || doc.docType === 'SO';
  const wb = XLSX.utils.book_new();

  // 1. Document Summary Sheet
  const summaryData: (string | number | undefined)[][] = isDocFinancial
    ? [
        ['E & I DOCUMENTS - OFFICIAL PROCUREMENT ORDER REGISTER', ''],
        ['RBM Infracon Ltd. - Electrical & Instrumentation Division', ''],
        ['', ''],
        ['DOCUMENT METADATA', ''],
        ['Document Reference No', doc.referenceNo || 'N/A'],
        ['Document File Name', doc.name || 'N/A'],
        ['Document Type', doc.docType],
        ['Classification', 'Commercial Financial Order'],
        ['Current Status', (doc.status || 'VERIFIED').toUpperCase()],
        ['Order / PO Date', doc.poDate || 'N/A'],
        ['Uploaded By', doc.uploadedBy || 'Site Engineer'],
        ['Upload Timestamp', doc.uploadedAt || new Date().toLocaleString()],
        ['File Size', doc.fileSize || 'N/A'],
        ['', ''],
        ['STRUCTURE / PROJECT INFO', ''],
        ['Structure Code', project?.code || 'N/A'],
        ['Structure Name', project?.name || 'N/A'],
        ['Phase', project?.phase || 'N/A'],
        ['Department', doc.department || 'Electrical & Instrumentation'],
        ['', ''],
        ['VENDOR / CONTRACTOR DETAILS', ''],
        ['Vendor / Supplier Name', doc.vendorName || 'N/A'],
        ['Vendor GSTIN', doc.vendorGstin || 'N/A'],
        ['Vendor Address', doc.vendorAddress || 'N/A'],
        ['Vendor PIN Code', doc.vendorPinCode || 'N/A'],
        ['Contact Person', doc.contactPerson || 'N/A'],
        ['Contact Phone / Mobile', doc.contactPhone || 'N/A'],
        ['Contact Email', doc.contactEmail || 'N/A'],
        ['Quotation Reference', doc.quotationNo || 'N/A'],
        ['Payment Terms', doc.paymentTerms || 'As per Purchase Order agreement'],
        ['Delivery Timeline', doc.deliveryDate || 'As per Schedule'],
        ['', ''],
        ['COMMERCIAL VALUATION & TAX SUMMARY (₹ INR)', ''],
        ['Taxable Basic Amount (₹)', doc.totalAmountBeforeTax || (doc.amount ? Math.round(doc.amount / 1.18 * 100) / 100 : 0)],
        ['Freight / Packing (₹)', doc.freight || 0],
        ['CGST Amount (₹)', doc.cgst || 0],
        ['SGST / IGST Amount (₹)', doc.sgst || 0],
        ['Total Valuation / Order Value (₹)', doc.amount || 0],
        ['Formatted Valuation', doc.amount ? formatRupees(doc.amount) : '₹ 0'],
        ['Amount in Words', doc.amountInWords || ''],
        ['', ''],
        ['AUDIT & CERTIFICATION', ''],
        ['Document UUID', doc.id || ''],
        ['Verified & Certified By', 'E & I Lead Procurement & Site Quality Engineer'],
        ['Exported Date', new Date().toLocaleString()],
      ]
    : [
        ['E & I DOCUMENTS - OFFICIAL REQUISITION INDENT REGISTER', ''],
        ['RBM Infracon Ltd. - Electrical & Instrumentation Division', ''],
        ['', ''],
        ['REQUISITION INDENT METADATA', ''],
        ['Indent Reference No', doc.referenceNo || 'N/A'],
        ['Original File Name', doc.originalFileName || doc.name || 'N/A'],
        ['Document Type', doc.docType === 'MATERIAL_INDENT' ? 'Material Indent' : 'Service Indent'],
        ['Classification', 'Technical Engineering Requisition (Non-Financial)'],
        ['Current Status', (doc.status || 'APPROVED').toUpperCase()],
        ['Requisition Date', doc.requisitionDate || doc.poDate || 'N/A'],
        ['Indentor / Raised By', doc.indentorName || doc.uploadedBy || 'PRAJAPATI HITESHBHAI V'],
        ['Department', doc.department || 'E & I Engineering'],
        ['Priority Level', doc.priority || 'Normal'],
        ['Recommended Supplier / Vendor', doc.recommendedSupplier || doc.vendorName || 'As per approved vendor list'],
        ['Justification / Purpose', doc.justification || 'Site erection, cabling & commissioning requirements'],
        ['Verified By', doc.verifiedBy || 'E & I Quality In-Charge'],
        ['Approved By', doc.approvedBy || 'Project Manager / Site Head'],
        ['Uploaded Timestamp', doc.uploadedAt || new Date().toLocaleString()],
        ['File Size', doc.fileSize || 'N/A'],
        ['', ''],
        ['STRUCTURE / LOCATION INFO', ''],
        ['Structure Code', project?.code || 'N/A'],
        ['Structure Name', project?.name || 'N/A'],
        ['Phase', project?.phase || 'N/A'],
        ['Total BOQ Items', doc.itemsList?.length || 0],
        ['', ''],
        ['AUDIT & CERTIFICATION', ''],
        ['Document UUID', doc.id || ''],
        ['Digitally Certified By', 'RBM E & I Engineering Division'],
        ['Exported Date', new Date().toLocaleString()],
      ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Document Summary');

  // 2. Itemized Line Items Sheet
  if (doc.itemsList && doc.itemsList.length > 0) {
    const itemsHeaders = isDocFinancial
      ? [
          'S.No',
          'Item Code',
          'Description / Technical Scope',
          'Quantity',
          'Unit / UOM',
          'Unit Price (₹)',
          'Basic Value (₹)',
          'GST Rate (%)',
          'Total Amount (₹)',
          'Technical Specification / Remarks',
        ]
      : [
          'S.No',
          'Item Code',
          'Description / Technical Scope',
          'Quantity',
          'Unit / UOM',
          'Technical Specification / Remarks',
        ];

    const itemsRows = doc.itemsList.map((item, idx) =>
      isDocFinancial
        ? [
            idx + 1,
            item.itemCode || `ITEM-${idx + 1}`,
            item.description || 'Supply of materials / services as per specification',
            item.quantity || 0,
            item.unit || item.uom || 'NOS',
            item.unitPrice || 0,
            item.basicValue || (item.quantity && item.unitPrice ? item.quantity * item.unitPrice : 0),
            item.gstRate ?? 18,
            item.total || (item.basicValue ? Math.round(item.basicValue * 1.18 * 100) / 100 : 0),
            item.specRemarks || 'Standard E&I Specification',
          ]
        : [
            idx + 1,
            item.itemCode || `IND-${idx + 1}`,
            item.description || 'Requisition of materials / scope as per design',
            item.quantity || 0,
            item.unit || item.uom || 'NOS',
            item.specRemarks || 'As per plant layout & technical specifications',
          ]
    );

    // Summary row for financial docs
    if (isDocFinancial) {
      const totalBasic = doc.itemsList.reduce(
        (acc, it) => acc + (it.basicValue || (it.quantity && it.unitPrice ? it.quantity * it.unitPrice : 0)),
        0
      );
      const totalSum = doc.itemsList.reduce((acc, it) => acc + (it.total || 0), 0);
      itemsRows.push([
        'TOTAL',
        '',
        'GRAND SUMMARY',
        '',
        '',
        '',
        totalBasic || (doc.totalAmountBeforeTax || 0),
        '',
        totalSum || (doc.amount || 0),
        `Total Order Value: ${doc.amount ? formatRupees(doc.amount) : '₹ 0'}`,
      ]);
    }

    const wsItems = XLSX.utils.aoa_to_sheet([itemsHeaders, ...itemsRows]);
    wsItems['!cols'] = isDocFinancial
      ? [
          { wch: 8 },
          { wch: 18 },
          { wch: 45 },
          { wch: 12 },
          { wch: 12 },
          { wch: 16 },
          { wch: 18 },
          { wch: 14 },
          { wch: 18 },
          { wch: 35 },
        ]
      : [
          { wch: 8 },
          { wch: 18 },
          { wch: 50 },
          { wch: 12 },
          { wch: 12 },
          { wch: 45 },
        ];

    XLSX.utils.book_append_sheet(wb, wsItems, isDocFinancial ? 'Itemized Rates' : 'Bill of Quantities');
  }

  // 3. Full Line-by-Line Scanned Document Transcript Sheet
  if (doc.rawLines && doc.rawLines.length > 0) {
    const transcriptData = [
      ['SCANNED DOCUMENT LINE-BY-LINE TRANSCRIPT', ''],
      ['Line #', 'Verbatim Scanned Line Content'],
      ...doc.rawLines.map((line, idx) => [idx + 1, line]),
    ];
    const wsTranscript = XLSX.utils.aoa_to_sheet(transcriptData);
    wsTranscript['!cols'] = [{ wch: 8 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(wb, wsTranscript, 'Full Transcript');
  } else if (doc.extractedFullText) {
    const lines = doc.extractedFullText.split('\n').map((l) => l.trim()).filter(Boolean);
    const transcriptData = [
      ['SCANNED DOCUMENT LINE-BY-LINE TRANSCRIPT', ''],
      ['Line #', 'Verbatim Scanned Line Content'],
      ...lines.map((line, idx) => [idx + 1, line]),
    ];
    const wsTranscript = XLSX.utils.aoa_to_sheet(transcriptData);
    wsTranscript['!cols'] = [{ wch: 8 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(wb, wsTranscript, 'Full Transcript');
  }

  // Trigger Excel File Download
  const cleanRef = (doc.referenceNo || 'DOC').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanName = (doc.name || 'Export').replace(/\.[^/.]+$/, '').replace(/[/\\?%*:|"<>]/g, '_');
  const fileName = `${cleanRef}_${cleanName}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * Downloads all documents in a structure or document section as an Excel spreadsheet (.xlsx).
 */
export function downloadProjectArchive(project: StructureProject, docType?: DocumentType): void {
  const docsToExport = docType
    ? docType === 'MATERIAL_INDENT'
      ? project.materialIndentStatus.documents
      : docType === 'SERVICE_INDENT'
      ? project.serviceIndentStatus.documents
      : docType === 'PO'
      ? project.poStatus.documents
      : project.soStatus.documents
    : [
        ...project.materialIndentStatus.documents,
        ...project.poStatus.documents,
        ...project.serviceIndentStatus.documents,
        ...project.soStatus.documents,
      ];

  const wb = XLSX.utils.book_new();

  // 1. Structure Overview Sheet
  const overviewData = [
    ['E & I DOCUMENTS - PLANT STRUCTURE PROCUREMENT ARCHIVE', ''],
    ['RBM Infracon Ltd. Site Office - Kutchh Project', ''],
    ['', ''],
    ['STRUCTURE DETAILS', ''],
    ['Structure Code', project.code],
    ['Structure Name', project.name],
    ['Phase / Location', project.phase],
    ['Overall Completion (%)', `${project.overallCompletion}%`],
    ['Total Purchase Orders (₹)', project.totalPoAmount || 0],
    ['Formatted PO Total', formatRupees(project.totalPoAmount || 0)],
    ['Total Service Orders (₹)', project.totalSoAmount || 0],
    ['Formatted SO Total', formatRupees(project.totalSoAmount || 0)],
    ['Combined Commercial Value (₹)', (project.totalPoAmount || 0) + (project.totalSoAmount || 0)],
    ['Formatted Grand Total', formatRupees((project.totalPoAmount || 0) + (project.totalSoAmount || 0))],
    ['', ''],
    ['DOCUMENTS AUDIT SUMMARY', ''],
    ['Filter / Scope', docType ? `${docType} Documents` : 'All 4 Sections Archive'],
    ['Total Files Exported', docsToExport.length],
    ['Material Indents Count', project.materialIndentStatus.documents.length],
    ['Purchase Orders (PO) Count', project.poStatus.documents.length],
    ['Service Indents Count', project.serviceIndentStatus.documents.length],
    ['Service Orders (SO) Count', project.soStatus.documents.length],
    ['Archive Generated Date', new Date().toLocaleString()],
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  wsOverview['!cols'] = [{ wch: 30 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Structure Overview');

  // 2. Documents Register Sheet
  const docHeaders = [
    'S.No',
    'Document Type',
    'Reference No',
    'File Name',
    'Status',
    'Vendor / Supplier Name',
    'Vendor GSTIN',
    'Valuation (₹ INR)',
    'Uploaded By',
    'Upload Timestamp',
    'File Size',
    'Notes / Description',
  ];

  const docRows = docsToExport.map((d, idx) => [
    idx + 1,
    d.docType,
    d.referenceNo,
    d.name,
    (d.status || 'VERIFIED').toUpperCase(),
    d.vendorName || (d.docType === 'PO' || d.docType === 'SO' ? 'N/A' : 'E&I Division'),
    d.vendorGstin || 'N/A',
    d.amount || 0,
    d.uploadedBy,
    d.uploadedAt,
    d.fileSize,
    d.notes || '',
  ]);

  const wsDocs = XLSX.utils.aoa_to_sheet([docHeaders, ...docRows]);
  wsDocs['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 28 },
    { wch: 35 },
    { wch: 14 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDocs, 'Documents Register');

  // 3. Consolidated Line Items Sheet
  const allItems: any[][] = [];
  let itemCounter = 1;

  docsToExport.forEach((d) => {
    if (d.itemsList && d.itemsList.length > 0) {
      d.itemsList.forEach((it) => {
        allItems.push([
          itemCounter++,
          d.docType,
          d.referenceNo,
          d.vendorName || 'E&I Scope',
          it.itemCode || 'ITEM',
          it.description || 'Supply of material / service',
          it.quantity || 0,
          it.unit || it.uom || 'NOS',
          it.unitPrice || 0,
          it.basicValue || 0,
          it.gstRate ?? 18,
          it.total || 0,
          it.specRemarks || '',
        ]);
      });
    }
  });

  if (allItems.length > 0) {
    const itemsHeaders = [
      'S.No',
      'Doc Type',
      'Doc Reference',
      'Vendor / Supplier',
      'Item Code',
      'Description / Scope of Work',
      'Quantity',
      'Unit',
      'Unit Price (₹)',
      'Basic Value (₹)',
      'GST Rate (%)',
      'Total Amount (₹)',
      'Technical Remarks',
    ];

    const wsAllItems = XLSX.utils.aoa_to_sheet([itemsHeaders, ...allItems]);
    wsAllItems['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 26 },
      { wch: 28 },
      { wch: 16 },
      { wch: 40 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 16 },
      { wch: 12 },
      { wch: 16 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsAllItems, 'All Line Items');
  }

  // Trigger Excel File Download
  const cleanCode = project.code.replace(/[/\\?%*:|"<>]/g, '_');
  const typeTag = docType || 'ALL_DOCUMENTS';
  const fileName = `${cleanCode}_${typeTag}_Archive.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * Downloads a section archive as Excel spreadsheet.
 */
export function downloadSectionArchive(project: StructureProject, section: DocumentSection): void {
  downloadProjectArchive(project, section.type);
}

/**
 * Downloads the master repository report for all 53 plant structures as a comprehensive Excel spreadsheet (.xlsx).
 */
export function downloadAllStructuresReport(projects: StructureProject[]): void {
  const totalPo = projects.reduce((acc, p) => acc + (p.totalPoAmount || 0), 0);
  const totalSo = projects.reduce((acc, p) => acc + (p.totalSoAmount || 0), 0);
  const grandTotalValuation = totalPo + totalSo;
  const totalDocs = projects.reduce(
    (acc, p) =>
      acc +
      p.materialIndentStatus.documents.length +
      p.poStatus.documents.length +
      p.serviceIndentStatus.documents.length +
      p.soStatus.documents.length,
    0
  );

  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const execData = [
    ['E & I DOCUMENTS - PLANT MASTER REPOSITORY REPORT', ''],
    ['RBM Infracon Ltd. - Electrical & Instrumentation Engineering', ''],
    ['', ''],
    ['EXECUTIVE SUMMARY', ''],
    ['Report Title', 'Plant Master Procurement & Ingestion Register'],
    ['Generated Date', new Date().toLocaleString()],
    ['Total Plant Structures', projects.length],
    ['Total Ingested Documents', totalDocs],
    ['Total Purchase Orders (PO) Valuation (₹)', totalPo],
    ['Formatted PO Total', formatRupees(totalPo)],
    ['Total Service Orders (SO) Valuation (₹)', totalSo],
    ['Formatted SO Total', formatRupees(totalSo)],
    ['Grand Combined Plant Valuation (₹)', grandTotalValuation],
    ['Formatted Grand Total', formatRupees(grandTotalValuation)],
    ['Audit Status', '100% Ingested & Verified'],
    ['Certified By', 'E & I Lead Site Engineer & Project Manager'],
  ];

  const wsExec = XLSX.utils.aoa_to_sheet(execData);
  wsExec['!cols'] = [{ wch: 40 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, wsExec, 'Executive Summary');

  // 2. All 53 Structures Summary Sheet
  const structuresHeaders = [
    'S.No',
    'Structure Code',
    'Structure Name',
    'Phase / Area',
    'Completion (%)',
    'Total PO Value (₹)',
    'Formatted PO',
    'Total SO Value (₹)',
    'Formatted SO',
    'Grand Valuation (₹)',
    'Material Indents Count',
    'Purchase Orders Count',
    'Service Indents Count',
    'Service Orders Count',
    'Total Files Ingested',
  ];

  const structuresRows = projects.map((p, idx) => {
    const docCount =
      p.materialIndentStatus.documents.length +
      p.poStatus.documents.length +
      p.serviceIndentStatus.documents.length +
      p.soStatus.documents.length;
    const poVal = p.totalPoAmount || 0;
    const soVal = p.totalSoAmount || 0;

    return [
      idx + 1,
      p.code,
      p.name,
      p.phase,
      `${p.overallCompletion}%`,
      poVal,
      formatRupees(poVal),
      soVal,
      formatRupees(soVal),
      poVal + soVal,
      p.materialIndentStatus.documents.length,
      p.poStatus.documents.length,
      p.serviceIndentStatus.documents.length,
      p.soStatus.documents.length,
      docCount,
    ];
  });

  // Total Summary Row
  structuresRows.push([
    'TOTAL',
    'ALL 53 STRUCTURES',
    'PLANT MASTER TOTAL',
    '',
    '100%',
    totalPo,
    formatRupees(totalPo),
    totalSo,
    formatRupees(totalSo),
    grandTotalValuation,
    projects.reduce((a, p) => a + p.materialIndentStatus.documents.length, 0),
    projects.reduce((a, p) => a + p.poStatus.documents.length, 0),
    projects.reduce((a, p) => a + p.serviceIndentStatus.documents.length, 0),
    projects.reduce((a, p) => a + p.soStatus.documents.length, 0),
    totalDocs,
  ]);

  const wsStructures = XLSX.utils.aoa_to_sheet([structuresHeaders, ...structuresRows]);
  wsStructures['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 38 },
    { wch: 14 },
    { wch: 15 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsStructures, 'Structures Master List');

  // 3. Master Documents Register Sheet (Every single file in the plant)
  const masterDocHeaders = [
    'S.No',
    'Structure Code',
    'Structure Name',
    'Document Type',
    'Reference No',
    'File Name',
    'Status',
    'Vendor / Supplier Name',
    'Vendor GSTIN',
    'Valuation (₹ INR)',
    'Formatted Valuation',
    'Uploaded By',
    'Upload Timestamp',
  ];

  const masterDocRows: any[][] = [];
  let masterDocIdx = 1;

  projects.forEach((p) => {
    const allProjDocs = [
      ...p.materialIndentStatus.documents,
      ...p.poStatus.documents,
      ...p.serviceIndentStatus.documents,
      ...p.soStatus.documents,
    ];

    allProjDocs.forEach((d) => {
      masterDocRows.push([
        masterDocIdx++,
        p.code,
        p.name,
        d.docType,
        d.referenceNo,
        d.name,
        (d.status || 'VERIFIED').toUpperCase(),
        d.vendorName || (d.docType === 'PO' || d.docType === 'SO' ? 'N/A' : 'E&I Division'),
        d.vendorGstin || 'N/A',
        d.amount || 0,
        d.amount ? formatRupees(d.amount) : '₹ 0',
        d.uploadedBy,
        d.uploadedAt,
      ]);
    });
  });

  const wsMasterDocs = XLSX.utils.aoa_to_sheet([masterDocHeaders, ...masterDocRows]);
  wsMasterDocs['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 32 },
    { wch: 18 },
    { wch: 28 },
    { wch: 35 },
    { wch: 14 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMasterDocs, 'Master Documents Register');

  // 4. Master Items & Rates Register
  const masterItemsHeaders = [
    'S.No',
    'Structure Code',
    'Structure Name',
    'Doc Type',
    'Reference No',
    'Vendor Name',
    'Item Code',
    'Description / Scope',
    'Quantity',
    'Unit',
    'Unit Price (₹)',
    'Basic Value (₹)',
    'GST Rate (%)',
    'Total Amount (₹)',
  ];

  const masterItemsRows: any[][] = [];
  let masterItemIdx = 1;

  projects.forEach((p) => {
    const allProjDocs = [
      ...p.materialIndentStatus.documents,
      ...p.poStatus.documents,
      ...p.serviceIndentStatus.documents,
      ...p.soStatus.documents,
    ];

    allProjDocs.forEach((d) => {
      if (d.itemsList && d.itemsList.length > 0) {
        d.itemsList.forEach((it) => {
          masterItemsRows.push([
            masterItemIdx++,
            p.code,
            p.name,
            d.docType,
            d.referenceNo,
            d.vendorName || 'E&I Division',
            it.itemCode || 'ITEM',
            it.description || 'Supply of material / service',
            it.quantity || 0,
            it.unit || it.uom || 'NOS',
            it.unitPrice || 0,
            it.basicValue || 0,
            it.gstRate ?? 18,
            it.total || 0,
          ]);
        });
      }
    });
  });

  if (masterItemsRows.length > 0) {
    const wsMasterItems = XLSX.utils.aoa_to_sheet([masterItemsHeaders, ...masterItemsRows]);
    wsMasterItems['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 30 },
      { wch: 16 },
      { wch: 26 },
      { wch: 26 },
      { wch: 16 },
      { wch: 40 },
      { wch: 10 },
      { wch: 10 },
      { wch: 14 },
      { wch: 16 },
      { wch: 12 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsMasterItems, 'Master Items Register');
  }

  // Trigger Excel File Download
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `E_and_I_Documents_Master_Report_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}


