import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { PlannerProvider } from "@/contexts/PlannerContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { TimerProvider } from "@/contexts/TimerContext";
import Navigation from "@/components/Navigation";
import NotificationToasts from "@/components/NotificationToasts";
import GlobalTimerTicker from "@/components/GlobalTimerTicker";
import SupportAssistantWidget from "@/components/SupportAssistantWidget";
import "./globals.css";
import "@material-symbols/font-400/outlined.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "11 Planner - Master Your Schedule",
  description: "An intelligent academic dashboard that transforms overwhelming syllabi into actionable 30-minute focus blocks to eliminate procrastination.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased bg-white dark:bg-slate-900 text-black dark:text-white transition-colors`}
      >
        <ThemeProvider>
          <PlannerProvider>
            <TimerProvider>
              <NotificationProvider>
                <Navigation />
                <NotificationToasts />
                {children}
                <GlobalTimerTicker />
                <SupportAssistantWidget />
              </NotificationProvider>
            </TimerProvider>
          </PlannerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
