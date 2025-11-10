/**
 * Medication Service
 * Business logic for medication management, timing parsing, and reminder generation
 */

import { type Medication } from "@shared/schema";

/**
 * Parse frequency text and return default timing array
 * @param frequencyText - Frequency description (e.g., "twice daily", "3 times a day")
 * @returns Array of default times in HH:MM format
 */
export function parseFrequency(frequencyText: string): string[] {
  const normalized = frequencyText.toLowerCase().trim();
  
  // Common patterns
  if (normalized.includes('once daily') || normalized.includes('once a day') || normalized.includes('daily')) {
    return ['08:00'];
  }
  
  if (normalized.includes('twice daily') || normalized.includes('twice a day') || normalized.includes('two times')) {
    return ['08:00', '20:00'];
  }
  
  if (normalized.includes('three times') || normalized.includes('3 times') || normalized.includes('thrice')) {
    return ['08:00', '14:00', '20:00'];
  }
  
  if (normalized.includes('four times') || normalized.includes('4 times')) {
    return ['08:00', '12:00', '18:00', '22:00'];
  }
  
  // Morning only
  if (normalized.includes('morning') && !normalized.includes('evening') && !normalized.includes('afternoon')) {
    return ['08:00'];
  }
  
  // Evening only
  if (normalized.includes('evening') && !normalized.includes('morning') && !normalized.includes('afternoon')) {
    return ['20:00'];
  }
  
  // Night/bedtime
  if (normalized.includes('night') || normalized.includes('bedtime') || normalized.includes('before sleep')) {
    return ['22:00'];
  }
  
  // Default to once daily if no pattern matches
  return ['08:00'];
}

/**
 * Generate default timing based on frequency
 * @param frequency - Frequency description
 * @returns Array of default times in HH:MM format
 */
export function generateDefaultTiming(frequency: string): string[] {
  return parseFrequency(frequency);
}

/**
 * Generate reminders for a medication for the next 7 days (or until endDate if set)
 * @param medication - Medication object
 * @returns Array of reminder objects with scheduledTime
 */
export function generateReminders(medication: Medication): Array<{ scheduledTime: Date }> {
  const reminders: Array<{ scheduledTime: Date }> = [];
  
  // Parse timing array (stored as JSON string)
  let timingArray: string[] = [];
  try {
    timingArray = JSON.parse(medication.timing);
  } catch {
    // If not valid JSON, treat as single time string
    timingArray = [medication.timing];
  }
  
  if (timingArray.length === 0) {
    return reminders;
  }
  
  const startDate = new Date(medication.startDate);
  const endDate = medication.endDate ? new Date(medication.endDate) : null;
  
  // Generate reminders for next 7 days, or until endDate if it's sooner
  const daysToGenerate = endDate && endDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ? Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 7;
  
  const now = new Date();
  
  for (let day = 0; day < daysToGenerate; day++) {
    const reminderDate = new Date(now);
    reminderDate.setDate(reminderDate.getDate() + day);
    reminderDate.setHours(0, 0, 0, 0);
    
    // Skip if reminder date is before start date
    if (reminderDate < startDate) {
      continue;
    }
    
    // Skip if reminder date is after end date
    if (endDate && reminderDate > endDate) {
      break;
    }
    
    // Create a reminder for each time in the timing array
    for (const timeStr of timingArray) {
      // Validate time string
      if (!timeStr || typeof timeStr !== 'string') {
        continue;
      }
      
      const parts = timeStr.split(':');
      if (parts.length !== 2) {
        continue;
      }
      
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);
      
      if (isNaN(hours) || isNaN(minutes)) {
        continue;
      }
      
      const scheduledTime = new Date(reminderDate);
      scheduledTime.setHours(hours, minutes || 0, 0, 0);
      
      // Only add reminders for future times
      if (scheduledTime > now) {
        reminders.push({ scheduledTime });
      }
    }
  }
  
  return reminders;
}

/**
 * Regenerate reminders for a medication
 * This deletes existing pending reminders and creates new ones
 * @param medication - Medication object
 * @returns Array of reminder objects with scheduledTime
 */
export function regenerateReminders(medication: Medication): Array<{ scheduledTime: Date }> {
  // Generate new reminders
  return generateReminders(medication);
}

