import { DayData, TimeSlot } from '@/types/schedule';

export function getTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const time = new Date();
    time.setHours(hour, 0, 0, 0);
    slots.push({
      time: time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      hour,
      events: [],
    });
  }
  return slots;
}

export function getDaysInMonth(date: Date): DayData[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days: DayData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const isCurrentMonth = currentDate.getMonth() === month;
    const isToday =
      currentDate.getTime() === today.getTime();

    days.push({
      date: currentDate,
      dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: currentDate.getDate(),
      isCurrentMonth,
      isToday,
      events: [],
    });
  }

  return days;
}

export function getWeekDays(date: Date): DayData[] {
  const currentDate = new Date(date);
  const day = currentDate.getDay();
  const diff = currentDate.getDate() - day;
  const sunday = new Date(currentDate.setDate(diff));

  const days: DayData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(sunday);
    currentDay.setDate(currentDay.getDate() + i);
    const isToday = currentDay.getTime() === today.getTime();

    days.push({
      date: currentDay,
      dayOfWeek: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: currentDay.getDate(),
      isCurrentMonth: true,
      isToday,
      events: [],
    });
  }

  return days;
}

export function getDayData(date: Date): DayData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = new Date(date).setHours(0, 0, 0, 0) === today.getTime();

  return {
    date: new Date(date),
    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
    dayNumber: date.getDate(),
    isCurrentMonth: true,
    isToday,
    events: [],
  };
}

export function formatDateRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleString('en-US', { month: 'short' });
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startMonth === endMonth && startYear === endYear) {
    return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${startYear}`;
  } else if (startYear === endYear) {
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${startYear}`;
  } else {
    return `${startMonth} ${startDate.getDate()}, ${startYear} - ${endMonth} ${endDate.getDate()}, ${endYear}`;
  }
}

export function getColorClass(color?: string): string {
  const colorMap: { [key: string]: string } = {
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    pink: 'bg-pink-100 text-pink-800 border-pink-300',
  };
  return colorMap[color || 'blue'] || colorMap.blue;
}

export function getMonthsInYear(year: number): { month: number; name: string; daysInMonth: DayData[] }[] {
  const months = [];
  for (let month = 0; month < 12; month++) {
    const date = new Date(year, month, 1);
    months.push({
      month,
      name: date.toLocaleDateString('en-US', { month: 'long' }),
      daysInMonth: getDaysInMonth(date),
    });
  }
  return months;
}
