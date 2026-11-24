import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "under the rock",
  description: "News you'd otherwise miss — antitrust, regulation, and whatever else you care about.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "under the rock", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#f6f1e7", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
