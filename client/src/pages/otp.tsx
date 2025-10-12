import { MediLockerOtpVerificationScreen } from '@/components/MediLockerOtpVerificationScreen';
import { useLocation } from 'wouter';
import { featureFlags } from '@/config/featureFlags';

export default function OTPPage() {
  const [, setLocation] = useLocation();

  // TODO: Get actual phone number from auth screen (via location state or context)
  const phoneNumber = '+91 98765xxx10';

  const handleVerify = (otp: string) => {
    console.log('✅ OTP verified:', otp);
    
    if (featureFlags.screens.onboarding) {
      // Navigate to onboarding when implemented
      setLocation('/onboarding');
    } else {
      // Onboarding screen not yet implemented
      alert(`OTP verified successfully!\n\n(Onboarding screen coming soon)`);
    }
  };

  const handleChangeNumber = () => {
    console.log('🔄 Change phone number requested');
    // Navigate back to auth screen
    setLocation('/auth');
  };

  const handleResendOtp = () => {
    console.log('📲 Resend OTP requested');
    alert('OTP has been resent to your phone number');
  };

  const handleGetCall = () => {
    console.log('📞 Get call requested');
    alert('You will receive a verification call shortly');
  };

  const handleBack = () => {
    console.log('⬅️ Back to auth screen');
    setLocation('/auth');
  };

  const handlePrivacyClick = () => {
    console.log('🔒 Privacy policy clicked');
    alert('Privacy Policy\n\n(Privacy screen coming soon)');
  };

  const handleTermsClick = () => {
    console.log('📜 Terms clicked');
    alert('Terms of Service\n\n(Terms screen coming soon)');
  };

  const handleHelpClick = () => {
    console.log('❓ Help clicked');
    alert('Help & Support\n\n(Help screen coming soon)');
  };

  return (
    <MediLockerOtpVerificationScreen
      phoneNumber={phoneNumber}
      onVerify={handleVerify}
      onChangeNumber={handleChangeNumber}
      onResendOtp={handleResendOtp}
      onGetCall={handleGetCall}
      onBack={handleBack}
      onPrivacyClick={handlePrivacyClick}
      onTermsClick={handleTermsClick}
      onHelpClick={handleHelpClick}
    />
  );
}
