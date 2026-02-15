import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display font - Bold, confident, geometric
const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Body/UI font - Clean, modern, excellent readability
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Mono font - For stats, timers, metrics
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Goal Achiever Pro - Achieve Your Goals with Clarity",
    template: "%s | Goal Achiever Pro",
  },
  description:
    "A comprehensive productivity app for entrepreneurs. Set your vision, audit your time with the Value Matrix, build systems, and achieve your goals.",
  keywords: [
    "goal setting",
    "productivity",
    "time management",
    "Value Matrix",
    "entrepreneur productivity",
    "goal tracking",
    "time audit",
    "pomodoro",
  ],
  authors: [{ name: "Goal Achiever Pro" }],
  openGraph: {
    title: "Goal Achiever Pro - Achieve Your Goals with Clarity",
    description:
      "A comprehensive productivity app for entrepreneurs with Value Matrix time optimization.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Goal Achiever Pro",
    description:
      "A comprehensive productivity app for entrepreneurs with Value Matrix time optimization.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* External script to prevent flash of wrong theme — avoids CSP unsafe-inline */}
        <script src="/theme-init.js" />
      </head>
      <body
        className={`${outfit.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
