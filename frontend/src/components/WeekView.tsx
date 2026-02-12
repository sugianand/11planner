'use client';

import React from 'react';
import { DayData, Event } from '@/types/schedule';
import { formatDateRange, getColorClass } from '@/utils/dateUtils';

interface WeekViewProps {
  weekDays: DayData[];
  events: Event[];
  onEventMove?: (eventId: string, newStart: Date) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({ weekDays, events, onEventMove }) => {
  const [activeSlot, setActiveSlot] = React.useState<string | null>(null);
  const [dragGhost, setDragGhost] = React.useState<{
    title: string;
    color?: Event['color'];
    x: number;
    y: number;
    durationLabel: string;
    timeRangeLabel: string;
  } | null>(null);
  const slots = Array.from({ length: 48 }, (_, i) => ({
    hour: Math.floor(i / 2),
    minute: i % 2 === 0 ? 0 : 30,
  }));
  const startDate = weekDays[0]?.date || new Date();
  const endDate = weekDays[6]?.date || new Date();

  const formatDurationLabel = (start: Date, end: Date) => {
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
  };

  const formatTimeRangeLabel = (start: Date, end: Date) =>
    `${start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })} - ${end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    eventItem: Event
  ) => {
    event.dataTransfer.setData('text/plain', eventItem.id);
    event.dataTransfer.effectAllowed = 'move';
    setDragGhost({
      title: eventItem.title,
      color: eventItem.color,
      x: event.clientX,
      y: event.clientY,
      durationLabel: formatDurationLabel(new Date(eventItem.start), new Date(eventItem.end)),
      timeRangeLabel: formatTimeRangeLabel(new Date(eventItem.start), new Date(eventItem.end)),
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
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    day: DayData,
    hour: number,
    minute: number
  ) => {
    event.preventDefault();
    const eventId = event.dataTransfer.getData('text/plain');
    if (!eventId || !onEventMove) {
      return;
    }
    const newStart = new Date(day.date);
    newStart.setHours(hour, minute, 0, 0);
    onEventMove(eventId, newStart);
    setActiveSlot(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, slotKey: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setActiveSlot(slotKey);
  };

  const handleDragLeave = (slotKey: string) => {
    setActiveSlot((prev) => (prev === slotKey ? null : prev));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 dark:border-slate-700 p-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Week View</h2>
        <p className="text-lg text-gray-600 dark:text-slate-300">{formatDateRange(startDate, endDate)}</p>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex min-w-full">
          {/* Time column */}
          <div className="w-20 flex-shrink-0">
            <div className="bg-gray-50 dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700">
              {/* Empty header space to align with day headers */}
              <div className="h-20 border-b-2 border-gray-200 dark:border-slate-700"></div>
              {slots.map((slot) => (
                <div
                  key={`${slot.hour}-${slot.minute}`}
                  className="h-10 py-2 px-4 text-sm font-semibold text-gray-700 dark:text-slate-200 border-b border-gray-100 dark:border-slate-700"
                >
                  {slot.minute === 0
                    ? new Date(0, 0, 0, slot.hour).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        hour12: true,
                      })
                    : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Days columns */}
          <div className="flex flex-1">
            {weekDays.map((day) => (
              <div key={day.date.toString()} className="flex-1 border-r border-gray-200 dark:border-slate-700 last:border-r-0">
                {/* Day header */}
                <div className="bg-white dark:bg-slate-800 border-b-2 border-gray-200 dark:border-slate-700 p-2 text-center h-20 flex flex-col justify-center">
                  <p className={`font-semibold ${day.isToday ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                    {day.dayOfWeek}
                  </p>
                  <p className={`text-sm ${day.isToday ? 'bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'text-gray-600 dark:text-slate-300'}`}>
                    {day.dayNumber}
                  </p>
                </div>

                {/* Time slots */}
                <div>
                  {slots.map((slot) => {
                    const dayEvents = events.filter((e) => {
                      const eventDate = new Date(e.start);
                      return (
                        eventDate.toDateString() === day.date.toDateString() &&
                        eventDate.getHours() === slot.hour &&
                        eventDate.getMinutes() === slot.minute
                      );
                    });
                    const slotKey = `${day.date.toDateString()}-${slot.hour}-${slot.minute}`;
                    const isActive = activeSlot === slotKey;

                    return (
                      <div
                        key={slotKey}
                        className={`h-10 border-b border-gray-100 dark:border-slate-700 p-1 relative transition-colors ${
                          isActive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-white dark:bg-slate-800'
                        }`}
                        onDragOver={(event) => handleDragOver(event, slotKey)}
                        onDragLeave={() => handleDragLeave(slotKey)}
                        onDrop={(event) => handleDrop(event, day, slot.hour, slot.minute)}
                      >
                        {isActive && (
                          <div className="absolute right-1 top-1 text-[10px] text-emerald-700 bg-emerald-100 rounded px-1">
                            {new Date(0, 0, 0, slot.hour, slot.minute).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        )}
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-1 rounded text-xs font-semibold border-l-2 cursor-move ${getColorClass(event.color)}`}
                            draggable
                            onDragStart={(dragEvent) => handleDragStart(dragEvent, event)}
                            onDrag={handleDrag}
                            onDragEnd={handleDragEnd}
                            title="Drag to move"
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
