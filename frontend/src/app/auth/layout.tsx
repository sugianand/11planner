import type { ReactNode } from "react";
import { Suspense } from "react";
import "./auth.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}