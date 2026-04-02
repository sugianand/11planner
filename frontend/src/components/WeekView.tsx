'use client';

import React from 'react';
import { DayData, Event } from '@/types/schedule';
import { formatDateRange, getColorClass } from '@/utils/dateUtils';

interface WeekViewProps {
  weekDays: DayData[];
  events: Event[];
  onEventMove?: (eventId: string, newStart: Date) => void;
  errorMessage?: string | null;
  onDismissError?: () => void;
}

export const WeekView: React.FC<WeekViewProps> = ({ weekDays, events, onEventMove, errorMessage, onDismissError }) => {
  const [activeSlot, setActiveSlot] = React.useState<string | null>(null);
  const [draggingEventId, setDraggingEventId] = React.useState<string | null>(null);
  const [isErrorFading, setIsErrorFading] = React.useState(false);
  const SLOT_MINUTES = 15;
  const SLOT_HEIGHT_PX = 40;
  const slots = Array.from({ length: 96 }, (_, i) => ({
    hour: Math.floor(i / 4),
    minute: (i % 4) * 15,
  }));
  const startDate = weekDays[0]?.date || new Date();
  const endDate = weekDays[6]?.date || new Date();

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    eventItem: Event
  ) => {
    event.dataTransfer.setData('text/plain', eventItem.id);
    event.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => {
      setDraggingEventId(eventItem.id);
    });
  };

  const handleDragEnd = () => {
    setDraggingEventId(null);
    setActiveSlot(null);
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
    setDraggingEventId(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, slotKey: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setActiveSlot(slotKey);
  };

  const handleDragLeave = (slotKey: string) => {
    setActiveSlot((prev) => (prev === slotKey ? null : prev));
  };

  React.useEffect(() => {
    if (!errorMessage) {
      setIsErrorFading(false);
      return;
    }
    setIsErrorFading(false);
    const fadeTimer = setTimeout(() => {
      setIsErrorFading(true);
    }, 3200);
    return () => clearTimeout(fadeTimer);
  }, [errorMessage]);

  const getEventDurationMinutes = (eventItem: Event) => {
    const start = new Date(eventItem.start).getTime();
    const end = new Date(eventItem.end).getTime();
    return Math.max(Math.round((end - start) / 60000), 15);
  };

  const getEventTimeLabel = (eventItem: Event) => {
    const start = new Date(eventItem.start);
    const end = new Date(eventItem.end);
    return `${start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })} - ${end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 border-b border-white/70 dark:border-slate-700/70 bg-white/85 dark:bg-slate-900/85 backdrop-blur px-4 py-3">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Week View</h2>
        <p className="text-base text-slate-600 dark:text-slate-300">{formatDateRange(startDate, endDate)}</p>
        {errorMessage && (
          <div className="absolute right-4 top-4 z-30">
            <div
              className={`inline-flex max-w-[420px] items-center gap-2 rounded-md border border-red-200/70 bg-red-50/90 px-2 py-1 text-xs font-medium text-red-700 shadow-sm transition-opacity duration-700 dark:border-red-800/70 dark:bg-red-900/70 dark:text-red-200 ${
                isErrorFading ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={onDismissError}
                className="rounded px-1 leading-none hover:bg-red-100 dark:hover:bg-red-800/80"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-x-auto bg-white/40 dark:bg-slate-900/30">
        <div className="flex min-w-full">
          {/* Time column */}
          <div className="w-20 flex-shrink-0">
            <div className="bg-slate-50/85 dark:bg-slate-800/85 border-r border-slate-200/70 dark:border-slate-700/70">
              {/* Empty header space to align with day headers */}
              <div className="h-20 border-b-2 border-slate-200/70 dark:border-slate-700/70"></div>
              {slots.map((slot) => (
                <div
                  key={`${slot.hour}-${slot.minute}`}
                  className="h-10 py-2 px-4 text-sm font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200/60 dark:border-slate-700/70"
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
              <div key={day.date.toString()} className="flex-1 border-r border-slate-200/70 dark:border-slate-700/70 last:border-r-0">
                {/* Day header */}
                <div className="bg-white/85 dark:bg-slate-800/80 border-b-2 border-slate-200/70 dark:border-slate-700/70 p-2 text-center h-20 flex flex-col justify-center">
                  <p className={`font-semibold ${day.isToday ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-900 dark:text-white'}`}>
                    {day.dayOfWeek}
                  </p>
                  <p className={`text-sm ${day.isToday ? 'bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'text-slate-600 dark:text-slate-300'}`}>
                    {day.dayNumber}
                  </p>
                </div>

                {/* Time slots */}
                <div>
                  {slots.map((slot) => {
                    const slotStart = new Date(day.date);
                    slotStart.setHours(slot.hour, slot.minute, 0, 0);
                    const slotEnd = new Date(slotStart);
                    slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_MINUTES);

                    const dayEvents = events.filter((eventItem) => {
                      const eventDate = new Date(eventItem.start);
                      return (
                        eventDate.toDateString() === day.date.toDateString() &&
                        eventDate >= slotStart &&
                        eventDate < slotEnd
                      );
                    });
                    const slotKey = `${day.date.toDateString()}-${slot.hour}-${slot.minute}`;
                    const isActive = activeSlot === slotKey;

                    return (
                      <div
                        key={slotKey}
                        className={`h-10 border-b border-slate-200/60 dark:border-slate-700/70 p-1 relative transition-colors ${
                          isActive ? 'bg-emerald-50/80 dark:bg-emerald-900/20' : 'bg-white/80 dark:bg-slate-800/70'
                        }`}
                        onDragOver={(event) => handleDragOver(event, slotKey)}
                        onDragLeave={() => handleDragLeave(slotKey)}
                        onDrop={(event) => handleDrop(event, day, slot.hour, slot.minute)}
                      >
                        {isActive && (
                          <div className="absolute right-1 top-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-1.5 py-0.5 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {new Date(0, 0, 0, slot.hour, slot.minute).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        )}
                        {dayEvents.map((event, index) => {
                          const eventStart = new Date(event.start);
                          const minutesFromSlotStart = Math.max(
                            Math.round((eventStart.getTime() - slotStart.getTime()) / 60000),
                            0
                          );
                          const topOffsetPx = (minutesFromSlotStart / SLOT_MINUTES) * SLOT_HEIGHT_PX;
                          const durationMinutes = getEventDurationMinutes(event);
                          const heightPx = Math.max((durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT_PX - 2, 12);

                          return (
                          <div
                            key={event.id}
                            className={`absolute z-10 rounded text-xs font-semibold border-l-2 cursor-move px-1 py-0.5 shadow-sm ${getColorClass(event.color)} ${draggingEventId === event.id ? 'pointer-events-none opacity-90' : ''}`}
                            style={{
                              top: `${topOffsetPx}px`,
                              left: `${4 + index * 5}px`,
                              right: '4px',
                              height: `${heightPx}px`,
                            }}
                            draggable
                            onDragStart={(dragEvent) => handleDragStart(dragEvent, event)}
                            onDragEnd={handleDragEnd}
                            title={`${event.title} • ${getEventTimeLabel(event)} (Drag to move)`}
                          >
                            <div className="truncate">{event.title}</div>
                            <div className="truncate text-[10px] opacity-80">{getEventTimeLabel(event)}</div>
                          </div>
                          );
                        })}
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
