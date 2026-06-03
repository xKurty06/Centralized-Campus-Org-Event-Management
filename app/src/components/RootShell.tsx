"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "./Navbar";
import { APP_VERSION_LABEL } from "./appVersion";

const HIDDEN_NAVBAR_PATHS = [
  // Global shells / auth flows
  "/",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/change-password",
  "/privacy-policy",
  "/support",

  // Manage area (explicit routes and prefixes)
  "/manage",

  // Admin area (explicit routes and prefixes)
  "/admin",
];

function shouldHideNavbar(pathname: string) {
  return HIDDEN_NAVBAR_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function shouldHideFooter(pathname: string) {
  // reuse same hidden paths for footer; tweak here if footer visibility should differ
  return HIDDEN_NAVBAR_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      {!shouldHideNavbar(pathname) && <Navbar />}
      {children}

      {!shouldHideFooter(pathname) && (
        <footer className="border-t border-gray-200 bg-white mt-auto">
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

              <span className="text-xs text-gray-500">
                {APP_VERSION_LABEL} · {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}
