"use client";

import dynamic from "next/dynamic";

const SupportAssistantWidget = dynamic(() => import("@/components/SupportAssistantWidget"), {
  ssr: false,
});

// Renders the support assistant only on the client to avoid SSR hydration drift.
export default function SupportAssistantClient() {
  return <SupportAssistantWidget />;
}
