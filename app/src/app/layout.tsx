import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Link from "next/dist/client/link";
import RouteAccessGuard from "@/components/RouteAccessGuard";

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
        {children}
        <footer className="border-t border-gray-200 bg-white mt-8">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <Link href="/" className="text-xs font-medium text-[var(--color-text-muted)] hover:text-green-500 transition-colors">
              &copy; Cavite State University · SALIKOP
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy-policy"
                className="text-xs text-[var(--color-text-muted)] hover:text-green-500 transition-colors"
              >
                Privacy Policy
              </Link>

              <Link
                href="/support"
                className="text-xs text-[var(--color-text-muted)] hover:text-green-500 transition-colors"
              >
                Contact Support
              </Link>

              <span className="text-xs text-gray-500">v1.0 · 2026</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
