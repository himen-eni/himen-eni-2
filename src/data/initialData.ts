import { StructureProject, NotificationItem } from '../types';

export const RAW_PLANT_STRUCTURES: Array<{ sno: number; code: string; name: string }> = [
  { sno: 1, code: 'ST-1', name: 'ST-1-REFINERY PLANT' },
  { sno: 2, code: 'ST-2', name: 'ST-2-OLEO PLANT' },
  { sno: 3, code: 'ST-3', name: 'ST-3-PACKING PLANT' },
  { sno: 4, code: 'ST-4', name: 'ST-4-BOILER' },
  { sno: 5, code: 'ST-5', name: 'ST-5-CHIMNEY' },
  { sno: 6, code: 'ST-6', name: 'ST-6-COAL HANDLING SYSTEM' },
  { sno: 7, code: 'ST-7', name: 'ST-7-COAL YARD' },
  { sno: 8, code: 'ST-8', name: 'ST-8-TG BUILDING' },
  { sno: 9, code: 'ST-9', name: 'ST-9-AOP TANK FARM' },
  { sno: 10, code: 'ST-10', name: 'ST-10-BAKERY TANK FARM' },
  { sno: 11, code: 'ST-11', name: 'ST-11-BEADING TANK FARM' },
  { sno: 12, code: 'ST-12', name: 'ST-12-CHEMICALS TANK FARM' },
  { sno: 13, code: 'ST-13', name: 'ST-13-CPO TANK FARM' },
  { sno: 14, code: 'ST-14', name: 'ST-14-IE TANK FARM' },
  { sno: 15, code: 'ST-15', name: 'ST-15-OLEO TANK FARM' },
  { sno: 16, code: 'ST-16', name: 'ST-16-PACKING TANK FARM' },
  { sno: 17, code: 'ST-17', name: 'ST-17-PKO TANK FARM' },
  { sno: 18, code: 'ST-18', name: 'ST-18-SOYA TANK FARM' },
  { sno: 19, code: 'ST-19', name: 'ST-19-SUNFLOWER TANK FARM' },
  { sno: 20, code: 'ST-20', name: 'ST-20-HYDROGENATION PLANT' },
  { sno: 21, code: 'ST-21', name: 'ST-21-PKO PLANT' },
  { sno: 22, code: 'ST-22', name: 'ST-22-SILO' },
  { sno: 23, code: 'ST-23', name: 'ST-23-WATER TANK' },
  { sno: 24, code: 'ST-24', name: 'ST-24-WTP' },
  { sno: 25, code: 'ST-25', name: 'ST-25-ETP' },
  { sno: 26, code: 'ST-26', name: 'ST-26-STP' },
  { sno: 27, code: 'ST-27', name: 'ST-27-WEIGHBRIDGE' },
  { sno: 28, code: 'ST-28', name: 'ST-28-OLEO WAREHOUSE' },
  { sno: 29, code: 'ST-29', name: 'ST-29-SPRAY COOLER PLANT' },
  { sno: 30, code: 'ST-30', name: 'ST-30-SOAP PLANT' },
  { sno: 31, code: 'ST-31', name: 'ST-31-ACID OIL PLANT' },
  { sno: 32, code: 'ST-32', name: 'ST-32-IE PLANT' },
  { sno: 33, code: 'ST-33', name: 'ST-33-PIPE RACK' },
  { sno: 34, code: 'ST-34', name: 'ST-34-SWITCH YARD' },
  { sno: 35, code: 'ST-35', name: 'ST-35-SPENT EARTH & CATALYST STORE' },
  { sno: 36, code: 'ST-36', name: 'ST-36-HSD STORAGE' },
  { sno: 37, code: 'ST-37', name: 'ST-37-RM AND FG LOADING & UNLOADING' },
  { sno: 38, code: 'ST-38', name: 'ST-38-PUMP HOUSE' },
  { sno: 39, code: 'ST-39', name: 'ST-39-PLANT UTILITY' },
  { sno: 40, code: 'ST-40', name: 'ST-40-GATE COMPLEX' },
  { sno: 41, code: 'ST-41', name: 'ST-41-COMPOUND WALL' },
  { sno: 42, code: 'ST-42', name: 'ST-42-ROAD' },
  { sno: 43, code: 'ST-43', name: 'ST-43-DRAIN' },
  { sno: 44, code: 'ST-44', name: 'ST-44-FOOTPATH' },
  { sno: 45, code: 'ST-45', name: 'ST-45-TOILET BLOCK' },
  { sno: 46, code: 'ST-46', name: 'ST-46-ADMIN BUILDING' },
  { sno: 47, code: 'ST-47', name: 'ST-47-WORKERS ENTRY' },
  { sno: 48, code: 'ST-48', name: 'ST-48-WATCH TOWER' },
  { sno: 49, code: 'ST-49', name: 'ST-49-WAREHOUSE' },
  { sno: 50, code: 'ST-50', name: 'ST-50-2-POLE STRUCTURE' },
  { sno: 51, code: 'ST-51', name: 'ST-51-GARDEN WALL' },
  { sno: 52, code: 'ST-52', name: 'ST-52-STORE' },
  { sno: 53, code: 'ST-53', name: 'ST-53-STREET LIGHT/HIGH MAST' }
];

export const INITIAL_PROJECTS: StructureProject[] = RAW_PLANT_STRUCTURES.map((item) => {
  if (item.sno === 1) {
    // ST-1 Pre-seeded with official RBM Infracon PO from Ashirwad Electricals
    const ashriwadPoDoc = {
      id: 'doc-st-1-po-000271',
      name: 'RBM_PO_000271_Ashirwad_Electricals.pdf',
      referenceNo: 'RBM/EIIL/25-26/PO/000271',
      docType: 'PO' as const,
      status: 'Approved' as const,
      uploadedAt: '6-Nov-25',
      uploadedBy: 'PRAJAPATI HITESHBHAI V',
      fileSize: '1.4 MB',
      fileType: 'pdf' as const,
      amount: 81441.24, // EXACT TOTAL ORDER VALUE: 81,441.24
      totalOrderValue: 81441.24,
      totalAmountBeforeTax: 67518.00,
      freight: 1500.00,
      cgst: 6211.62,
      sgst: 6211.62,
      amountInWords: 'INR Eighty One Thousand Four Hundred Forty One and Twenty Four paise Only',
      vendorName: 'ASHIRWAD ELECTRICALS',
      vendorAddress: 'PLOT NO.68/121, NEAR RTO OFFICE & BANK OF BARODA, MEGHPAR BORICHI,-ANJAR',
      vendorGstin: '24BSTPK1782R1ZS',
      vendorPinCode: '370110',
      poDate: '6-Nov-25',
      quotationNo: 'RBM/EIIL/25-26/QTN/00356',
      deliveryDate: '10-Nov-25',
      contactPerson: 'Ashwin Kundwani',
      contactPhone: '9998477384',
      contactEmail: 'ashirwadelectricals1@gmail.com',
      paymentTerms: '15 Days',
      department: 'E & I Procurement',
      aiScanned: true,
      itemsList: [
        {
          sno: 1,
          itemCode: 'EM100125',
          description: 'MCB 20 A 1 POLE CLASS C C&S MAKE',
          uom: 'NOS',
          quantity: 12,
          unit: 'NOS',
          unitPrice: 128.00,
          basicValue: 1536.00,
          gstRate: 18,
          total: 1812.48
        },
        {
          sno: 2,
          itemCode: 'EM100041',
          description: 'CABLE 1.5 SQ MM SINGLE CORE COPPER FLEXIBLE (RED)',
          uom: 'MTR',
          quantity: 1000,
          unit: 'MTR',
          unitPrice: 17.85,
          basicValue: 17850.00,
          gstRate: 18,
          total: 21063.00
        },
        {
          sno: 3,
          itemCode: 'EM100039',
          description: 'CABLE 1.5 SQ MM SINGLE CORE COPPER FLEXIBLE (BLACK)',
          uom: 'MTR',
          quantity: 1000,
          unit: 'MTR',
          unitPrice: 17.85,
          basicValue: 17850.00,
          gstRate: 18,
          total: 21063.00
        },
        {
          sno: 4,
          itemCode: 'EM100040',
          description: 'CABLE 1.5 SQ MM SINGLE CORE COPPER FLEXIBLE (GREEN)',
          uom: 'MTR',
          quantity: 200,
          unit: 'MTR',
          unitPrice: 17.85,
          basicValue: 3570.00,
          gstRate: 18,
          total: 4212.60
        },
        {
          sno: 5,
          itemCode: 'EM100186',
          description: 'CABLE 4 SQ MM 1 CORE COPPER FLEXIBLE RED COLOR CABLE, BLACK COLOR CABLE, GREEN COLOR CABLE',
          uom: 'MTR',
          quantity: 600,
          unit: 'MTR',
          unitPrice: 44.52,
          basicValue: 26712.00,
          gstRate: 18,
          total: 31520.16
        }
      ]
    };

    const indentDoc = {
      id: 'doc-st-1-mat-ind-001',
      name: 'Material_Indent_ST1_Refinery.pdf',
      originalFileName: 'Material_Indent_ST1_Refinery.pdf',
      referenceNo: 'M-IND-2025-001',
      docType: 'MATERIAL_INDENT' as const,
      status: 'Approved' as const,
      uploadedAt: '4-Nov-25',
      uploadedBy: 'PRAJAPATI HITESHBHAI V',
      indentorName: 'PRAJAPATI HITESHBHAI V',
      requisitionDate: '4-Nov-25',
      priority: 'High',
      justification: 'Urgent site requirement for refinery plant main motor control center cabling and panel power feed.',
      verifiedBy: 'E & I Quality In-Charge',
      approvedBy: 'Project Manager (RBM Site)',
      recommendedSupplier: 'ASHIRWAD ELECTRICALS / Approved Vendor',
      fileSize: '840 KB',
      fileType: 'pdf' as const,
      amount: 0,
      vendorName: 'E & I Site Material Store',
      department: 'E & I Execution',
      aiScanned: true,
      itemsList: [
        {
          sno: 1,
          itemCode: 'EM100125',
          description: 'MCB 20 A 1 POLE CLASS C C&S MAKE',
          uom: 'NOS',
          quantity: 12,
          unit: 'NOS',
          specRemarks: 'Class C tripping characteristic'
        },
        {
          sno: 2,
          itemCode: 'EM100041',
          description: 'CABLE 1.5 SQ MM SINGLE CORE COPPER FLEXIBLE (RED)',
          uom: 'MTR',
          quantity: 1000,
          unit: 'MTR',
          specRemarks: 'IS 694 standard, FR PVC insulated'
        },
        {
          sno: 3,
          itemCode: 'EM100039',
          description: 'CABLE 1.5 SQ MM SINGLE CORE COPPER FLEXIBLE (BLACK)',
          uom: 'MTR',
          quantity: 1000,
          unit: 'MTR',
          specRemarks: 'IS 694 standard, FR PVC insulated'
        },
        {
          sno: 4,
          itemCode: 'EM100040',
          description: 'CABLE 1.5 SQ MM SINGLE CORE COPPER FLEXIBLE (GREEN)',
          uom: 'MTR',
          quantity: 200,
          unit: 'MTR',
          specRemarks: 'Earthing conductor'
        },
        {
          sno: 5,
          itemCode: 'EM100186',
          description: 'CABLE 4 SQ MM 1 CORE COPPER FLEXIBLE',
          uom: 'MTR',
          quantity: 600,
          unit: 'MTR',
          specRemarks: 'High flexibility copper cable'
        }
      ]
    };

    return {
      id: `structure-st-${item.sno}`,
      code: item.code,
      name: item.name,
      phase: 'E & I Procurement & Cabling',
      statusColor: 'emerald' as const,
      isComplete: false,
      requiresAction: false,
      lastUpdated: '6-Nov-25',
      description: `Electrical & Instrumentation Structure: ${item.name}`,
      overallCompletion: 45,
      // Group 1: Material Procurement
      materialIndentStatus: {
        type: 'MATERIAL_INDENT' as const,
        label: 'Material Indent',
        status: 'Approved' as const,
        count: 1,
        totalAmount: 0,
        canDownload: true,
        canView: true,
        documents: [indentDoc]
      },
      poStatus: {
        type: 'PO' as const,
        label: 'Purchase Order (PO)',
        status: 'Approved' as const,
        count: 1,
        totalAmount: 81441.24, // EXACT TOTAL ORDER VALUE
        canDownload: true,
        canView: true,
        documents: [ashriwadPoDoc]
      },
      // Group 2: Services & Contracting
      serviceIndentStatus: {
        type: 'SERVICE_INDENT' as const,
        label: 'Service Indent',
        status: 'Pending' as const,
        count: 0,
        totalAmount: 0,
        canDownload: false,
        canView: false,
        documents: []
      },
      soStatus: {
        type: 'SO' as const,
        label: 'Service Order (SO)',
        status: 'Pending' as const,
        count: 0,
        totalAmount: 0,
        canDownload: false,
        canView: false,
        documents: []
      },
      totalPoAmount: 81441.24,
      totalSoAmount: 0,
      location: 'Adani Wilmar / RBM Site Kutch',
      manager: 'E & I Lead Engineer'
    };
  }

  return {
    id: `structure-st-${item.sno}`,
    code: item.code,
    name: item.name,
    phase: 'E & I Execution',
    statusColor: 'gray' as const,
    isComplete: false,
    requiresAction: false,
    lastUpdated: 'No documents uploaded',
    description: `Electrical & Instrumentation Structure: ${item.name}`,
    overallCompletion: 0,
    // Group 1: Material Procurement
    materialIndentStatus: {
      type: 'MATERIAL_INDENT' as const,
      label: 'Material Indent',
      status: 'Pending' as const,
      count: 0,
      totalAmount: 0,
      canDownload: false,
      canView: false,
      documents: []
    },
    poStatus: {
      type: 'PO' as const,
      label: 'Purchase Order (PO)',
      status: 'Pending' as const,
      count: 0,
      totalAmount: 0,
      canDownload: false,
      canView: false,
      documents: []
    },
    // Group 2: Services & Contracting
    serviceIndentStatus: {
      type: 'SERVICE_INDENT' as const,
      label: 'Service Indent',
      status: 'Pending' as const,
      count: 0,
      totalAmount: 0,
      canDownload: false,
      canView: false,
      documents: []
    },
    soStatus: {
      type: 'SO' as const,
      label: 'Service Order (SO)',
      status: 'Pending' as const,
      count: 0,
      totalAmount: 0,
      canDownload: false,
      canView: false,
      documents: []
    },
    totalPoAmount: 0,
    totalSoAmount: 0,
    location: 'Adani Wilmar / RBM Site Kutch',
    manager: 'E & I Lead Engineer'
  };
});

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'PO Registered: Total Order Value ₹ 81,441.24',
    description: 'PO #RBM/EIIL/25-26/PO/000271 for ST-1 Refinery Plant approved for Ashirwad Electricals.',
    timestamp: '10 mins ago',
    read: false,
    type: 'approval',
    projectId: 'structure-st-1',
    docType: 'PO'
  }
];
