'use client';

import React from 'react';
import { DayData, Event } from '@/types/schedule';
import { getColorClass } from '@/utils/dateUtils';

interface MonthViewProps {
  daysInMonth: DayData[];
  events: Event[];
}

export const MonthView: React.FC<MonthViewProps> = ({ daysInMonth, events }) => {
  const monthDate = daysInMonth[15]?.date || new Date();
  const monthYear = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <h2 className="text-2xl font-bold text-gray-900">Month View</h2>
        <p className="text-lg text-gray-600">{monthYear}</p>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-gray-100 p-2 text-center font-semibold text-gray-700"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {daysInMonth.map((day) => {
            const dayEvents = events.filter((e) => {
              const eventDate = new Date(e.start);
              return eventDate.toDateString() === day.date.toDateString();
            });

            return (
              <div
                key={day.date.toString()}
                className={`min-h-24 p-2 ${
                  day.isCurrentMonth
                    ? day.isToday
                      ? 'bg-blue-50'
                      : 'bg-white'
                    : 'bg-gray-50'
                }`}
              >
                <p
                  className={`text-sm font-semibold mb-1 ${
                    day.isCurrentMonth
                      ? day.isToday
                        ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                        : 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {day.dayNumber}
                </p>

                {/* Events preview */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate border-l-2 ${getColorClass(event.color)}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-xs text-gray-600">+{dayEvents.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
