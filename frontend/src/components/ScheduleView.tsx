'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ViewMode, Event, DayData } from '@/types/schedule';
import { getDaysInMonth, getWeekDays, getDayData, getMonthsInYear } from '@/utils/dateUtils';
import { exportEventsToICS } from '@/utils/icsUtils';
import { usePlanner } from '@/contexts/PlannerContext';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { YearView } from './YearView';
import AppDialog from './AppDialog';

interface ScheduleViewProps {
  events?: Event[];
  onEventMove?: (eventId: string, newStart: Date) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ events = [], onEventMove }) => {
  const { userId } = usePlanner();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<DayData[]>(getWeekDays(currentDate));
  const [daysInMonth, setDaysInMonth] = useState<DayData[]>(getDaysInMonth(currentDate));
  const [dayData, setDayData] = useState<DayData>(getDayData(currentDate));
  const [monthsInYear, setMonthsInYear] = useState(getMonthsInYear(currentDate.getFullYear()));
  const [eventList, setEventList] = useState<Event[]>(events);
  const [dialog, setDialog] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    setEventList(events);
  }, [events]);

  const updateDate = (newDate: Date) => {
    setCurrentDate(newDate);
    setWeekDays(getWeekDays(newDate));
    setDaysInMonth(getDaysInMonth(newDate));
    setDayData(getDayData(newDate));
    setMonthsInYear(getMonthsInYear(newDate.getFullYear()));
  };

  const handlePreviousPeriod = useCallback(() => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'daily':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    updateDate(newDate);
  }, [currentDate, viewMode]);

  const handleNextPeriod = useCallback(() => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'daily':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    updateDate(newDate);
  }, [currentDate, viewMode]);

  const handleToday = useCallback(() => {
    updateDate(new Date());
  }, []);

  const handleExportICS = useCallback(() => {
    exportEventsToICS(eventList, '11planner-schedule.ics');
  }, [eventList]);

  const handleSubscribe = useCallback(() => {
    if (!userId) {
      setDialog({
        isOpen: true,
        title: 'Login required',
        message: 'Please log in to sync your calendar.',
      });
      return;
    }
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const webcalUrl = backendUrl.replace(/^https?:\/\//, 'webcal://') + `/api/schedule-blocks/${userId}/calendar.ics`;
    window.open(webcalUrl, '_blank', 'noopener,noreferrer');
  }, [userId]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleEventMove = useCallback(
    (eventId: string, newStart: Date) => {
      setEventList((prev) =>
        prev.map((eventItem) => {
          if (eventItem.id !== eventId) {
            return eventItem;
          }
          const startTime = new Date(eventItem.start).getTime();
          const endTime = new Date(eventItem.end).getTime();
          const durationMs = Math.max(endTime - startTime, 0);
          const updatedStart = new Date(newStart);
          const updatedEnd = new Date(updatedStart.getTime() + durationMs);
          return { ...eventItem, start: updatedStart, end: updatedEnd };
        })
      );
      if (onEventMove) {
        onEventMove(eventId, newStart);
      }
    },
    [onEventMove]
  );

  return (
    <div className="flex flex-col h-full rounded-3xl overflow-hidden border border-white/50 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_22px_65px_-38px_rgba(15,23,42,0.55)]">
      {/* Header */}
      <div className="border-b border-white/60 dark:border-slate-700/70 bg-gradient-to-r from-white/80 via-white/70 to-emerald-50/60 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-800/80 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Planning View</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Schedule</h1>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleSubscribe}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-500 border border-sky-400/50 rounded-xl hover:brightness-105 transition flex items-center gap-2 shadow-sm"
              title="Add this calendar directly to macOS Calendar or Outlook"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              Subscribe (Live)
            </button>
            <button
              onClick={handleExportICS}
              className="px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/45 transition-colors flex items-center gap-2"
              title="Download backup file"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white/90 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-600 transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* View mode buttons */}
        <div className="inline-flex gap-2 p-1.5 mb-5 rounded-2xl bg-white/75 dark:bg-slate-800/70 border border-white/70 dark:border-slate-700/70 shadow-sm">
          <button
            onClick={() => handleViewModeChange('daily')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
              viewMode === 'daily'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => handleViewModeChange('weekly')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
              viewMode === 'weekly'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => handleViewModeChange('monthly')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
              viewMode === 'monthly'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => handleViewModeChange('yearly')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
              viewMode === 'yearly'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Year
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between rounded-2xl border border-white/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 px-3 py-2">
          <button
            onClick={handlePreviousPeriod}
            className="px-3 py-1 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            ← Previous
          </button>
          <span className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
            {viewMode === 'daily' && currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {viewMode === 'weekly' && `Week of ${weekDays[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {viewMode === 'monthly' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewMode === 'yearly' && currentDate.getFullYear()}
          </span>
          <button
            onClick={handleNextPeriod}
            className="px-3 py-1 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white/55 dark:bg-slate-900/55">
        {viewMode === 'daily' && (
          <DayView dayData={dayData} events={eventList} onEventMove={handleEventMove} />
        )}
        {viewMode === 'weekly' && (
          <WeekView weekDays={weekDays} events={eventList} onEventMove={handleEventMove} />
        )}
        {viewMode === 'monthly' && (
          <MonthView daysInMonth={daysInMonth} events={eventList} onEventMove={handleEventMove} />
        )}
        {viewMode === 'yearly' && (
          <YearView year={currentDate.getFullYear()} monthsData={monthsInYear} events={eventList} />
        )}
      </div>
      <AppDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        onClose={() => setDialog({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
};
