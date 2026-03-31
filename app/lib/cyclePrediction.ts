// Utility functions
export const daysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const average = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / numbers.length);
};

export interface CyclePrediction {
  nextPeriod: Date;
  ovulationDate: Date;
  fertileStart: Date;
  fertileEnd: Date;
  avgCycleLength: number;
  periodDuration: number;
  lutealPhaseLength: number;
}

export function predictNextPeriod(
  periodDates: Date[],
  periodDurations: number[]
): CyclePrediction {
  // Calculate cycle lengths (days between period start dates)
  let cycleLengths: number[] = [];
  for (let i = 1; i < periodDates.length; i++) {
    let diff = daysBetween(periodDates[i], periodDates[i - 1]);
    cycleLengths.push(diff);
  }

  // Calculate average cycle length
  let avgCycleLength = average(cycleLengths);
  
  // If no cycle data, use standard 28 days
  if (avgCycleLength === 0) {
    avgCycleLength = 28;
  }

  // Calculate average period duration
  let avgPeriodDuration = average(periodDurations);
  if (avgPeriodDuration === 0) {
    avgPeriodDuration = 5; // Default 5 days
  }

  // Get last period start date
  let lastPeriod = periodDates[periodDates.length - 1];

  // Predict next period
  let nextPeriod = addDays(lastPeriod, avgCycleLength);

  // Ovulation typically occurs 14 days before next period
  let ovulationDate = addDays(nextPeriod, -14);

  // Fertile window: 5 days before ovulation to 1 day after
  let fertileStart = addDays(ovulationDate, -5);
  let fertileEnd = addDays(ovulationDate, 1);

  // Luteal phase length (typically 14 days)
  let lutealPhaseLength = 14;

  return {
    nextPeriod,
    ovulationDate,
    fertileStart,
    fertileEnd,
    avgCycleLength,
    periodDuration: avgPeriodDuration,
    lutealPhaseLength
  };
}

// Helper to format date for display
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

// Helper to get days until a date
export const daysUntil = (targetDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  const diff = targetDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Check if a date is in a range
export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end;
};

// Get current cycle day
export const getCurrentCycleDay = (lastPeriodStart: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastPeriodStart.setHours(0, 0, 0, 0);
  return daysBetween(today, lastPeriodStart) + 1;
};
