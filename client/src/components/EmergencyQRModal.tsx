/**
 * Emergency QR Modal Component
 * Modal for displaying expanded QR code view
 */

import { X, Share2, Download } from 'lucide-react';
import { shareQRCode } from '@/utils/emergencyPrint';

type EmergencyQRModalProps = {
  qrCodeDataURL: string;
  qrUrl: string;
  patientId: string;
  onClose: () => void;
};

export const EmergencyQRModal = ({
  qrCodeDataURL,
  qrUrl,
  patientId,
  onClose,
}: EmergencyQRModalProps) => {
  const handleShare = async () => {
    try {
      await shareQRCode(qrCodeDataURL);
    } catch (error) {
      console.error('Failed to share QR code:', error);
      alert('Failed to share QR code. Please try downloading it instead.');
    }
  };

  const handleDownload = async () => {
    try {
      await shareQRCode(qrCodeDataURL);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      alert('Failed to download QR code.');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="qr-modal-overlay"
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="qr-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900" data-testid="qr-modal-title">
            Emergency QR Code
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
            data-testid="button-close-qr-modal"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-4">
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4">
            <img 
              src={qrCodeDataURL} 
              alt="Emergency QR Code" 
              className="w-[300px] h-[300px]"
              data-testid="qr-code-image"
            />
          </div>
          
          <p className="text-xs text-gray-500 font-mono mb-2" data-testid="text-patient-id">
            ID: {patientId}
          </p>
          
          <p className="text-sm text-gray-600 text-center mb-4 max-w-[300px]" data-testid="text-qr-instructions">
            Scan this QR code in emergencies to view critical medical information. No login required.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            data-testid="button-share-qr"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors"
            data-testid="button-download-qr"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            This QR code works offline and can be scanned by anyone to view your emergency information.
          </p>
        </div>
      </div>
    </div>
  );
};

