'use client';

// Displays a full-year calendar overview with per-day event markers.

import React from 'react';
import { DayData, Event } from '@/types/schedule';

interface YearViewProps {
  year: number;
  monthsData: { month: number; name: string; daysInMonth: DayData[] }[];
  events: Event[];
}

export const YearView: React.FC<YearViewProps> = ({ year, monthsData, events }) => {
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Filters non-class events that occur on a specific date.
  const getEventsForDay = (date: Date) => {
    return events.filter((e) => {
      const eventDate = new Date(e.start);
      return eventDate.toDateString() === date.toDateString() && e.kind !== 'class';
    });
  };

  return (
    <div className="flex flex-col h-full bg-white/40 dark:bg-slate-900/30">
      <div className="sticky top-0 z-10 border-b border-white/70 dark:border-slate-700/70 bg-white/85 dark:bg-slate-900/85 backdrop-blur px-4 py-3">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Year View</h2>
        <p className="text-base text-slate-600 dark:text-slate-300">{year}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {monthsData.map((monthData) => {
            return (
              <div
                key={monthData.month}
                className="bg-white/85 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3 shadow-sm"
              >
                {/* Month header */}
                <h3 className="text-center font-semibold text-slate-900 dark:text-white mb-2">
                  {monthData.name}
                </h3>

                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {weekDays.map((day, idx) => (
                    <div
                      key={idx}
                      className="text-center text-xs font-medium text-slate-500 dark:text-slate-400"
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
                              ? 'text-white rounded-full font-bold'
                              : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-md'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-500 rounded-md'
                        }`}
                        style={day.isCurrentMonth && day.isToday ? { backgroundColor: 'var(--theme-accent-strong)' } : undefined}
                      >
                        {day.dayNumber}
                        {hasEvents && day.isCurrentMonth && !day.isToday && (
                          <>
                            <div
                              className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                              style={{ backgroundColor: 'var(--theme-accent-strong)' }}
                            ></div>
                            {dayEvents.length > 1 && (
                              <div
                                className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full px-1 text-[9px] leading-[14px] text-center font-semibold"
                                style={{
                                  color: 'var(--theme-accent-strong)',
                                  backgroundColor: 'var(--theme-accent-soft)',
                                }}
                                title={`${dayEvents.length} tasks`}
                              >
                                {dayEvents.length > 9 ? '9+' : dayEvents.length}
                              </div>
                            )}
                          </>
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
