"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearSelectedManageOrgId } from "./manageOrgSelection";

interface ShellProfileUser {
  first_name?: string;
  last_name?: string;
  school_id?: string;
}

interface ShellProfileMenuProps {
  collapsed: boolean;
  role: "admin" | "officer";
  user: ShellProfileUser | null;
}

function fullName(user: ShellProfileUser | null, fallback: string) {
  if (!user) return fallback;
  return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || fallback;
}

function initials(user: ShellProfileUser | null, fallback: string) {
  const name = fullName(user, fallback);
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ShellProfileMenu({ collapsed, role, user }: ShellProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const label = role === "admin" ? "Admin" : "Officer";
  const sectionHref = role === "admin" ? "/admin/dashboard" : "/manage/dashboard";
  const sectionLabel = role === "admin" ? "Admin Panel" : "Manage Org";

  function handleLogout() {
    window.localStorage.removeItem("auth_token");
    window.localStorage.removeItem("auth_user");
    window.sessionStorage.removeItem("auth_token");
    window.sessionStorage.removeItem("auth_user");
    clearSelectedManageOrgId();
    document.cookie = "auth_role=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "auth_session=; Path=/; Max-Age=0; SameSite=Lax";
    setOpen(false);
    router.push("/");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={[
          "flex items-center rounded-lg p-2 w-full text-left transition-colors hover:bg-green-50",
          collapsed ? "justify-center" : "",
        ].join(" ")}
        style={{ background: "var(--color-surface-2)" }}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? fullName(user, label) : undefined}
      >
        <span
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{
            background: "var(--color-primary-muted)",
            color: "var(--color-primary)",
          }}
        >
          {initials(user, role === "admin" ? "AD" : "OF")}
        </span>

        <span
          className={`overflow-hidden transition-all duration-200 ${
            collapsed ? "w-0 max-w-0 opacity-0 ml-0" : "flex-1 opacity-100 ml-3"
          }`}
        >
          <span className="block text-[12.5px] font-semibold truncate leading-tight text-[var(--color-text)]">
            {fullName(user, label)}
          </span>
          <span className="block text-[11px] text-[var(--color-text-muted)]">
            {user?.school_id ?? label}
          </span>
        </span>

        {!collapsed && (
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="none"
          >
            <path d="M5 12.5l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className={[
              "absolute bottom-[calc(100%+8px)] z-40 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg",
              collapsed ? "left-0" : "left-0 right-0",
            ].join(" ")}
            role="menu"
          >
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-[13px] font-semibold text-gray-800 truncate">{fullName(user, label)}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.school_id ?? ""}</p>
              <span className="mt-1.5 inline-block text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-md uppercase tracking-wide">
                {label}
              </span>
            </div>
            <div className="py-1">
              <MenuLink href="/my-events" onClick={() => setOpen(false)} icon={<IconCalendar />}>My Events</MenuLink>
              <MenuLink href="/profile" onClick={() => setOpen(false)} icon={<IconProfile />}>View Profile</MenuLink>
              <MenuLink href="/change-password" onClick={() => setOpen(false)} icon={<IconKey />}>Change Password</MenuLink>
              <MenuLink href={sectionHref} onClick={() => setOpen(false)} icon={role === "admin" ? <IconAdmin /> : <IconManage />}>{sectionLabel}</MenuLink>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="py-1">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <IconLogout /> Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  icon,
  children,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors no-underline group"
      role="menuitem"
    >
      <span className="text-gray-400 group-hover:text-green-700 transition-colors">{icon}</span>
      {children}
    </Link>
  );
}

function IconCalendar() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function IconProfile() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function IconKey() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M11.5 10H18M16 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function IconManage() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

function IconAdmin() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M9 12l2 2 4-4m-5 6a8 8 0 110-16 8 8 0 010 16z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function IconLogout() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M13 15l4-5-4-5M17 10H7m6 7H5a2 2 0 01-2-2V5a2 2 0 012-2h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
