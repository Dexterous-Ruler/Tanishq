import { useState } from 'react';
import { ArrowLeft, Edit, Share2, User, Droplet, AlertCircle, Heart, Pill, Calendar, MapPin, Phone, FileText, FlaskConical, Globe, X, Save } from 'lucide-react';

type EmergencyCardScreenProps = {
  patientId?: string;
  patientName?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  dateOfBirth?: string;
  age?: number;
  address?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineePhone?: string;
  nomineeAccessScope?: string;
  recentPrescriptions?: Array<{
    name: string;
    date: string;
  }>;
  recentLabReports?: Array<{
    type: string;
    date: string;
  }>;
  onBack?: () => void;
  onPrintShare?: () => void;
  onManageNominee?: () => void;
  onQRTap?: () => void;
  onSave?: (data: PatientData) => void;
};

type PatientData = {
  patientName: string;
  bloodGroup: string;
  allergies: string;
  chronicConditions: string;
  currentMedications: string;
  age: number;
  address: string;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const EmergencyCardScreen = (props: EmergencyCardScreenProps) => {
  const {
    patientId = '2025-RBH-0213',
    patientName: initialPatientName = 'Rudraksh Bharti',
    bloodGroup: initialBloodGroup = 'B+',
    allergies: initialAllergies = 'Penicillin',
    chronicConditions: initialChronicConditions = 'Diabetes Type 2',
    currentMedications: initialCurrentMedications = 'Metformin',
    dateOfBirth = '1990-05-15',
    age: initialAge = 34,
    address: initialAddress = 'Mumbai, Maharashtra',
    nomineeName = 'Amit Bharti',
    nomineeRelation = 'Brother',
    nomineePhone = '+91 98765 43210',
    nomineeAccessScope = 'Emergency Card / Full Record',
    recentPrescriptions = [{
      name: 'Metformin 500mg - Morning & Evening',
      date: '2025-01-15'
    }, {
      name: 'Aspirin 75mg - Once Daily',
      date: '2025-01-10'
    }, {
      name: 'Vitamin D3 - Weekly',
      date: '2025-01-05'
    }],
    recentLabReports = [{
      type: 'Blood Panel - Complete',
      date: '2025-01-12'
    }, {
      type: 'HbA1c Test',
      date: '2024-12-20'
    }],
    onBack = () => console.log('Back clicked'),
    onPrintShare = () => console.log('Print/Share clicked'),
    onManageNominee = () => console.log('Manage nominee clicked'),
    onQRTap = () => console.log('QR tapped'),
    onSave = (data) => console.log('Save clicked', data)
  } = props;

  // State for patient data
  const [patientName, setPatientName] = useState(initialPatientName);
  const [bloodGroup, setBloodGroup] = useState(initialBloodGroup);
  const [allergies, setAllergies] = useState(initialAllergies);
  const [chronicConditions, setChronicConditions] = useState(initialChronicConditions);
  const [currentMedications, setCurrentMedications] = useState(initialCurrentMedications);
  const [age, setAge] = useState(initialAge);
  const [address, setAddress] = useState(initialAddress);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<PatientData>({
    patientName: patientName,
    bloodGroup: bloodGroup,
    allergies: allergies,
    chronicConditions: chronicConditions,
    currentMedications: currentMedications,
    age: age,
    address: address
  });

  const handleEditClick = () => {
    setEditForm({
      patientName,
      bloodGroup,
      allergies,
      chronicConditions,
      currentMedications,
      age,
      address
    });
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    setPatientName(editForm.patientName);
    setBloodGroup(editForm.bloodGroup);
    setAllergies(editForm.allergies);
    setChronicConditions(editForm.chronicConditions);
    setCurrentMedications(editForm.currentMedications);
    setAge(editForm.age);
    setAddress(editForm.address);
    onSave(editForm);
    setIsEditModalOpen(false);
  };

  const handleCancel = () => {
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-white overflow-y-auto" data-testid="emergency-card-screen">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between" data-testid="header">
        <button 
          onClick={onBack} 
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors" 
          aria-label="Go back"
          data-testid="button-back"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900" data-testid="text-page-title">Emergency Card</h1>
        <button 
          onClick={handleEditClick} 
          className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors" 
          aria-label="Edit emergency card"
          data-testid="button-edit"
        >
          <Edit className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6 pb-8">
        {/* Emergency QR Section */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 flex flex-col items-center border border-red-100" data-testid="qr-section">
          <p className="text-sm text-gray-700 text-center mb-4 max-w-[280px]" data-testid="text-qr-description">
            Scan this QR in emergencies to view critical information
          </p>
          
          {/* QR Code Placeholder */}
          <div 
            onClick={onQRTap} 
            className="bg-white rounded-xl p-4 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            data-testid="button-qr-code"
          >
            <div className="w-[200px] h-[200px] bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* QR Code pattern */}
                <rect x="20" y="20" width="60" height="60" fill="#000" />
                <rect x="30" y="30" width="40" height="40" fill="#fff" />
                <rect x="40" y="40" width="20" height="20" fill="#000" />
                
                <rect x="120" y="20" width="60" height="60" fill="#000" />
                <rect x="130" y="30" width="40" height="40" fill="#fff" />
                <rect x="140" y="40" width="20" height="20" fill="#000" />
                
                <rect x="20" y="120" width="60" height="60" fill="#000" />
                <rect x="30" y="130" width="40" height="40" fill="#fff" />
                <rect x="40" y="140" width="20" height="20" fill="#000" />
                
                {/* Random QR pattern */}
                <rect x="90" y="30" width="10" height="10" fill="#000" />
                <rect x="110" y="30" width="10" height="10" fill="#000" />
                <rect x="90" y="50" width="10" height="10" fill="#000" />
                <rect x="90" y="70" width="10" height="10" fill="#000" />
                <rect x="110" y="70" width="10" height="10" fill="#000" />
                <rect x="30" y="90" width="10" height="10" fill="#000" />
                <rect x="50" y="90" width="10" height="10" fill="#000" />
                <rect x="70" y="90" width="10" height="10" fill="#000" />
                <rect x="90" y="90" width="10" height="10" fill="#000" />
                <rect x="110" y="90" width="10" height="10" fill="#000" />
                <rect x="130" y="90" width="10" height="10" fill="#000" />
                <rect x="150" y="90" width="10" height="10" fill="#000" />
                <rect x="170" y="90" width="10" height="10" fill="#000" />
                <rect x="90" y="110" width="10" height="10" fill="#000" />
                <rect x="130" y="110" width="10" height="10" fill="#000" />
                <rect x="150" y="110" width="10" height="10" fill="#000" />
                <rect x="170" y="110" width="10" height="10" fill="#000" />
                <rect x="90" y="130" width="10" height="10" fill="#000" />
                <rect x="110" y="130" width="10" height="10" fill="#000" />
                <rect x="90" y="150" width="10" height="10" fill="#000" />
                <rect x="130" y="150" width="10" height="10" fill="#000" />
                <rect x="150" y="150" width="10" height="10" fill="#000" />
                <rect x="90" y="170" width="10" height="10" fill="#000" />
                <rect x="110" y="170" width="10" height="10" fill="#000" />
                <rect x="130" y="170" width="10" height="10" fill="#000" />
                <rect x="170" y="170" width="10" height="10" fill="#000" />
              </svg>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 mt-3 font-mono" data-testid="text-patient-id">ID: {patientId}</p>
          <p className="text-xs text-green-700 mt-2 font-medium" data-testid="text-offline-notice">✓ Works even offline — no login required</p>
          
          <button 
            onClick={onPrintShare} 
            className="mt-4 px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg font-medium text-sm hover:bg-red-50 transition-colors flex items-center gap-2"
            data-testid="button-print-share"
          >
            <Share2 className="w-4 h-4" />
            Print / Share as Image
          </button>
        </div>

        {/* Patient Info Section */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-5" data-testid="patient-info-section">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" data-testid="text-section-title-patient">
            <User className="w-5 h-5 text-red-600" />
            Patient Info
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <User className="w-3 h-3" />
                Name
              </p>
              <p className="text-sm font-semibold text-gray-900" data-testid="text-patient-name">{patientName}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <Droplet className="w-3 h-3" />
                Blood Group
              </p>
              <p className="text-sm font-semibold text-red-600" data-testid="text-blood-group">{bloodGroup}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Allergies
              </p>
              <p className="text-sm font-semibold text-orange-600" data-testid="text-allergies">{allergies}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <Heart className="w-3 h-3" />
                Chronic Conditions
              </p>
              <p className="text-sm font-semibold text-gray-900" data-testid="text-chronic-conditions">{chronicConditions}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <Pill className="w-3 h-3" />
                Current Medications
              </p>
              <p className="text-sm font-semibold text-gray-900" data-testid="text-current-medications">{currentMedications}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Age
              </p>
              <p className="text-sm font-semibold text-gray-900" data-testid="text-age">{age} years</p>
            </div>
            
            <div className="space-y-1 col-span-2">
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Address
              </p>
              <p className="text-sm font-semibold text-gray-900" data-testid="text-address">{address}</p>
            </div>
          </div>
        </div>

        {/* Recent Medical Data Section */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-5" data-testid="medical-data-section">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" data-testid="text-section-title-medical">
            <FileText className="w-5 h-5 text-blue-600" />
            Recent Medical Data
          </h2>
          
          {/* Recent Prescriptions */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2" data-testid="text-prescriptions-title">Last 3 Prescriptions</h3>
            <div className="space-y-2">
              {recentPrescriptions.map((prescription, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-start bg-blue-50 rounded-lg p-3 border border-blue-100"
                  data-testid={`prescription-item-${index}`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900" data-testid={`text-prescription-name-${index}`}>{prescription.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 ml-2" data-testid={`text-prescription-date-${index}`}>{formatDate(prescription.date)}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Lab Reports */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2" data-testid="text-lab-reports-title">Last 2 Lab Reports</h3>
            <div className="space-y-2">
              {recentLabReports.map((report, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center bg-purple-50 rounded-lg p-3 border border-purple-100"
                  data-testid={`lab-report-item-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-600" />
                    <p className="text-sm font-medium text-gray-900" data-testid={`text-lab-report-type-${index}`}>{report.type}</p>
                  </div>
                  <p className="text-xs text-gray-500" data-testid={`text-lab-report-date-${index}`}>{formatDate(report.date)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nominee Section */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-5" data-testid="nominee-section">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2" data-testid="text-section-title-nominee">
            <User className="w-5 h-5 text-green-600" />
            Nominee Access
          </h2>
          
          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-gray-900" data-testid="text-nominee-name">{nomineeName}</p>
                <p className="text-xs text-gray-500" data-testid="text-nominee-relation">{nomineeRelation}</p>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full" data-testid="badge-nominee-status">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-green-700">Active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium" data-testid="text-nominee-phone">{nomineePhone}</p>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Access Scope:</p>
              <p className="text-sm font-medium text-gray-900" data-testid="text-nominee-scope">{nomineeAccessScope}</p>
            </div>
            
            <button 
              onClick={onManageNominee} 
              className="w-full mt-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
              data-testid="button-manage-nominee"
            >
              Manage Nominee
            </button>
          </div>
          
          <p className="text-xs text-gray-600 mt-3 text-center" data-testid="text-nominee-note">
            Nominee can also access your emergency details if needed
          </p>
        </div>

        {/* Hindi Localization Info Banner */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4" data-testid="hindi-info-banner">
          <p className="text-xs text-blue-800 font-medium mb-2 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Available in Hindi:
          </p>
          <p className="text-xs text-blue-700">आपातकालीन कार्ड • इस क्यूआर को स्कैन करें • ऑफ़लाइन में भी काम करता है</p>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" data-testid="edit-modal">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900" data-testid="text-edit-modal-title">Edit Patient Info</h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
                data-testid="button-close-edit-modal"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-name">
                  <User className="w-4 h-4 inline mr-1" />
                  Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editForm.patientName}
                  onChange={(e) => setEditForm({ ...editForm, patientName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                  data-testid="input-edit-name"
                />
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-blood-group">
                  <Droplet className="w-4 h-4 inline mr-1" />
                  Blood Group
                </label>
                <select
                  id="edit-blood-group"
                  value={editForm.bloodGroup}
                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="select-edit-blood-group"
                >
                  {bloodGroupOptions.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-allergies">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Allergies
                </label>
                <input
                  id="edit-allergies"
                  type="text"
                  value={editForm.allergies}
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Penicillin, Peanuts"
                  data-testid="input-edit-allergies"
                />
              </div>

              {/* Chronic Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-chronic-conditions">
                  <Heart className="w-4 h-4 inline mr-1" />
                  Chronic Conditions
                </label>
                <input
                  id="edit-chronic-conditions"
                  type="text"
                  value={editForm.chronicConditions}
                  onChange={(e) => setEditForm({ ...editForm, chronicConditions: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Diabetes Type 2, Hypertension"
                  data-testid="input-edit-chronic-conditions"
                />
              </div>

              {/* Current Medications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-medications">
                  <Pill className="w-4 h-4 inline mr-1" />
                  Current Medications
                </label>
                <input
                  id="edit-medications"
                  type="text"
                  value={editForm.currentMedications}
                  onChange={(e) => setEditForm({ ...editForm, currentMedications: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Metformin, Aspirin"
                  data-testid="input-edit-medications"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-age">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Age
                </label>
                <input
                  id="edit-age"
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter age"
                  min="0"
                  max="150"
                  data-testid="input-edit-age"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-address">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Address
                </label>
                <textarea
                  id="edit-address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address"
                  rows={3}
                  data-testid="input-edit-address"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                data-testid="button-cancel-edit"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                data-testid="button-save-edit"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
