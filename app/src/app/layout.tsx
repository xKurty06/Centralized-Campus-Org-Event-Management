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
    <img
      src="/Salikop_logo.png"
      alt="Salikop logo"
      width={size}
      height={size}
      className="object-contain"
    />
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
