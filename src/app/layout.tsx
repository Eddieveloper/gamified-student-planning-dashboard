import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BloomU — Your day, in full bloom",
  description:
    "A day-planning dashboard for university students: calories, study goals, deadlines, and a daily tulip that grows as you do.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-[#fff5f8] font-sans text-[#3f1d2e] antialiased">
        {children}
      </body>
    </html>
  );
}
