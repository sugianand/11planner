import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { PlannerProvider } from "@/contexts/PlannerContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { TimerProvider } from "@/contexts/TimerContext";
import { MusicProvider } from "@/contexts/MusicContext";
import Navigation from "@/components/Navigation";
import NotificationToasts from "@/components/NotificationToasts";
import GlobalTimerTicker from "@/components/GlobalTimerTicker";
import PersistentAudioPlayer from "@/components/PersistentAudioPlayer";
import SupportAssistantClient from "@/components/SupportAssistantClient";
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

// Composes all app-wide providers and shell UI for every route.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} relative antialiased bg-white dark:bg-slate-900 text-black dark:text-white transition-colors`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-[9] bg-transparent dark:bg-slate-950/55"
        />
        <ThemeProvider>
          <PlannerProvider>
            <TimerProvider>
              <MusicProvider>
                <NotificationProvider>
                  <Navigation />
                  <NotificationToasts />
                  {children}
                  <GlobalTimerTicker />
                  <PersistentAudioPlayer />
                  <SupportAssistantClient />
                </NotificationProvider>
              </MusicProvider>
            </TimerProvider>
          </PlannerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
