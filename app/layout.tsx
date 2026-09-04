import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Enterprise AI Portal",
    template: "%s · Enterprise AI Portal",
  },
  description:
    "AI workspace for casino and resort operations, running on shared Nutanix infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-ivory-50 text-charcoal-900">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-navy-950 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <TopNav />

        {/* Pages own their own layout: the dashboard runs three columns at full
            width, the others centre a reading column. */}
        <div id="main">{children}</div>
      </body>
    </html>
  );
}
