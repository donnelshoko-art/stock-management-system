import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Records — your shop, at a glance",
  description: "Stock Records is a voice-first stock notebook for small shops. Record deliveries, sales and write-offs, and keep an eye on what needs restocking.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
