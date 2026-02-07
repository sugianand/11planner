'use client';

import React from 'react';
import { DayData, Event } from '@/types/schedule';
import { getColorClass } from '@/utils/dateUtils';

interface DayViewProps {
  dayData: DayData;
  events: Event[];
  onEventMove?: (eventId: string, newStart: Date) => void;
}

export const DayView: React.FC<DayViewProps> = ({ dayData, events, onEventMove }) => {
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

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, hour: number, minute: number) => {
    event.preventDefault();
    const eventId = event.dataTransfer.getData('text/plain');
    if (!eventId || !onEventMove) {
      return;
    }
    const newStart = new Date(dayData.date);
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
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <h2 className="text-2xl font-bold text-gray-900">{dayData.dayOfWeek}</h2>
        <p className="text-lg text-gray-600">{dayData.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {slots.map((slot) => {
          const slotEvents = events.filter((e) => {
            const startDate = new Date(e.start);
            return startDate.getHours() === slot.hour && startDate.getMinutes() === slot.minute;
          });
          const slotKey = `${dayData.date.toDateString()}-${slot.hour}-${slot.minute}`;
          const isActive = activeSlot === slotKey;

          return (
            <div key={slotKey} className="flex border-b border-gray-100">
              <div className="w-20 flex-shrink-0 py-2 px-4 bg-gray-50 text-sm font-semibold text-gray-700 border-r border-gray-100">
                {slot.minute === 0
                  ? new Date(0, 0, 0, slot.hour).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      hour12: true,
                    })
                  : ''}
              </div>
              <div
                className={`flex-1 py-2 px-4 relative min-h-10 transition-colors ${
                  isActive ? 'bg-blue-50' : 'bg-white'
                }`}
                onDragOver={(event) => handleDragOver(event, slotKey)}
                onDragLeave={() => handleDragLeave(slotKey)}
                onDrop={(event) => handleDrop(event, slot.hour, slot.minute)}
              >
                {isActive && (
                  <div className="absolute right-2 top-1 text-[10px] text-blue-700 bg-blue-100 rounded px-1">
                    {new Date(0, 0, 0, slot.hour, slot.minute).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </div>
                )}
                {slotEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`mb-2 p-2 rounded border-l-4 cursor-move ${getColorClass(event.color)}`}
                    draggable
                    onDragStart={(dragEvent) => handleDragStart(dragEvent, event)}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                    title="Drag to move"
                  >
                    <p className="font-semibold text-sm">{event.title}</p>
                    {event.description && (
                      <p className="text-xs opacity-75">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
