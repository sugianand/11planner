# Schedule Views App

A modern scheduling application built with **Next.js**, **React**, and **TypeScript** featuring daily, weekly, and monthly calendar views.

## Features

- **Three Calendar Views**:
  - **Daily View**: Hourly schedule with detailed event information
  - **Weekly View**: Seven-day grid with time slots for better week planning
  - **Monthly View**: Full month calendar with event previews

- **Navigation Controls**:
  - Switch between different view modes
  - Navigate to previous/next periods
  - Quick "Today" button to jump to current date

- **Event Management**:
  - Display events with customizable colors (blue, red, green, yellow, purple, pink)
  - Event descriptions and time ranges
  - Responsive event display across all views

- **Type-Safe**: Built with TypeScript for robust development

- **Styled with Tailwind CSS**: Modern, responsive UI

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page with ScheduleView component
│   └── globals.css         # Global styles
├── components/
│   ├── ScheduleView.tsx    # Main schedule container with view switcher
│   ├── DayView.tsx         # Daily calendar component
│   ├── WeekView.tsx        # Weekly calendar component
│   └── MonthView.tsx       # Monthly calendar component
├── types/
│   └── schedule.ts         # TypeScript types and interfaces
└── utils/
    └── dateUtils.ts        # Date formatting and calculation utilities
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn/pnpm/bun)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Production Build

```bash
npm run build
npm run start
```

## Usage

### Basic Implementation

```tsx
import { ScheduleView } from "@/components/ScheduleView";
import { Event } from "@/types/schedule";

const events: Event[] = [
  {
    id: "1",
    title: "Team Meeting",
    description: "Weekly sync",
    start: new Date(2024, 0, 15, 10, 0),
    end: new Date(2024, 0, 15, 11, 0),
    color: "blue",
  },
];

export default function App() {
  return <ScheduleView events={events} />;
}
```

### Event Object Structure

```tsx
interface Event {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  color?: "blue" | "red" | "green" | "yellow" | "purple" | "pink";
}
```

## Components

### ScheduleView

Main component that manages view state and provides navigation controls.

**Props:**

- `events?: Event[]` - Array of events to display

### DayView

Displays a single day with hourly time slots.

**Props:**

- `dayData: DayData` - Information about the selected day
- `events: Event[]` - Events for the day

### WeekView

Displays a seven-day week with hourly time slots.

**Props:**

- `weekDays: DayData[]` - Array of 7 days in the week
- `events: Event[]` - Events for the week

### MonthView

Displays a full month calendar grid.

**Props:**

- `daysInMonth: DayData[]` - All days in the month (42 cells for full grid)
- `events: Event[]` - Events for the month

## Utilities

### Date Utilities

- `getTimeSlots()` - Generate 24-hour time slots
- `getDaysInMonth(date)` - Get all days for a month calendar grid
- `getWeekDays(date)` - Get the 7 days of the week
- `getDayData(date)` - Get data for a single day
- `formatDateRange(startDate, endDate)` - Format date range as string
- `getColorClass(color)` - Get Tailwind CSS classes for event color

## Technologies Used

- **Next.js 16** - React framework with server-side rendering
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting


