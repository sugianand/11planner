"use client";

import React from "react";
import { useNotification } from "@/contexts/NotificationContext";

const getTypeStyles = (type: string) => {
  switch (type) {
    case "danger":
      return "border-l-red-500 bg-red-50 text-red-900";
    case "warning":
      return "border-l-amber-500 bg-amber-50 text-amber-900";
    default:
      return "border-l-blue-500 bg-blue-50 text-blue-900";
  }
};

export default function NotificationToasts() {
  const { notifications, dismissNotification } = useNotification();

  if (!notifications.length) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {notifications.map((item) => (
        <div
          key={item.id}
          className={`border-l-4 rounded-lg shadow-lg px-4 py-3 bg-white ${getTypeStyles(item.type)}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs opacity-80 mt-1">{item.message}</p>
            </div>
            <button
              onClick={() => dismissNotification(item.id)}
              className="text-xs font-semibold opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
