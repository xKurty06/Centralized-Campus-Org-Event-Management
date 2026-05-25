import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Link from "next/link"; // Fixed this import path
import RouteAccessGuard from "@/components/RouteAccessGuard";
import RootShell from "@/components/RootShell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Salikop — Org & Event Management System",
  description:
    "The official Cavite State University platform for student organizations, campus events, and participant management.",
};

function BrandLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M20 2L34.64 10.5V27.5L20 36L5.36 27.5V10.5L20 2Z" fill="#22a050" />
      <path d="M20 6L31.07 12.25V24.75L20 31L8.93 24.75V12.25L20 6Z" fill="#1a7a3c" />
      <path d="M14 20.5L18 24.5L26 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-poppins)] bg-gray-50 text-gray-900">
        <RouteAccessGuard />

        <RootShell>{children}</RootShell>

        {/* Footer moved into RootShell so it can be conditionally hidden on shell pages */}
      </body>
    </html>
  );
}