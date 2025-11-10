import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useMedication, useCreateMedication, useUpdateMedication } from '@/hooks/useMedications';
import { type CreateMedicationData } from '@/lib/api/medications';

interface MedicationModalProps {
  medicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const FREQUENCY_OPTIONS = [
  'once daily',
  'twice daily',
  'three times daily',
  'four times daily',
  'once in the morning',
  'once in the evening',
  'as needed',
];

export function MedicationModal({ medicationId, isOpen, onClose }: MedicationModalProps) {
  const { data: medicationData } = useMedication(medicationId);
  const createMedication = useCreateMedication();
  const updateMedication = useUpdateMedication();

  const [formData, setFormData] = useState<CreateMedicationData>({
    name: '',
    dosage: '',
    frequency: 'once daily',
    timing: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    instructions: '',
  });

  const [hasEndDate, setHasEndDate] = useState(false);
  const [customTiming, setCustomTiming] = useState<string[]>([]);
  const [useCustomTiming, setUseCustomTiming] = useState(false);

  // Load medication data when editing
  useEffect(() => {
    if (medicationData?.success && medicationData.medication) {
      const med = medicationData.medication;
      let timingArray: string[] = [];
      try {
        timingArray = JSON.parse(med.timing);
      } catch {
        timingArray = [med.timing];
      }

      setFormData({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        timing: timingArray,
        startDate: new Date(med.startDate).toISOString().split('T')[0],
        endDate: med.endDate ? new Date(med.endDate).toISOString().split('T')[0] : null,
        instructions: med.instructions || '',
      });
      setHasEndDate(!!med.endDate);
      setCustomTiming(timingArray);
      setUseCustomTiming(true);
    } else if (!medicationId) {
      // Reset form for new medication
      setFormData({
        name: '',
        dosage: '',
        frequency: 'once daily',
        timing: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        instructions: '',
      });
      setHasEndDate(false);
      setCustomTiming([]);
      setUseCustomTiming(false);
    }
  }, [medicationData, medicationId]);

  // Update custom timing when frequency changes
  useEffect(() => {
    if (!useCustomTiming) {
      // Generate default timing based on frequency
      const defaults: Record<string, string[]> = {
        'once daily': ['08:00'],
        'twice daily': ['08:00', '20:00'],
        'three times daily': ['08:00', '14:00', '20:00'],
        'four times daily': ['08:00', '12:00', '18:00', '22:00'],
        'once in the morning': ['08:00'],
        'once in the evening': ['20:00'],
        'as needed': [],
      };
      const defaultTiming = defaults[formData.frequency] || ['08:00'];
      setCustomTiming(defaultTiming);
    }
  }, [formData.frequency, useCustomTiming]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: CreateMedicationData = {
      ...formData,
      timing: useCustomTiming ? customTiming : undefined,
      endDate: hasEndDate ? (formData.endDate || null) : null,
    };

    try {
      if (medicationId) {
        await updateMedication.mutateAsync({ id: medicationId, data: submitData });
      } else {
        await createMedication.mutateAsync(submitData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save medication:', error);
    }
  };

  const addTimeSlot = () => {
    setCustomTiming([...customTiming, '08:00']);
  };

  const removeTimeSlot = (index: number) => {
    setCustomTiming(customTiming.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, time: string) => {
    const updated = [...customTiming];
    updated[index] = time;
    setCustomTiming(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {medicationId ? 'Edit Medication' : 'Add Medication'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Medication Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Paracetamol"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Dosage *
            </label>
            <input
              type="text"
              required
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., 500mg, 1 tablet"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Frequency *
            </label>
            <select
              required
              value={formData.frequency}
              onChange={(e) => {
                setFormData({ ...formData, frequency: e.target.value });
                setUseCustomTiming(false);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {FREQUENCY_OPTIONS.map((freq) => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 mb-1.5">
              <input
                type="checkbox"
                checked={useCustomTiming}
                onChange={(e) => setUseCustomTiming(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Set custom times</span>
            </label>
            {useCustomTiming && (
              <div className="space-y-2 mt-2">
                {customTiming.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {customTiming.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  + Add time
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Start Date *
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-1.5">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => {
                  setHasEndDate(e.target.checked);
                  if (!e.target.checked) {
                    setFormData({ ...formData, endDate: null });
                  }
                }}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Set end date</span>
            </label>
            {hasEndDate && (
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mt-2"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Instructions (optional)
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={2}
              placeholder="e.g., with food, before meals"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMedication.isPending || updateMedication.isPending}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {createMedication.isPending || updateMedication.isPending
                ? 'Saving...'
                : medicationId
                ? 'Update'
                : 'Add Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

