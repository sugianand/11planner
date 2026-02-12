'use client';

import React from 'react';
import { DayData, Event } from '@/types/schedule';
import { getColorClass } from '@/utils/dateUtils';

interface MonthViewProps {
  daysInMonth: DayData[];
  events: Event[];
  onEventMove?: (eventId: string, newStart: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({ daysInMonth, events, onEventMove }) => {
  const [activeDay, setActiveDay] = React.useState<string | null>(null);
  const [draggingEventId, setDraggingEventId] = React.useState<string | null>(null);
  const [dragGhost, setDragGhost] = React.useState<{
    title: string;
    color?: Event['color'];
    x: number;
    y: number;
    durationLabel: string;
    timeRangeLabel: string;
  } | null>(null);
  const monthDate = daysInMonth[15]?.date || new Date();
  const monthYear = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, eventId: string) => {
    event.dataTransfer.setData('text/plain', eventId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingEventId(eventId);
    const draggedEvent = events.find((item) => item.id === eventId);
    const durationLabel = draggedEvent
      ? (() => {
          const start = new Date(draggedEvent.start);
          const end = new Date(draggedEvent.end);
          const minutes = Math.max(Math.round((end.getTime() - start.getTime()) / 60000), 0);
          const hours = Math.floor(minutes / 60);
          const remainder = minutes % 60;
          if (hours > 0 && remainder > 0) {
            return `${hours}h ${remainder}m`;
          }
          if (hours > 0) {
            return `${hours}h`;
          }
          return `${remainder || 0}m`;
        })()
      : '30m';
    const timeRangeLabel = draggedEvent
      ? `${new Date(draggedEvent.start).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })} - ${new Date(draggedEvent.end).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}`
      : '9:00 AM - 9:30 AM';
    setDragGhost({
      title: draggedEvent?.title || 'Event',
      color: draggedEvent?.color,
      x: event.clientX,
      y: event.clientY,
      durationLabel,
      timeRangeLabel,
    });
  };

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    if (!dragGhost) {
      return;
    }
    if (event.clientX === 0 && event.clientY === 0) {
      return;
    }
    setDragGhost((prev) =>
      prev ? { ...prev, x: event.clientX, y: event.clientY } : prev
    );
  };

  const handleDragEnd = () => {
    setDragGhost(null);
    setDraggingEventId(null);
    setActiveDay(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, day: DayData) => {
    event.preventDefault();
    const eventId = event.dataTransfer.getData('text/plain');
    if (!eventId || !onEventMove) {
      return;
    }
    const originalEvent = events.find((item) => item.id === eventId);
    const newStart = new Date(day.date);
    if (originalEvent) {
      const originalStart = new Date(originalEvent.start);
      newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
    } else {
      newStart.setHours(9, 0, 0, 0);
    }
    onEventMove(eventId, newStart);
    setActiveDay(null);
    setDraggingEventId(null);
    setDragGhost(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, dayKey: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setActiveDay(dayKey);
  };

  const handleDragLeave = (dayKey: string) => {
    setActiveDay((prev) => (prev === dayKey ? null : prev));
  };

  const getDragTimeLabel = () => {
    if (!draggingEventId) {
      return '9:00 AM';
    }
    const draggedEvent = events.find((item) => item.id === draggingEventId);
    if (!draggedEvent) {
      return '9:00 AM';
    }
    return new Date(draggedEvent.start).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 dark:border-slate-700 p-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Month View</h2>
        <p className="text-lg text-gray-600 dark:text-slate-300">{monthYear}</p>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-slate-700">
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-gray-100 dark:bg-slate-700 p-2 text-center font-semibold text-gray-700 dark:text-slate-200"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-slate-700">
          {daysInMonth.map((day) => {
            const dayEvents = events.filter((e) => {
              const eventDate = new Date(e.start);
              return eventDate.toDateString() === day.date.toDateString();
            });

            const dayKey = day.date.toDateString();
            const isActive = activeDay === dayKey;

            return (
              <div
                key={dayKey}
                className={`min-h-24 p-2 transition-colors ${
                  day.isCurrentMonth
                    ? day.isToday
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'bg-white dark:bg-slate-800'
                    : 'bg-white dark:bg-slate-800'
                } ${isActive ? 'ring-2 ring-emerald-400 dark:ring-emerald-500' : ''}`}
                onDragOver={(event) => handleDragOver(event, dayKey)}
                onDragLeave={() => handleDragLeave(dayKey)}
                onDrop={(event) => handleDrop(event, day)}
              >
                {isActive && draggingEventId && (
                  <div className="mb-1 text-[10px] text-emerald-700 bg-emerald-100 rounded px-1 inline-block">
                    {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {getDragTimeLabel()}
                  </div>
                )}
                <p
                  className={`text-sm font-semibold mb-1 ${
                    day.isCurrentMonth
                      ? day.isToday
                        ? 'bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                        : 'text-gray-900 dark:text-white'
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
                      className={`text-xs p-1 rounded truncate border-l-2 cursor-move ${getColorClass(event.color)}`}
                      draggable
                      onDragStart={(dragEvent) => handleDragStart(dragEvent, event.id)}
                      onDrag={handleDrag}
                      onDragEnd={handleDragEnd}
                      title="Drag to move"
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-xs text-gray-600 dark:text-slate-300">+{dayEvents.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {dragGhost && (
        <div
          className={`fixed z-50 pointer-events-none px-2 py-1 rounded text-xs font-semibold border-l-2 shadow-lg opacity-90 drag-ghost ${getColorClass(
            dragGhost.color
          )}`}
          style={{ left: dragGhost.x + 12, top: dragGhost.y + 12 }}
        >
          {dragGhost.title}
          <div className="text-[10px] font-normal opacity-80">{dragGhost.durationLabel}</div>
          <div className="text-[10px] font-normal opacity-70">{dragGhost.timeRangeLabel}</div>
        </div>
      )}
    </div>
  );
};
