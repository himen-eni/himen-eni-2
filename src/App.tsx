import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, SidebarNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { DumpingYardView } from './components/DumpingYardView';
import { DocumentModal } from './components/DocumentModal';
import { UploadModal } from './components/UploadModal';
import { NewStructureModal } from './components/NewStructureModal';
import { NotificationModal } from './components/NotificationModal';
import { INITIAL_PROJECTS, INITIAL_NOTIFICATIONS } from './data/initialData';
import {
  StructureProject,
  DocumentSection,
  DocumentType,
  DocumentItem,
  NotificationItem,
  TabType
} from './types';
import { formatRupees } from './utils/aiRateScanner';
import {
  sanitizeProjectsForLocalStorage,
  safeSetLocalStorage,
  deleteDocumentBlob
} from './utils/storageUtils';

const STORAGE_KEY_STRUCTURES = 'eni_plant_structures_v4_dark';
const STORAGE_KEY_NOTIFICATIONS = 'eni_notifications_v4_dark';

export default function App() {
  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Persistence State - initialized with the 53 plant structures with 4-stage schema
  const [projects, setProjects] = useState<StructureProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STRUCTURES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 50 && parsed[0]?.materialIndentStatus) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse cached structures', e);
    }
    return INITIAL_PROJECTS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse cached notifications', e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Save to local storage on state update safely without base64 blob bloat
  useEffect(() => {
    const sanitized = sanitizeProjectsForLocalStorage(projects);
    safeSetLocalStorage(STORAGE_KEY_STRUCTURES, sanitized);
  }, [projects]);

  useEffect(() => {
    safeSetLocalStorage(STORAGE_KEY_NOTIFICATIONS, notifications);
  }, [notifications]);

  // Modal States
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedProjectForDoc, setSelectedProjectForDoc] = useState<StructureProject | null>(null);
  const [selectedSectionForDoc, setSelectedSectionForDoc] = useState<DocumentSection | null>(null);
  const [selectedDocIdForDoc, setSelectedDocIdForDoc] = useState<string | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProjectTarget, setUploadProjectTarget] = useState<StructureProject | null>(null);
  const [uploadDocTypeTarget, setUploadDocTypeTarget] = useState<DocumentType>('MATERIAL_INDENT');

  const [isNewStructureModalOpen, setIsNewStructureModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Toast alert state
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Open Document Modal with optional specific document ID
  const handleOpenDocumentModal = (
    project: StructureProject,
    section: DocumentSection,
    specificDocId?: string
  ) => {
    setSelectedProjectForDoc(project);
    setSelectedSectionForDoc(section);
    setSelectedDocIdForDoc(specificDocId || null);
    setIsDocModalOpen(true);
  };

  // Open Upload Modal
  const handleOpenUpload = (project?: StructureProject, docType?: DocumentType) => {
    setUploadProjectTarget(project || projects[0] || null);
    setUploadDocTypeTarget(docType || 'MATERIAL_INDENT');
    setIsUploadModalOpen(true);
  };

  // Handle successful upload of documents (single or multiple)
  const handleUploadSuccess = (
    projectId: string,
    docType: DocumentType,
    newDocs: DocumentItem[]
  ) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;

        const targetKey =
          docType === 'MATERIAL_INDENT'
            ? 'materialIndentStatus'
            : docType === 'SERVICE_INDENT'
            ? 'serviceIndentStatus'
            : docType === 'PO'
            ? 'poStatus'
            : 'soStatus';

        const currentSection = proj[targetKey];
        const updatedDocs = [...newDocs, ...currentSection.documents];

        // Sum up total amounts for this section
        const sectionTotalAmount = updatedDocs.reduce((acc, d) => acc + (d.amount || 0), 0);

        // Recalculate section status & permissions
        const updatedSection: DocumentSection = {
          ...currentSection,
          documents: updatedDocs,
          count: updatedDocs.length,
          totalAmount: sectionTotalAmount,
          status:
            docType === 'MATERIAL_INDENT' || docType === 'SERVICE_INDENT'
              ? 'Approved'
              : docType === 'PO'
              ? 'Pending'
              : 'Pending',
          canDownload: true,
          canView: true,
          lastUpdated: 'Just now'
        };

        const updatedProj = {
          ...proj,
          [targetKey]: updatedSection
        };

        // Recalculate structure PO and SO totals
        const totalPoAmount = updatedProj.poStatus.documents.reduce(
          (acc, d) => acc + (d.amount || 0),
          0
        );
        const totalSoAmount = updatedProj.soStatus.documents.reduce(
          (acc, d) => acc + (d.amount || 0),
          0
        );
        const totalAmount = totalPoAmount + totalSoAmount;

        // Recalculate completion percentage across 4 stages
        const hasMatIndent = updatedProj.materialIndentStatus.documents.length > 0;
        const hasPo = updatedProj.poStatus.documents.length > 0;
        const hasServIndent = updatedProj.serviceIndentStatus.documents.length > 0;
        const hasSo = updatedProj.soStatus.documents.length > 0;

        const stagesCompleted = [hasMatIndent, hasPo, hasServIndent, hasSo].filter(Boolean).length;
        const comp = stagesCompleted * 25;

        return {
          ...updatedProj,
          totalPoAmount,
          totalSoAmount,
          totalAmount,
          lastUpdated: 'Just now',
          overallCompletion: comp,
          isComplete: comp === 100,
          statusColor: comp === 100 ? 'emerald' : comp > 0 ? 'emerald' : 'gray'
        };
      })
    );

    // Keep selected section for open modal updated
    if (selectedProjectForDoc && selectedProjectForDoc.id === projectId) {
      setSelectedProjectForDoc((prevProj) => {
        if (!prevProj) return null;
        const targetKey =
          docType === 'MATERIAL_INDENT'
            ? 'materialIndentStatus'
            : docType === 'SERVICE_INDENT'
            ? 'serviceIndentStatus'
            : docType === 'PO'
            ? 'poStatus'
            : 'soStatus';
        const currentSection = prevProj[targetKey];
        const updatedDocs = [...newDocs, ...currentSection.documents];
        const sectionTotalAmount = updatedDocs.reduce((acc, d) => acc + (d.amount || 0), 0);
        const updatedSec = {
          ...currentSection,
          documents: updatedDocs,
          count: updatedDocs.length,
          totalAmount: sectionTotalAmount
        };
        setSelectedSectionForDoc(updatedSec);
        return {
          ...prevProj,
          [targetKey]: updatedSec
        };
      });
    }

    // Add notification
    const targetProject = projects.find((p) => p.id === projectId);
    const totalScannedRupees = newDocs.reduce((acc, d) => acc + (d.amount || 0), 0);
    const rupeeStr = totalScannedRupees > 0 ? ` (Valuation: ${formatRupees(totalScannedRupees)})` : '';

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `${docType} Uploaded: ${newDocs.length} File${newDocs.length > 1 ? 's' : ''}`,
      description: `${newDocs.length} file${newDocs.length > 1 ? 's' : ''}${rupeeStr} uploaded to ${
        targetProject?.name || projectId
      }.`,
      timestamp: 'Just now',
      read: false,
      type: 'upload',
      projectId: projectId,
      docType: docType
    };

    setNotifications((prev) => [newNotif, ...prev]);
    showToast(
      `Ingested ${newDocs.length} file${newDocs.length > 1 ? 's' : ''} into ${
        targetProject?.name || 'plant structure'
      }!`
    );
  };

  // Handle Delete / Remove document item
  const handleDeleteDocument = (
    projectId: string,
    docType: DocumentType,
    docId: string
  ) => {
    let deletedDocName = '';
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;

        const targetKey =
          docType === 'MATERIAL_INDENT'
            ? 'materialIndentStatus'
            : docType === 'SERVICE_INDENT'
            ? 'serviceIndentStatus'
            : docType === 'PO'
            ? 'poStatus'
            : 'soStatus';

        const currentSection = proj[targetKey];
        const targetDoc = currentSection.documents.find((d) => d.id === docId);
        if (targetDoc) deletedDocName = targetDoc.name;

        const remainingDocs = currentSection.documents.filter((d) => d.id !== docId);
        const sectionTotalAmount = remainingDocs.reduce((acc, d) => acc + (d.amount || 0), 0);

        const updatedSection: DocumentSection = {
          ...currentSection,
          documents: remainingDocs,
          count: remainingDocs.length,
          totalAmount: sectionTotalAmount,
          status: remainingDocs.length === 0 ? 'Draft' : currentSection.status,
          canDownload: remainingDocs.length > 0,
          canView: remainingDocs.length > 0,
          lastUpdated: 'Just now'
        };

        const updatedProj = {
          ...proj,
          [targetKey]: updatedSection
        };

        const totalPoAmount = updatedProj.poStatus.documents.reduce(
          (acc, d) => acc + (d.amount || 0),
          0
        );
        const totalSoAmount = updatedProj.soStatus.documents.reduce(
          (acc, d) => acc + (d.amount || 0),
          0
        );
        const totalAmount = totalPoAmount + totalSoAmount;

        const hasMatIndent = updatedProj.materialIndentStatus.documents.length > 0;
        const hasPo = updatedProj.poStatus.documents.length > 0;
        const hasServIndent = updatedProj.serviceIndentStatus.documents.length > 0;
        const hasSo = updatedProj.soStatus.documents.length > 0;

        const stagesCompleted = [hasMatIndent, hasPo, hasServIndent, hasSo].filter(Boolean).length;
        const comp = stagesCompleted * 25;

        return {
          ...updatedProj,
          totalPoAmount,
          totalSoAmount,
          totalAmount,
          overallCompletion: comp,
          isComplete: comp === 100,
          statusColor: comp === 100 ? 'emerald' : comp > 0 ? 'emerald' : 'gray'
        };
      })
    );

    // Keep active modal section synced
    if (selectedProjectForDoc && selectedProjectForDoc.id === projectId) {
      setSelectedProjectForDoc((prevProj) => {
        if (!prevProj) return null;
        const targetKey =
          docType === 'MATERIAL_INDENT'
            ? 'materialIndentStatus'
            : docType === 'SERVICE_INDENT'
            ? 'serviceIndentStatus'
            : docType === 'PO'
            ? 'poStatus'
            : 'soStatus';
        const currentSection = prevProj[targetKey];
        const remainingDocs = currentSection.documents.filter((d) => d.id !== docId);
        const sectionTotalAmount = remainingDocs.reduce((acc, d) => acc + (d.amount || 0), 0);
        const updatedSec = {
          ...currentSection,
          documents: remainingDocs,
          count: remainingDocs.length,
          totalAmount: sectionTotalAmount
        };
        setSelectedSectionForDoc(updatedSec);
        return {
          ...prevProj,
          [targetKey]: updatedSec
        };
      });
    }

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Document Removed: ${deletedDocName || 'File'}`,
      description: `Removed from ${docType} section of plant structure.`,
      timestamp: 'Just now',
      read: false,
      type: 'alert',
      projectId: projectId
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showToast(`Removed "${deletedDocName || 'document'}" from repository.`);
  };

  // Handle adding new structure
  const handleAddStructure = (newStructure: StructureProject) => {
    setProjects((prev) => [newStructure, ...prev]);
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Plant Structure Added: ${newStructure.name}`,
      description: `Structure ${newStructure.code} registered in E&I repository.`,
      timestamp: 'Just now',
      read: false,
      type: 'phase',
      projectId: newStructure.id
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showToast(`Added "${newStructure.name}" to E&I repository.`);
  };

  const grandTotalPoSum = projects.reduce((acc, p) => acc + (p.totalPoAmount || 0), 0);
  const grandTotalSoSum = projects.reduce((acc, p) => acc + (p.totalSoAmount || 0), 0);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-[#0b0f17] text-[#f8fafc] min-h-screen flex flex-col pt-14 pb-20 md:pb-8 selection:bg-[#22c55e] selection:text-[#052e16]">
      {/* Top Header App Bar (E & I Documents) */}
      <Header
        notifications={notifications}
        unreadCount={unreadCount}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
      />

      {/* Desktop Sidebar Navigation */}
      <SidebarNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewStructure={() => setIsNewStructureModalOpen(true)}
        onOpenUpload={() => handleOpenUpload()}
        totalPoSum={grandTotalPoSum}
        totalSoSum={grandTotalSoSum}
      />

      {/* Main Content Layout Canvas */}
      <main
        id="main-content-canvas"
        className="flex-grow flex flex-col max-w-7xl mx-auto w-full px-3 md:px-6 py-5 md:ml-64 md:max-w-[calc(100%-16rem)]"
      >
        {activeTab === 'dashboard' ? (
          <DashboardView
            projects={projects}
            onOpenDocumentModal={handleOpenDocumentModal}
            onDeleteDocument={handleDeleteDocument}
          />
        ) : (
          <DumpingYardView
            projects={projects}
            onOpenDocumentModal={handleOpenDocumentModal}
            onOpenUpload={handleOpenUpload}
            onDeleteDocument={handleDeleteDocument}
          />
        )}
      </main>

      {/* Mobile Bottom Nav Bar */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals */}
      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => {
          setIsDocModalOpen(false);
          setSelectedDocIdForDoc(null);
        }}
        project={selectedProjectForDoc}
        section={selectedSectionForDoc}
        initialDocId={selectedDocIdForDoc}
        onDeleteDocument={handleDeleteDocument}
        onOpenUpload={(proj, type) => handleOpenUpload(proj, type)}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        projects={projects}
        defaultProject={uploadProjectTarget}
        defaultDocType={uploadDocTypeTarget}
        onUploadSuccess={handleUploadSuccess}
      />

      <NewStructureModal
        isOpen={isNewStructureModalOpen}
        onClose={() => setIsNewStructureModalOpen(false)}
        onAddStructure={handleAddStructure}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onClearNotifications={() => setNotifications([])}
      />

      {/* Interactive Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-50 bg-[#1e293b] border border-[#334155] text-[#f8fafc] px-4 py-2.5 rounded-xl shadow-2xl text-[12px] font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
