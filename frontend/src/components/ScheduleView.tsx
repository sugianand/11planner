'use client';

// Coordinates schedule controls and switches between day, week, month, and year views.

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ViewMode, Event, DayData } from '@/types/schedule';
import { getDaysInMonth, getWeekDays, getDayData, getMonthsInYear } from '@/utils/dateUtils';
import { exportEventsToICS } from '@/utils/icsUtils';
import { usePlanner } from '@/contexts/PlannerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { YearView } from './YearView';

interface ScheduleViewProps {
  events?: Event[];
  onEventMove?: (eventId: string, newStart: Date) => void | boolean | Promise<void | boolean>;
  colorBy?: "priority" | "course";
  onColorByChange?: (colorBy: "priority" | "course") => void;
  errorMessage?: string | null;
  onDismissError?: () => void;
  onShowDialog?: (title: string, message: string) => void;
}

function getCalendarFeedBaseUrl(): string | null {
  const configuredCalendarBase = process.env.NEXT_PUBLIC_CALENDAR_FEED_BASE_URL?.trim();
  if (configuredCalendarBase && /^https?:\/\//i.test(configuredCalendarBase)) {
    return configuredCalendarBase.replace(/\/$/, '');
  }

  const configuredApiBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredApiBase && /^https?:\/\//i.test(configuredApiBase)) {
    return configuredApiBase.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(host);
    if (isLocalHost) {
      return 'http://127.0.0.1:8000';
    }
  }

  return null;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ events = [], onEventMove, colorBy = "priority", onColorByChange, errorMessage = null, onDismissError, onShowDialog }) => {
  const { userId, courses, loadCourses } = usePlanner();
  const { effectiveTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<DayData[]>(getWeekDays(currentDate));
  const [daysInMonth, setDaysInMonth] = useState<DayData[]>(getDaysInMonth(currentDate));
  const [dayData, setDayData] = useState<DayData>(getDayData(currentDate));
  const [monthsInYear, setMonthsInYear] = useState(getMonthsInYear(currentDate.getFullYear()));
  const [eventList, setEventList] = useState<Event[]>(events);
  const accentSoftStyle = {
    backgroundColor: 'var(--theme-accent-soft)',
    borderColor: 'var(--theme-accent)',
    color: 'var(--theme-accent-strong)',
  } as const;
  const accentStrongStyle = {
    backgroundColor: 'var(--theme-accent-strong)',
    borderColor: 'var(--theme-accent-strong)',
    color: '#ffffff',
  } as const;

  useEffect(() => {
    setEventList(events);
  }, [events]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Parses HH:MM, HH:MM:SS, and AM/PM time strings into numeric parts.
  const parseTime = (value?: string | null) => {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    const isoMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!isoMatch) {
      return null;
    }
    let hour = Number(isoMatch[1]);
    const minute = Number(isoMatch[2]);
    const second = Number(isoMatch[3] || '0');
    const meridiem = isoMatch[4]?.toLowerCase();

    if (meridiem) {
      if (meridiem === 'pm' && hour !== 12) hour += 12;
      if (meridiem === 'am' && hour === 12) hour = 0;
    }
    return { hour, minute, second };
  };

  // Normalizes course weekday text into canonical weekday names.
  const parseCourseDays = (value?: string | null) => {
    const text = (value || '').trim();
    if (!text) return [] as string[];

    const rawTokens = text.replace(/[,/]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);

    // matches backend parse_course_weekdays logic
    const expandedTokens: string[] = [];
    for (const token of rawTokens) {
      const t = token.toLowerCase();
      if (t === 'mwf' || t === 'm/w/f') {
        expandedTokens.push('mon', 'wed', 'fri');
      } else if (t === 'tth' || t === 'tu/th' || t === 't/th' || t === 'tr') {
        expandedTokens.push('tue', 'thu');
      } else {
        expandedTokens.push(t);
      }
    }

    const dayLookup: Record<string, string> = {
      monday: 'Monday', mon: 'Monday', m: 'Monday',
      tuesday: 'Tuesday', tue: 'Tuesday', tues: 'Tuesday', t: 'Tuesday',
      wednesday: 'Wednesday', wed: 'Wednesday', w: 'Wednesday',
      thursday: 'Thursday', thu: 'Thursday', thurs: 'Thursday', r: 'Thursday',
      friday: 'Friday', fri: 'Friday', f: 'Friday',
      saturday: 'Saturday', sat: 'Saturday', s: 'Saturday',
      sunday: 'Sunday', sun: 'Sunday', u: 'Sunday',
    };

    const dayMatches = expandedTokens
      .map((token) => dayLookup[token])
      .filter((day): day is string => Boolean(day));

    return Array.from(new Set(dayMatches));
  };

  // Builds class/lab occurrences for the currently visible date range.
  const classEvents = useMemo(() => {
    const rangeStart =
      viewMode === 'daily'
        ? new Date(currentDate)
        : viewMode === 'weekly'
          ? new Date(weekDays[0]?.date || currentDate)
          : viewMode === 'monthly'
            ? new Date(daysInMonth[0]?.date || currentDate)
            : new Date(currentDate.getFullYear(), 0, 1);
    const rangeEnd =
      viewMode === 'daily'
        ? new Date(currentDate)
        : viewMode === 'weekly'
          ? new Date(weekDays[6]?.date || currentDate)
          : viewMode === 'monthly'
            ? new Date(daysInMonth[daysInMonth.length - 1]?.date || currentDate)
            : new Date(currentDate.getFullYear(), 11, 31);

    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    const occurrences: Event[] = [];

    courses.forEach((course) => {
      const startTime = parseTime(course.startTime);
      const endTime = parseTime(course.endTime);
      const courseDays = parseCourseDays(course.courseDate);
      if (!startTime || !endTime || courseDays.length === 0) {
        return;
      }

      const daySet = new Set(courseDays.map((day) => day.toLowerCase()));
      const cursor = new Date(rangeStart);
      while (cursor <= rangeEnd) {
        const dayName = cursor.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (daySet.has(dayName)) {
          const startDate = new Date(cursor);
          startDate.setHours(startTime.hour, startTime.minute, startTime.second, 0);
          const endDate = new Date(cursor);
          endDate.setHours(endTime.hour, endTime.minute, endTime.second, 0);
          if (endDate <= startDate) {
            endDate.setDate(endDate.getDate() + 1);
          }
          occurrences.push({
            id: `class-${course.id}-${cursor.toISOString().slice(0, 10)}`,
            title: course.code ? `${course.code}` : course.name,
            description: course.name,
            start: startDate,
            end: endDate,
            color: 'indigo',
            kind: 'class',
          });
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      if (course.hasLab && course.labDay && course.labStartTime && course.labEndTime) {
        const labStart = parseTime(course.labStartTime);
        const labEnd = parseTime(course.labEndTime);
        const labDays = parseCourseDays(course.labDay);
        if (labStart && labEnd && labDays.length > 0) {
          const labDaySet = new Set(labDays.map((day) => day.toLowerCase()));
          const labCursor = new Date(rangeStart);
          while (labCursor <= rangeEnd) {
            const dayName = labCursor.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            if (labDaySet.has(dayName)) {
              const startDate = new Date(labCursor);
              startDate.setHours(labStart.hour, labStart.minute, labStart.second, 0);
              const endDate = new Date(labCursor);
              endDate.setHours(labEnd.hour, labEnd.minute, labEnd.second, 0);
              if (endDate <= startDate) {
                endDate.setDate(endDate.getDate() + 1);
              }
              occurrences.push({
                id: `lab-${course.id}-${labCursor.toISOString().slice(0, 10)}`,
                title: `${course.code || course.name} Lab`,
                description: course.name,
                start: startDate,
                end: endDate,
                color: 'cyan',
                kind: 'class',
              });
            }
            labCursor.setDate(labCursor.getDate() + 1);
          }
        }
      }
    });

    return occurrences;
  }, [courses, currentDate, viewMode, weekDays, daysInMonth]);

  const displayEvents = useMemo(() => [...eventList, ...classEvents], [eventList, classEvents]);

  // Recomputes derived day/week/month/year data when navigation changes date.
  const updateDate = (newDate: Date) => {
    setCurrentDate(newDate);
    setWeekDays(getWeekDays(newDate));
    setDaysInMonth(getDaysInMonth(newDate));
    setDayData(getDayData(newDate));
    setMonthsInYear(getMonthsInYear(newDate.getFullYear()));
  };

  // Moves the visible period backward based on current view mode.
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

  // Moves the visible period forward based on current view mode.
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

  // Jumps the calendar to today's date.
  const handleToday = useCallback(() => {
    updateDate(new Date());
  }, []);

  // Exports the currently displayed study events to an ICS file.
  const handleExportICS = useCallback(() => {
    exportEventsToICS(eventList, '11planner-schedule.ics');
  }, [eventList]);

  // Opens a webcal subscription URL, with a macOS localhost fallback dialog.
  const handleSubscribe = useCallback(() => {
    if (!userId) {
      onShowDialog?.('Login required', 'Please log in to sync your calendar.');
      return;
    }

    const backendUrl = getCalendarFeedBaseUrl();
    if (!backendUrl) {
      onShowDialog?.(
        'Calendar feed is not configured',
        'Subscribe (Live) needs a public backend URL. Set NEXT_PUBLIC_API_URL (or NEXT_PUBLIC_CALENDAR_FEED_BASE_URL) to your deployed backend URL, then redeploy the frontend.'
      );
      return;
    }

    const httpUrl = `${backendUrl}/api/schedule-blocks/${encodeURIComponent(userId)}/calendar.ics`;
    const webcalUrl = httpUrl.replace(/^https?:\/\//, 'webcal://');

    const openWebcalUrl = (url: string) => {
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (opened) {
        return true;
      }
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    };

    openWebcalUrl(webcalUrl);
  }, [userId, onShowDialog]);

  // Switches the active calendar view mode.
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Applies drag-drop event moves after optional parent validation.
  const handleEventMove = useCallback(
    async (eventId: string, newStart: Date) => {
      let shouldApplyMove = true;
      if (onEventMove) {
        const result = await onEventMove(eventId, newStart);
        if (result === false) {
          shouldApplyMove = false;
        }
      }

      if (!shouldApplyMove) {
        return;
      }

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
    },
    [onEventMove]
  );

  const isMonthView = viewMode === 'monthly';

  return (
    <div className={`flex flex-col ${isMonthView ? 'h-auto' : 'h-[895px]'} rounded-3xl overflow-hidden border border-white/50 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_22px_65px_-38px_rgba(15,23,42,0.55)]`}>
      {/* Header */}
      <div
        className="border-b border-white/60 dark:border-slate-700/70 p-5"
        style={{
          backgroundImage:
            effectiveTheme === 'dark'
              ? 'linear-gradient(to right, color-mix(in srgb, var(--theme-accent-soft) 25%, rgba(15,23,42,0.82)), rgba(15,23,42,0.74), rgba(15,23,42,0.66))'
              : 'linear-gradient(to right, color-mix(in srgb, var(--theme-accent-soft) 60%, white), rgba(255,255,255,0.72), color-mix(in srgb, var(--theme-accent-soft) 45%, transparent))',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Planning View</p>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Schedule</h1>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleSubscribe}
              className="px-4 py-2 text-sm font-semibold text-white border rounded-xl hover:brightness-105 transition flex items-center gap-2 shadow-sm"
              style={accentStrongStyle}
              title="Add this calendar directly to macOS Calendar or Outlook"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              Subscribe (Live)
            </button>
            <button
              onClick={handleExportICS}
              className="px-4 py-2 text-sm font-semibold border rounded-xl transition-colors flex items-center gap-2"
              style={accentSoftStyle}
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
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleViewModeChange('daily')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                viewMode === 'daily'
                  ? ''
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
              style={viewMode === 'daily' ? accentStrongStyle : undefined}
            >
              Day
            </button>
            <button
              onClick={() => handleViewModeChange('weekly')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                viewMode === 'weekly'
                  ? ''
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
              style={viewMode === 'weekly' ? accentStrongStyle : undefined}
            >
              Week
            </button>
            <button
              onClick={() => handleViewModeChange('monthly')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                viewMode === 'monthly'
                  ? ''
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
              style={viewMode === 'monthly' ? accentStrongStyle : undefined}
            >
              Month
            </button>
            <button
              onClick={() => handleViewModeChange('yearly')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                viewMode === 'yearly'
                  ? ''
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
              style={viewMode === 'yearly' ? accentStrongStyle : undefined}
            >
              Year
            </button>
          </div>

          <select
            value={colorBy}
            onChange={(e) => onColorByChange?.(e.target.value as "priority" | "course")}
            className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
          >
            <option value="priority">Color by Priority</option>
            <option value="course">Color by Course</option>
          </select>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between rounded-2xl border border-white/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/60 px-3 py-2">
          <button
            onClick={handlePreviousPeriod}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
          >
            <span aria-hidden="true">←</span>
            <span>Previous</span>
          </button>
          <span className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
            {viewMode === 'daily' && currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {viewMode === 'weekly' && `Week of ${weekDays[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {viewMode === 'monthly' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewMode === 'yearly' && currentDate.getFullYear()}
          </span>
          <button
            onClick={handleNextPeriod}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
          >
            <span>Next</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`${isMonthView ? 'overflow-visible p-2 md:p-3' : 'flex-1 overflow-hidden'} bg-white/55 dark:bg-slate-900/55`}>
        {viewMode === 'daily' && (
          <DayView dayData={dayData} events={displayEvents} onEventMove={handleEventMove} errorMessage={errorMessage} onDismissError={onDismissError} />
        )}
        {viewMode === 'weekly' && (
          <WeekView weekDays={weekDays} events={displayEvents} onEventMove={handleEventMove} errorMessage={errorMessage} onDismissError={onDismissError} />
        )}
        {viewMode === 'monthly' && (
          <MonthView daysInMonth={daysInMonth} events={displayEvents} onEventMove={handleEventMove} errorMessage={errorMessage} onDismissError={onDismissError} />
        )}
        {viewMode === 'yearly' && (
          <YearView year={currentDate.getFullYear()} monthsData={monthsInYear} events={displayEvents} />
        )}
      </div>
    </div>
  );
};
