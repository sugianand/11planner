import type { ReactNode } from "react";
import { Suspense } from "react";

export default function QuizLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div>Loading quiz...</div>}>{children}</Suspense>;
}
