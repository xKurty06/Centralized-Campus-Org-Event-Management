import type { Metadata } from "next";
import "./globals.css";
import RouteAccessGuard from "@/components/RouteAccessGuard";
import RootShell from "@/components/RootShell";

export const metadata: Metadata = {
  title: "Salikop - Centralized Org & Event Management System",
  description:
    "The official Cavite State University platform for student organizations, campus events, and participant management.",
  icons: {
    icon: "/Salikop_logo.png",
    shortcut: "/Salikop_logo.png",
    apple: "/Salikop_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <RouteAccessGuard />
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
