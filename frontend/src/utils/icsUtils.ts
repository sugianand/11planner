import { Event } from '@/types/schedule';

// Serializes events to ICS and triggers a calendar file download.
export function exportEventsToICS(events: Event[], filename: string = '11planner-schedule.ics') {
  // Formats a Date to ICS UTC format (YYYYMMDDTHHMMSSZ).
  const formatICSDate = (date: Date) => {
    // Converts to UTC string: YYYYMMDDThhmmssZ
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let icsContent = 'BEGIN:VCALENDAR\r\n' +
                   'VERSION:2.0\r\n' +
                   'PRODID:-//11Planner//EN\r\n' +
                   'CALSCALE:GREGORIAN\r\n';

  events.forEach(event => {
    icsContent += 'BEGIN:VEVENT\r\n';
    icsContent += `UID:${event.id || crypto.randomUUID()}@11planner\r\n`;
    icsContent += `DTSTAMP:${formatICSDate(new Date())}\r\n`;
    icsContent += `DTSTART:${formatICSDate(new Date(event.start))}\r\n`;
    icsContent += `DTEND:${formatICSDate(new Date(event.end))}\r\n`;
    
    // Escape special characters in summary and description
    const escapedTitle = event.title.replace(/[\\;,]/g, (match) => '\\' + match).replace(/\n/g, '\\n');
    icsContent += `SUMMARY:${escapedTitle}\r\n`;
    
    if (event.description) {
        const escapedDesc = event.description.replace(/[\\;,]/g, (match) => '\\' + match).replace(/\n/g, '\\n');
      icsContent += `DESCRIPTION:${escapedDesc}\r\n`;
    }
    
    icsContent += 'END:VEVENT\r\n';
  });

  icsContent += 'END:VCALENDAR\r\n';

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
