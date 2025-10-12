import { MediLockerAuthPage } from '@/components/MediLockerAuthPage';
import { useLocation } from 'wouter';
import { featureFlags } from '@/config/featureFlags';

export default function AuthPage() {
  const [, setLocation] = useLocation();

  const handleContinueWithOTP = (phoneNumber: string) => {
    if (!featureFlags.auth.phoneOTP) {
      alert('Phone OTP authentication is currently disabled');
      return;
    }
    
    console.log('📱 Continue with OTP for phone:', phoneNumber);
    
    if (featureFlags.screens.otp) {
      // Navigate to OTP screen when it's implemented
      setLocation('/otp');
    } else {
      // OTP screen not yet implemented
      alert(`OTP will be sent to ${phoneNumber}\n\n(OTP screen coming soon)`);
    }
  };

  const handleContinueWithABHA = () => {
    if (!featureFlags.auth.abhaId) {
      alert('ABHA ID authentication is currently disabled');
      return;
    }
    
    console.log('🏥 Continue with ABHA ID');
    alert('ABHA ID authentication\n\n(ABHA screen coming soon)');
  };

  const handleContinueAsGuest = () => {
    if (!featureFlags.auth.guest) {
      alert('Guest mode is currently disabled');
      return;
    }
    
    console.log('👤 Continue as guest');
    
    if (featureFlags.screens.home) {
      // Navigate directly to home when implemented
      setLocation('/home');
    } else {
      alert('Guest mode\n\n(Guest flow coming soon)');
    }
  };

  const handleContinueWithEmail = () => {
    if (!featureFlags.auth.email) {
      alert('Email authentication is currently disabled');
      return;
    }
    
    console.log('📧 Continue with email');
    alert('Email authentication\n\n(Email screen coming soon)');
  };

  return (
    <MediLockerAuthPage
      onContinueWithOTP={featureFlags.auth.phoneOTP ? handleContinueWithOTP : undefined}
      onContinueWithABHA={featureFlags.auth.abhaId ? handleContinueWithABHA : undefined}
      onContinueAsGuest={featureFlags.auth.guest ? handleContinueAsGuest : undefined}
      onContinueWithEmail={featureFlags.auth.email ? handleContinueWithEmail : undefined}
    />
  );
}
