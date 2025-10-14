import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { DocumentDetailScreen } from '@/components/DocumentDetailScreen';

type DocumentType = 'prescription' | 'lab' | 'imaging' | 'billing';
type FileType = 'PDF' | 'JPG' | 'PNG' | 'DICOM';
type AIStatus = 'normal' | 'warning' | 'urgent' | 'none';
type SyncStatus = 'synced' | 'pending';

type DocumentMetadata = {
  title: string;
  type: 'Lab' | 'Prescription' | 'Imaging' | 'Bill';
  provider: string;
  date: string;
  tags: string[];
  version: string;
  lastUpdated: string;
  syncStatus: SyncStatus;
};

type AIInsight = {
  status: AIStatus;
  summary: string;
  hasFullAnalysis: boolean;
};

type VersionHistoryItem = {
  version: string;
  timestamp: string;
  note: string;
};

type AccessItem = {
  name: string;
  role: string;
  expiry: string;
};

type VaultDocument = {
  id: string;
  title: string;
  provider?: string;
  date: string;
  type: DocumentType;
  tags: string[];
};

const mockDocuments: VaultDocument[] = [
  {
    id: '1',
    title: 'Lab Report',
    provider: 'Apollo Hospital',
    date: '12 Jul 2025',
    type: 'lab',
    tags: ['Lab', 'Blood Test']
  },
  {
    id: '2',
    title: 'Prescription',
    provider: 'Dr. Sharma',
    date: '10 Jul 2025',
    type: 'prescription',
    tags: ['Prescription', 'Diabetes']
  },
  {
    id: '3',
    title: 'X-Ray Chest',
    provider: 'Max Healthcare',
    date: '05 Jul 2025',
    type: 'imaging',
    tags: ['Imaging', 'X-Ray']
  },
  {
    id: '4',
    title: 'Insurance Claim',
    provider: 'ICICI Lombard',
    date: '01 Jul 2025',
    type: 'billing',
    tags: ['Insurance', 'Billing']
  }
];

const getDocumentMetadata = (doc: VaultDocument): DocumentMetadata => {
  const typeMap: Record<DocumentType, 'Lab' | 'Prescription' | 'Imaging' | 'Bill'> = {
    'lab': 'Lab',
    'prescription': 'Prescription',
    'imaging': 'Imaging',
    'billing': 'Bill'
  };

  return {
    title: doc.title,
    type: typeMap[doc.type],
    provider: doc.provider || 'Unknown Provider',
    date: doc.date,
    tags: doc.tags,
    version: 'v1.0',
    lastUpdated: doc.date,
    syncStatus: 'synced'
  };
};

const getFileType = (docType: DocumentType): FileType => {
  if (docType === 'imaging') return 'DICOM';
  return 'PDF';
};

const getAIInsight = (docType: DocumentType): AIInsight => {
  if (docType === 'lab') {
    return {
      status: 'warning',
      summary: 'Your sugar level is slightly higher than normal. Consider consulting your doctor within 48 hours.',
      hasFullAnalysis: true
    };
  }
  
  if (docType === 'prescription') {
    return {
      status: 'normal',
      summary: 'Medication dosage is within recommended limits. Continue as prescribed.',
      hasFullAnalysis: false
    };
  }

  return {
    status: 'none',
    summary: '',
    hasFullAnalysis: false
  };
};

const defaultVersionHistory: VersionHistoryItem[] = [
  {
    version: 'v1.0',
    timestamp: '15 Jan 2024, 10:30 AM',
    note: 'Initial upload'
  },
  {
    version: 'v0.9',
    timestamp: '14 Jan 2024, 3:45 PM',
    note: 'Re-uploaded with updated report'
  }
];

const defaultAccessList: AccessItem[] = [
  {
    name: 'Dr. Sharma',
    role: 'General Physician',
    expiry: 'Expires in 7 days'
  },
  {
    name: 'Apollo Diagnostics',
    role: 'Lab Partner',
    expiry: 'Expires in 30 days'
  }
];

export default function DocumentDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/document/:id');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const documentId = params?.id || '1';
  const document = mockDocuments.find(doc => doc.id === documentId) || mockDocuments[0];

  const metadata = getDocumentMetadata(document);
  const fileType = getFileType(document.type);
  const aiInsight = getAIInsight(document.type);

  const handleBack = () => {
    console.log('⬅️ Back to vault');
    setLocation('/vault');
  };

  const handleShare = () => {
    console.log('📤 Share document');
    setLocation('/consent');
  };

  const handleViewFullscreen = () => {
    console.log('🔍 View fullscreen');
    alert('Fullscreen viewer coming soon!');
  };

  const handleViewDICOM = () => {
    console.log('🏥 Open DICOM viewer');
    alert('DICOM viewer coming soon!');
  };

  const handleViewFullAnalysis = () => {
    console.log('📊 View full AI analysis');
    alert('AI analysis details coming soon!');
  };

  const handleManageAccess = () => {
    console.log('👥 Manage access');
    setLocation('/consent');
  };

  const handleVersionClick = (version: string) => {
    console.log(`📋 Preview version: ${version}`);
    alert(`Version ${version} preview coming soon!`);
  };

  const handleEditMetadata = () => {
    console.log('✏️ Edit metadata');
    alert('Metadata editor coming soon!');
  };

  const handleMoreOptions = () => {
    console.log('⋮ More options');
    alert('Additional options coming soon!');
  };

  return (
    <DocumentDetailScreen
      fileType={fileType}
      metadata={metadata}
      aiInsight={aiInsight}
      versionHistory={defaultVersionHistory}
      accessList={defaultAccessList}
      language={language}
      onBack={handleBack}
      onShare={handleShare}
      onViewFullscreen={handleViewFullscreen}
      onViewDICOM={handleViewDICOM}
      onViewFullAnalysis={handleViewFullAnalysis}
      onManageAccess={handleManageAccess}
      onVersionClick={handleVersionClick}
      onEditMetadata={handleEditMetadata}
      onMoreOptions={handleMoreOptions}
    />
  );
}
