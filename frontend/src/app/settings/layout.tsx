import type { ReactNode } from "react";
import { Suspense } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div>Loading settings...</div>}>{children}</Suspense>;
}
