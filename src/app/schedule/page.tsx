'use client';

import { ScheduleView } from '@/components/ScheduleView';
import { Event } from '@/types/schedule';

// Sample events for demo
const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly sync with the team',
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(11, 0, 0, 0)),
    color: 'blue',
  },
  {
    id: '2',
    title: 'Lunch',
    start: new Date(new Date().setHours(12, 0, 0, 0)),
    end: new Date(new Date().setHours(13, 0, 0, 0)),
    color: 'green',
  },
  {
    id: '3',
    title: 'Project Review',
    description: 'Review project progress',
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(15, 30, 0, 0)),
    color: 'purple',
  },
];

export default function SchedulePage() {
  return (
    <main className="w-full h-screen">
      <ScheduleView events={sampleEvents} />
    </main>
  );
}
