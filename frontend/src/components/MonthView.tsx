'use client';

import React from 'react';
import { DayData, Event } from '@/types/schedule';
import { getColorClass } from '@/utils/dateUtils';

interface MonthViewProps {
  daysInMonth: DayData[];
  events: Event[];
  onEventMove?: (eventId: string, newStart: Date) => void;
  errorMessage?: string | null;
  onDismissError?: () => void;
}

export const MonthView: React.FC<MonthViewProps> = ({ daysInMonth, events, onEventMove, errorMessage, onDismissError }) => {
  const [activeDay, setActiveDay] = React.useState<string | null>(null);
  const [draggingEventId, setDraggingEventId] = React.useState<string | null>(null);
  const [isErrorFading, setIsErrorFading] = React.useState(false);
  const monthDate = daysInMonth[15]?.date || new Date();
  const monthYear = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, eventId: string) => {
    const eventItem = events.find((item) => item.id === eventId);
    if (eventItem?.kind === 'class') {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('text/plain', eventId);
    event.dataTransfer.effectAllowed = 'move';
    const dragPreview = event.currentTarget.cloneNode(true) as HTMLDivElement;
    dragPreview.style.position = 'fixed';
    dragPreview.style.top = '-1000px';
    dragPreview.style.left = '-1000px';
    dragPreview.style.pointerEvents = 'none';
    dragPreview.style.width = `${event.currentTarget.offsetWidth}px`;
    dragPreview.style.height = `${event.currentTarget.offsetHeight}px`;
    dragPreview.style.opacity = '0.95';
    document.body.appendChild(dragPreview);
    event.dataTransfer.setDragImage(dragPreview, 12, 12);
    requestAnimationFrame(() => {
      if (dragPreview.parentNode) {
        dragPreview.parentNode.removeChild(dragPreview);
      }
    });
    setDraggingEventId(eventId);
  };

  const handleDragEnd = () => {
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
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, dayKey: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setActiveDay(dayKey);
  };

  const handleDragLeave = (dayKey: string) => {
    setActiveDay((prev) => (prev === dayKey ? null : prev));
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
    <div className="flex flex-col h-auto">
      <div className="sticky top-0 z-10 border-b border-white/70 dark:border-slate-700/70 bg-white/85 dark:bg-slate-900/85 backdrop-blur px-4 py-2.5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Month View</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{monthYear}</p>
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

      <div className="overflow-visible">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-px bg-slate-200/70 dark:bg-slate-700/70">
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-slate-100/90 dark:bg-slate-700/90 p-1.5 text-center font-semibold text-slate-700 dark:text-slate-200"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-slate-200/70 dark:bg-slate-700/70">
          {daysInMonth.map((day) => {
            const dayEvents = events.filter((e) => {
              const eventDate = new Date(e.start);
              return eventDate.toDateString() === day.date.toDateString() && e.kind !== 'class';
            });

            const dayKey = day.date.toDateString();
            const isActive = activeDay === dayKey;

            return (
              <div
                key={dayKey}
                className={`relative min-h-16 md:min-h-20 p-2 transition-colors ${
                  day.isCurrentMonth
                    ? day.isToday
                      ? ''
                      : 'bg-white/85 dark:bg-slate-800/75'
                    : 'bg-slate-50/60 dark:bg-slate-800/60'
                } ${isActive ? 'ring-2' : ''}`}
                onDragOver={(event) => handleDragOver(event, dayKey)}
                onDragLeave={() => handleDragLeave(dayKey)}
                onDrop={(event) => handleDrop(event, day)}
                style={{
                  ...(day.isCurrentMonth && day.isToday
                    ? { backgroundColor: 'var(--theme-accent-soft)' }
                    : {}),
                  ...(isActive
                    ? { boxShadow: 'inset 0 0 0 2px var(--theme-accent-strong)' }
                    : {}),
                }}
              >
                {isActive && draggingEventId && (
                  <div
                    className="mb-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5 inline-block"
                    style={{
                      color: 'var(--theme-accent-strong)',
                      backgroundColor: 'var(--theme-accent-soft)',
                    }}
                  >
                    {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {getDragTimeLabel()}
                  </div>
                )}
                <p
                  className={`text-sm font-semibold mb-1 ${
                    day.isCurrentMonth
                      ? day.isToday
                        ? 'text-white rounded-full w-6 h-6 flex items-center justify-center'
                        : 'text-slate-900 dark:text-white'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                  style={day.isCurrentMonth && day.isToday ? { backgroundColor: 'var(--theme-accent-strong)' } : undefined}
                >
                  {day.dayNumber}
                </p>

                {/* Events preview */}
                <div className="space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded-md truncate border-l-2 shadow-sm ${getColorClass(event.color)} ${event.kind === 'class' ? 'cursor-default border-dashed opacity-90' : 'cursor-move'}`}
                      draggable={event.kind !== 'class'}
                      onDragStart={(dragEvent) => handleDragStart(dragEvent, event.id)}
                      onDragEnd={handleDragEnd}
                      title="Drag to move"
                    >
                      {event.title}
                    </div>
                  ))}
                </div>

                {dayEvents.length > 2 && (
                  <div className="absolute bottom-1 right-1 rounded-md bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 text-[11px] font-semibold text-gray-700 dark:text-slate-200 shadow-sm">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
