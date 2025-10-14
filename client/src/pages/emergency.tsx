import { useLocation } from 'wouter';
import { EmergencyCardScreen } from '@/components/EmergencyCardScreen';

type PatientData = {
  patientName: string;
  bloodGroup: string;
  allergies: string;
  chronicConditions: string;
  currentMedications: string;
  age: number;
  address: string;
};

export default function EmergencyPage() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation('/home');
  };

  const handlePrintShare = () => {
    console.log('Print/Share emergency card');
    alert('Print/Share feature coming soon!');
  };

  const handleManageNominee = () => {
    setLocation('/nominee-management');
  };

  const handleQRTap = () => {
    console.log('QR code tapped');
    alert('QR code expanded view coming soon!');
  };

  const handleSave = (data: PatientData) => {
    console.log('Patient data saved:', data);
    // In a real app, this would save to backend/storage
  };

  return (
    <EmergencyCardScreen
      onBack={handleBack}
      onPrintShare={handlePrintShare}
      onManageNominee={handleManageNominee}
      onQRTap={handleQRTap}
      onSave={handleSave}
    />
  );
}
