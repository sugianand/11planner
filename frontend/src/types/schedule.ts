export type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'pink' | 'orange' | 'teal' | 'indigo' | 'cyan' | 'lime' | 'rose';
  kind?: 'study' | 'class';
}

export interface TimeSlot {
  time: string;
  hour: number;
  events: Event[];
}

export interface DayData {
  date: Date;
  dayOfWeek: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}
