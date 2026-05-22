import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const calendlyFont = Lexend({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-calendly",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Calendly clone",
  description: "Schedule meetings effortlessly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={calendlyFont.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
