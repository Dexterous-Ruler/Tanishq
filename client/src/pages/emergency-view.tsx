/**
 * Emergency View Page
 * Public page for viewing emergency card via QR token (no authentication required)
 */

import { useRoute } from 'wouter';
import { useEmergencyCardByToken } from '@/hooks/useEmergency';
import { AlertCircle, User, Droplet, AlertTriangle, Heart, Pill, Calendar, MapPin } from 'lucide-react';

export default function EmergencyViewPage() {
  const [, params] = useRoute('/emergency/view/:token');
  const token = params?.token || '';
  
  const { data, isLoading, error } = useEmergencyCardByToken(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading emergency information...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.success || !data.card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Emergency Card Not Found</h1>
          <p className="text-gray-600">
            {error instanceof Error 
              ? error.message 
              : 'Invalid or expired QR code. Please scan a valid emergency card.'}
          </p>
        </div>
      </div>
    );
  }

  const card = data.card;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-red-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Emergency Medical Information</h1>
          </div>
          <p className="text-sm text-gray-600">This information is displayed for emergency medical purposes</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Patient Info Card */}
        <div className="bg-white rounded-2xl border-2 border-red-200 p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-red-600" />
            Patient Information
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <User className="w-3 h-3" />
                Name
              </p>
              <p className="text-base font-semibold text-gray-900">{card.patientName}</p>
            </div>
            
            {card.bloodGroup && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Droplet className="w-3 h-3" />
                  Blood Group
                </p>
                <p className="text-base font-semibold text-red-600">{card.bloodGroup}</p>
              </div>
            )}
            
            {card.age && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Age
                </p>
                <p className="text-base font-semibold text-gray-900">{card.age} years</p>
              </div>
            )}
            
            {card.address && (
              <div className="space-y-1 col-span-2">
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Address
                </p>
                <p className="text-base font-semibold text-gray-900">{card.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Critical Information */}
        {card.allergies && (
          <div className="bg-orange-50 rounded-2xl border-2 border-orange-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Allergies
            </h2>
            <p className="text-base font-semibold text-orange-900">{card.allergies}</p>
          </div>
        )}

        {card.chronicConditions && (
          <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-600" />
              Chronic Conditions
            </h2>
            <p className="text-base font-semibold text-blue-900">{card.chronicConditions}</p>
          </div>
        )}

        {card.currentMedications && (
          <div className="bg-purple-50 rounded-2xl border-2 border-purple-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-600" />
              Current Medications
            </h2>
            <p className="text-base font-semibold text-purple-900">{card.currentMedications}</p>
          </div>
        )}

        {/* Footer Note */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500">
            This emergency card was accessed via QR code scan. For more information, contact the patient or their emergency contact.
          </p>
        </div>
      </div>
    </div>
  );
}

