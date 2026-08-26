export type DocumentType = 'MATERIAL_INDENT' | 'PO' | 'SERVICE_INDENT' | 'SO';

export type DocumentStatus = 'Approved' | 'Pending' | 'Awaiting PO' | 'Awaiting SO' | 'Rejected' | 'No Records' | 'Draft';

export interface DocumentItem {
  id: string;
  name: string;
  referenceNo: string;
  docType: DocumentType;
  status: DocumentStatus;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
  fileType: 'pdf' | 'xlsx' | 'docx' | 'csv' | 'png' | 'jpg' | 'zip';
  fileDataUrl?: string; // Stored Original File as Data URL (PDF, image, etc.)
  originalFileName?: string;
  amount?: number; // In ₹ Rupees (Represents the Total Order Value for PO/SO; 0 for Indent)
  vendorName?: string;
  vendorAddress?: string;
  vendorGstin?: string;
  vendorPinCode?: string;
  department?: string;
  indentorName?: string; // Person who requisitioned the indent
  requisitionDate?: string;
  priority?: string;
  justification?: string;
  approvedBy?: string;
  verifiedBy?: string;
  recommendedSupplier?: string;
  notes?: string;
  aiScanned?: boolean;
  filePreviewUrl?: string;
  poDate?: string;
  quotationNo?: string;
  deliveryDate?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  paymentTerms?: string;
  totalAmountBeforeTax?: number;
  freight?: number;
  cgst?: number;
  sgst?: number;
  totalOrderValue?: number; // Final commercial value for PO/SO
  amountInWords?: string;
  billToDetails?: {
    name: string;
    address: string;
    gstin: string;
    pinCode: string;
  };
  shipToDetails?: {
    name: string;
    address: string;
    gstin: string;
    pinCode: string;
  };
  itemsList?: Array<{
    sno?: number;
    itemCode: string;
    description: string;
    uom?: string;
    quantity: number;
    unit: string;
    unitPrice?: number; // Rate in ₹ (PO and SO documents only)
    basicValue?: number; // Basic Value in ₹ (PO and SO documents only)
    gstRate?: number; // GST % Rate (e.g. 18%)
    total?: number; // Total Amount in ₹
    specRemarks?: string; // Technical specification / make / standard for Indents
  }>;
  extractedFullText?: string; // Full line-by-line transcribed text of the document
  rawLines?: string[]; // All individual lines scanned from the document
}

export interface DocumentSection {
  type: DocumentType;
  label: string;
  status: DocumentStatus;
  referenceNo?: string;
  count: number;
  totalAmount: number; // Sum of ₹ amounts for this section
  documents: DocumentItem[];
  lastUpdated?: string;
  canDownload: boolean;
  canView: boolean;
}

export interface StructureProject {
  id: string;
  code: string;
  name: string;
  phase: string;
  statusColor: 'emerald' | 'gray' | 'amber';
  isComplete: boolean;
  requiresAction: boolean;
  lastUpdated: string;
  description: string;
  overallCompletion: number; // 0 to 100
  // Group 1: Material Procurement
  materialIndentStatus: DocumentSection;
  poStatus: DocumentSection;
  // Group 2: Services & Contracting
  serviceIndentStatus: DocumentSection;
  soStatus: DocumentSection;
  // Aggregate ₹ Amounts
  totalPoAmount: number;
  totalSoAmount: number;
  totalAmount?: number;
  budget?: number;
  spent?: number;
  location?: string;
  manager?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'approval' | 'upload' | 'delete' | 'phase' | 'alert';
  projectId?: string;
  docType?: DocumentType;
}

export type TabType = 'dashboard' | 'dumping-yard';
