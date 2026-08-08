import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { RootChrome } from "@/components/layout/RootChrome";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blood Analyzer",
  description:
    "Visualize blood test results against sourced reference ranges — educational, not medical advice.",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <RootChrome>{children}</RootChrome>
      </body>
    </html>
  );
}
