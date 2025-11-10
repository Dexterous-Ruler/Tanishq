import { Edit, Trash2, Clock, Calendar, Pill, Sparkles, FileText } from 'lucide-react';
import { type Medication } from '@/lib/api/medications';
import { useDeleteMedication } from '@/hooks/useMedications';
import { useLocation } from 'wouter';

interface MedicationCardProps {
  medication: Medication;
  onEdit: () => void;
}

export function MedicationCard({ medication, onEdit }: MedicationCardProps) {
  const [, setLocation] = useLocation();
  const deleteMedication = useDeleteMedication();

  // Parse timing array
  let timingArray: string[] = [];
  try {
    if (medication.timing) {
      const parsed = JSON.parse(medication.timing);
      timingArray = Array.isArray(parsed) ? parsed : [medication.timing];
    }
  } catch {
    if (medication.timing) {
      timingArray = [medication.timing];
    }
  }

  // Filter out invalid time strings and ensure they're valid
  timingArray = timingArray.filter((time) => {
    if (!time || typeof time !== 'string') return false;
    const parts = time.split(':');
    return parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]));
  });

  // Format time for display
  const formatTime = (timeStr: string) => {
    if (!timeStr || typeof timeStr !== 'string') {
      return 'Invalid time';
    }
    
    const parts = timeStr.split(':');
    if (parts.length !== 2) {
      return timeStr; // Return original if format is wrong
    }
    
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    
    if (isNaN(hours) || isNaN(minutes)) {
      return timeStr; // Return original if not a number
    }
    
    const hour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${medication.name}?`)) {
      try {
        await deleteMedication.mutateAsync(medication.id);
      } catch (error) {
        console.error('Failed to delete medication:', error);
      }
    }
  };

  const handleViewSource = () => {
    if (medication.sourceDocumentId) {
      setLocation(`/document/${medication.sourceDocumentId}`);
    }
  };

  const getStatusBadge = () => {
    switch (medication.status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
            Active
          </span>
        );
      case 'stopped':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            Stopped
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-50 rounded-lg">
              <Pill className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-sm">{medication.name}</h3>
                {getStatusBadge()}
                {medication.source === 'ai' && (
                  <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="ml-9 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="font-medium">Dosage:</span>
              <span>{medication.dosage}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="font-medium">Frequency:</span>
              <span>{medication.frequency}</span>
            </div>
            {timingArray.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">Times:</span>
                <span>{timingArray.filter(t => t).map(formatTime).join(', ')}</span>
              </div>
            )}
            {medication.instructions && (
              <div className="text-xs text-gray-600">
                <span className="font-medium">Instructions:</span> {medication.instructions}
              </div>
            )}
            {medication.endDate && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">Ends:</span>
                <span>{new Date(medication.endDate).toLocaleDateString()}</span>
              </div>
            )}
            {medication.source === 'ai' && medication.sourceDocumentId && (
              <button
                onClick={handleViewSource}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                View source document
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Edit medication"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete medication"
            disabled={deleteMedication.isPending}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

