'use client';

import React from 'react';
import { DayData, Event } from '@/types/schedule';
import { formatDateRange, getColorClass } from '@/utils/dateUtils';

interface WeekViewProps {
  weekDays: DayData[];
  events: Event[];
}

export const WeekView: React.FC<WeekViewProps> = ({ weekDays, events }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const startDate = weekDays[0]?.date || new Date();
  const endDate = weekDays[6]?.date || new Date();

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <h2 className="text-2xl font-bold text-gray-900">Week View</h2>
        <p className="text-lg text-gray-600">{formatDateRange(startDate, endDate)}</p>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex min-w-full">
          {/* Time column */}
          <div className="w-20 flex-shrink-0">
            <div className="bg-gray-50 border-r border-gray-200">
              {/* Empty header space to align with day headers */}
              <div className="h-20 border-b-2 border-gray-200"></div>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-20 py-2 px-4 text-sm font-semibold text-gray-700 border-b border-gray-100"
                >
                  {new Date(0, 0, 0, hour).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                </div>
              ))}
            </div>
          </div>

          {/* Days columns */}
          <div className="flex flex-1">
            {weekDays.map((day) => (
              <div key={day.date.toString()} className="flex-1 border-r border-gray-200 last:border-r-0">
                {/* Day header */}
                <div className="bg-white border-b-2 border-gray-200 p-2 text-center h-20 flex flex-col justify-center">
                  <p className={`font-semibold ${day.isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day.dayOfWeek}
                  </p>
                  <p className={`text-sm ${day.isToday ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'text-gray-600'}`}>
                    {day.dayNumber}
                  </p>
                </div>

                {/* Time slots */}
                <div>
                  {hours.map((hour) => {
                    const dayEvents = events.filter((e) => {
                      const eventDate = new Date(e.start);
                      return (
                        eventDate.toDateString() === day.date.toDateString() &&
                        eventDate.getHours() === hour
                      );
                    });

                    return (
                      <div
                        key={`${day.date.toString()}-${hour}`}
                        className="h-20 border-b border-gray-100 p-1 relative"
                      >
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-1 rounded text-xs font-semibold border-l-2 ${getColorClass(event.color)}`}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
