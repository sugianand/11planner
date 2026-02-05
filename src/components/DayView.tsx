'use client';

import React from 'react';
import { DayData, Event } from '@/types/schedule';
import { getColorClass } from '@/utils/dateUtils';

interface DayViewProps {
  dayData: DayData;
  events: Event[];
}

export const DayView: React.FC<DayViewProps> = ({ dayData, events }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <h2 className="text-2xl font-bold text-gray-900">{dayData.dayOfWeek}</h2>
        <p className="text-lg text-gray-600">{dayData.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {hours.map((hour) => {
          const hourEvents = events.filter((e) => {
            const startHour = new Date(e.start).getHours();
            return startHour === hour;
          });

          return (
            <div key={hour} className="flex border-b border-gray-100">
              <div className="w-20 flex-shrink-0 py-2 px-4 bg-gray-50 text-sm font-semibold text-gray-700 border-r border-gray-100">
                {new Date(0, 0, 0, hour).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
              </div>
              <div className="flex-1 py-2 px-4 relative min-h-20">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`mb-2 p-2 rounded border-l-4 ${getColorClass(event.color)}`}
                  >
                    <p className="font-semibold text-sm">{event.title}</p>
                    {event.description && (
                      <p className="text-xs opacity-75">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
