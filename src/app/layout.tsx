import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { PlannerProvider } from "@/contexts/PlannerContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Navigation from "@/components/Navigation";
import "./globals.css";

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
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased`}
      >
        <ThemeProvider>
          <PlannerProvider>
            <Navigation />
            {children}
          </PlannerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
