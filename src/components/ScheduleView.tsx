'use client';

import React, { useState, useCallback } from 'react';
import { ViewMode, Event, DayData } from '@/types/schedule';
import { getDaysInMonth, getWeekDays, getDayData, getMonthsInYear } from '@/utils/dateUtils';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { YearView } from './YearView';

interface ScheduleViewProps {
  events?: Event[];
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ events = [] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<DayData[]>(getWeekDays(currentDate));
  const [daysInMonth, setDaysInMonth] = useState<DayData[]>(getDaysInMonth(currentDate));
  const [dayData, setDayData] = useState<DayData>(getDayData(currentDate));
  const [monthsInYear, setMonthsInYear] = useState(getMonthsInYear(currentDate.getFullYear()));

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

  const updateDate = (newDate: Date) => {
    setCurrentDate(newDate);
    setWeekDays(getWeekDays(newDate));
    setDaysInMonth(getDaysInMonth(newDate));
    setDayData(getDayData(newDate));
    setMonthsInYear(getMonthsInYear(newDate.getFullYear()));
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <div className="flex gap-2">
            <button
              onClick={handleToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Today
            </button>
          </div>
        </div>

        {/* View mode buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => handleViewModeChange('daily')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => handleViewModeChange('weekly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => handleViewModeChange('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => handleViewModeChange('yearly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Year
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousPeriod}
            className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            ← Previous
          </button>
          <span className="text-lg font-semibold text-gray-900">
            {viewMode === 'daily' && currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {viewMode === 'weekly' && `Week of ${weekDays[0]?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {viewMode === 'monthly' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewMode === 'yearly' && currentDate.getFullYear()}
          </span>
          <button
            onClick={handleNextPeriod}
            className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'daily' && <DayView dayData={dayData} events={events} />}
        {viewMode === 'weekly' && <WeekView weekDays={weekDays} events={events} />}
        {viewMode === 'monthly' && <MonthView daysInMonth={daysInMonth} events={events} />}
        {viewMode === 'yearly' && <YearView year={currentDate.getFullYear()} monthsData={monthsInYear} events={events} />}
      </div>
    </div>
  );
};
