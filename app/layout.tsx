import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WordPress Project Cost Calculator",
  description: "React-powered calculator integrated with WordPress REST API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
