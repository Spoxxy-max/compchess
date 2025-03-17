
import { TimeControl, TimeControlOption } from './chessTypes';

/**
 * Converts a time control string or object to seconds
 * 
 * @param timeControl The time control as string or TimeControl object
 * @returns Time in seconds
 */
export const getTimeControlInSeconds = (timeControl: string | TimeControl): number => {
  // If timeControl is a string, it's a preset like "blitz", "rapid", etc.
  if (typeof timeControl === 'string') {
    switch (timeControl) {
      case 'blitz':
        return 3 * 60; // 3 minutes
      case 'rapid':
        return 10 * 60; // 10 minutes
      case 'classical':
        return 30 * 60; // 30 minutes
      default:
        return 5 * 60; // Default to 5 minutes
    }
  }
  
  // If it's a TimeControl object, use its startTime property
  return timeControl.startTime;
};
