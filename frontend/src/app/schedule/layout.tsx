import type { ReactNode } from "react";
import { Suspense } from "react";

export default function ScheduleLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div>Loading schedule...</div>}>{children}</Suspense>;
}
