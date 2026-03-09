'use client';

import React from 'react';
import { DayData, Event } from '@/types/schedule';

interface YearViewProps {
  year: number;
  monthsData: { month: number; name: string; daysInMonth: DayData[] }[];
  events: Event[];
}

export const YearView: React.FC<YearViewProps> = ({ year, monthsData, events }) => {
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getEventsForDay = (date: Date) => {
    return events.filter((e) => {
      const eventDate = new Date(e.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 dark:border-slate-700 p-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Year View</h2>
        <p className="text-lg text-gray-600 dark:text-slate-300">{year}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {monthsData.map((monthData) => {
            return (
              <div
                key={monthData.month}
                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 shadow-sm"
              >
                {/* Month header */}
                <h3 className="text-center font-semibold text-gray-900 dark:text-white mb-2">
                  {monthData.name}
                </h3>

                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {weekDays.map((day, idx) => (
                    <div
                      key={idx}
                      className="text-center text-xs font-medium text-gray-500 dark:text-slate-400"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {monthData.daysInMonth.map((day) => {
                    const dayEvents = getEventsForDay(day.date);
                    const hasEvents = dayEvents.length > 0;

                    return (
                      <div
                        key={day.date.toString()}
                        className={`aspect-square flex items-center justify-center text-xs relative ${
                          day.isCurrentMonth
                            ? day.isToday
                              ? 'bg-emerald-600 text-white rounded-full font-bold'
                              : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded'
                            : 'bg-gray-50 dark:bg-slate-900 text-gray-300 dark:text-slate-500'
                        }`}
                      >
                        {day.dayNumber}
                        {hasEvents && day.isCurrentMonth && !day.isToday && (
                          <div className="absolute bottom-0.5 w-1 h-1 bg-emerald-500 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
