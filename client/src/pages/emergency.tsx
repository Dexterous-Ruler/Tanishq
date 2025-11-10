import { useLocation } from 'wouter';
import { EmergencyCardScreen } from '@/components/EmergencyCardScreen';
import { useEmergencyCard, useUpdateEmergencyCard } from '@/hooks/useEmergency';
import { useUserProfile } from '@/hooks/useUser';
import { useDocuments } from '@/hooks/useDocuments';
import { useNominees } from '@/hooks/useNominees';
import { useToast } from '@/hooks/use-toast';
import type { EmergencyCardData } from '@/lib/api/emergency';

export default function EmergencyPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch emergency card data
  const { data: emergencyData, isLoading: emergencyLoading } = useEmergencyCard();
  
  // Fetch user profile for pre-population
  const { data: userProfileData } = useUserProfile();
  
  // Fetch documents for prescriptions and lab reports
  const { data: documentsData } = useDocuments({});
  
  // Fetch nominees
  const { data: nomineesData } = useNominees();
  
  // Update mutation
  const updateMutation = useUpdateEmergencyCard();

  const handleBack = () => {
    setLocation('/home');
  };

  const handleManageNominee = () => {
    setLocation('/nominee-management');
  };

  const handleSave = async (data: EmergencyCardData) => {
    try {
      await updateMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to save emergency card:', error);
    }
  };

  // Calculate age from dateOfBirth if available
  const calculateAge = (dateOfBirth?: Date | string | null): number | undefined => {
    if (!dateOfBirth) return undefined;
    const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    if (isNaN(dob.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // Helper function to format date
  const formatDateForDisplay = (date: Date | string | null | undefined): string => {
    if (!date) return new Date().toISOString().split('T')[0];
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
    return dateObj.toISOString().split('T')[0];
  };

  // Get recent prescriptions (last 3)
  const recentPrescriptions = documentsData?.documents
    ?.filter(doc => doc.type === 'prescription')
    .slice(0, 3)
    .map(doc => ({
      name: doc.title,
      date: formatDateForDisplay(doc.date || doc.createdAt),
    })) || [];

  // Get recent lab reports (last 2)
  const recentLabReports = documentsData?.documents
    ?.filter(doc => doc.type === 'lab')
    .slice(0, 2)
    .map(doc => ({
      type: doc.title,
      date: formatDateForDisplay(doc.date || doc.createdAt),
    })) || [];

  // Extract emergency card data or use defaults from user profile
  const emergencyCard = emergencyData?.card;
  const user = userProfileData?.user;

  // Pre-populate with user profile data if emergency card doesn't exist
  const patientName = emergencyCard?.patientName || user?.name || '';
  const bloodGroup = emergencyCard?.bloodGroup || user?.bloodGroup || '';
  const address = emergencyCard?.address || user?.address || '';
  const age = emergencyCard?.age || calculateAge(user?.dateOfBirth);
  
  // Use emergency card data or defaults
  const allergies = emergencyCard?.allergies || '';
  const chronicConditions = emergencyCard?.chronicConditions || '';
  const currentMedications = emergencyCard?.currentMedications || '';
  
  // Generate patient ID from user ID or use default
  const patientId = emergencyCard?.id?.substring(0, 13) || user?.id?.substring(0, 13) || '2025-RBH-0213';

  // Get the first active nominee or use defaults
  const activeNominee = nomineesData?.nominees?.find(n => n.status === 'active') || null;
  const nomineeName = activeNominee?.name || 'No nominee added';
  const nomineeRelation = activeNominee?.relationship || 'Add nominee';
  const nomineePhone = activeNominee?.phone || '';
  const nomineeAccessScope = activeNominee?.scope === 'emergency-only' 
    ? 'Emergency Card Only' 
    : activeNominee?.scope === 'emergency-limited'
    ? 'Emergency + Limited Documents'
    : 'No access';

  if (emergencyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading emergency card...</p>
        </div>
      </div>
    );
  }

  return (
    <EmergencyCardScreen
      patientId={patientId}
      patientName={patientName}
      bloodGroup={bloodGroup}
      allergies={allergies}
      chronicConditions={chronicConditions}
      currentMedications={currentMedications}
      age={age}
      address={address}
      nomineeName={nomineeName}
      nomineeRelation={nomineeRelation}
      nomineePhone={nomineePhone}
      nomineeAccessScope={nomineeAccessScope}
      recentPrescriptions={recentPrescriptions}
      recentLabReports={recentLabReports}
      qrCodeDataURL={emergencyCard?.qrCodeDataURL}
      qrUrl={emergencyCard?.qrUrl}
      onBack={handleBack}
      onManageNominee={handleManageNominee}
      onSave={handleSave}
    />
  );
}
