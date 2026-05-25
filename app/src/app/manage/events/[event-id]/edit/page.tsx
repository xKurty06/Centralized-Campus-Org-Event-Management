"use client";
import { useState, useEffect, ReactNode } from "react";
import React from "react";
import { useParams } from "next/navigation";
import ManageShell from "@/components/ManageShell";
import Link from "next/link";

type AudienceType = "CvSU_Only" | "Org_Members_Only";
type EventStatus =
  | "Upcoming"
  | "Open"
    | "Closed"
  | "Completed"
  | "Cancelled";

interface EventForm {
  id: string;
  slug?: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  capacity: number | "";
  audience_type: AudienceType;
  is_paid: boolean;
  payment_instructions: string;
  status: EventStatus;
  venue_id: number;
  category_id: number;
  banner_url: string;
}

interface AudienceOption {
  value: AudienceType;
  label: string;
  description: string;
  icon: ReactNode;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function normalizeBannerUrl(raw?: string | null) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//')) return s;
  let backendOrigin = 'http://localhost:8000';
  try {
    backendOrigin = new URL(API_BASE_URL).origin;
  } catch (e) {
    // fallback to default
  }
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${backendOrigin}${path}`;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toLocalDatetimeInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const VENUES = [
  { id: 1, name: "SMT Hall" },
  { id: 2, name: "AVR 2" },
  { id: 3, name: "Gymnasium" },
  { id: 4, name: "Function Hall" },
  { id: 5, name: "Open Grounds" },
  { id: 6, name: "Library AVR" },
];

const CATEGORIES = [
  { id: 1, name: "Workshop" },
  { id: 2, name: "Seminar" },
  { id: 3, name: "Competition" },
  { id: 4, name: "Activity" },
  { id: 5, name: "Training" },
  { id: 6, name: "Outreach" },
  { id: 7, name: "Cultural" },
  { id: 8, name: "Other" },
];

const AUDIENCE_OPTIONS: AudienceOption[] = [
  {
    value: "CvSU_Only",
    label: "CvSU Students Only",
    description: "Only verified CvSU students with @cvsu.edu.ph accounts.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    value: "Org_Members_Only",
    label: "Org Members Only",
    description: "Restricted to members of your organization.",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
];

const STATUS_OPTIONS: EventStatus[] = [
  "Upcoming",
  "Open",
    "Closed",
  "Completed",
  "Cancelled",
];

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[13px] text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-gray-700">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[12px] text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      className={`w-full h-10 px-3 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-gray-300 ${className}`}
      {...props}
    />
  );
}

function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
  return (
    <textarea
      className={`w-full px-3 py-2.5 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none placeholder:text-gray-300 ${className}`}
      {...props}
    />
  );
}

function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <select
      className={`w-full h-10 px-3 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function StatusBadge({ status }: { status: EventStatus }) {
  const map = {
    Upcoming: "bg-blue-50 text-blue-700 border-blue-200",
    Open: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Closed: "bg-gray-100 text-gray-600 border-gray-200",
    Completed: "bg-purple-50 text-purple-700 border-purple-200",
    Cancelled: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border tracking-wide uppercase ${map[status]}`}
    >
      {status}
    </span>
  );
}

function AudienceCard({
  option,
  selected,
  onClick,
}: {
  option: AudienceOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${selected ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100" : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"}`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex-shrink-0 flex items-center justify-center ${selected ? "text-emerald-600" : "text-gray-400"}`}>
          {option.icon}
        </span>
        <div>
          <p
            className={`text-[13px] font-semibold ${selected ? "text-emerald-800" : "text-gray-800"}`}
          >
            {option.label}
          </p>
          <p
            className={`text-[12px] mt-0.5 ${selected ? "text-emerald-600" : "text-gray-400"}`}
          >
            {option.description}
          </p>
        </div>
      </div>
    </button>
  );
}

function BannerUpload({
  currentUrl,
  onChange,
}: {
  currentUrl: string;
  onChange: (file: File) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onChange(file);
  };
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative w-full h-44 rounded-xl border-2 border-dashed transition-all overflow-hidden ${dragging ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
    >
      <label className="relative h-full w-full cursor-pointer">
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/30 text-white text-[12px] font-medium py-2 text-center">
              Click to replace banner
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="text-center">
              <p className="text-[13px] font-medium text-gray-600">
                Drop banner image here
              </p>
              <p className="text-[12px] text-gray-400 mt-0.5">
                or click to browse
              </p>
            </div>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f);
          }}
        />
      </label>
    </div>
  );
}

function UnsavedBadge({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Unsaved changes
    </span>
  );
}

export default function EditEventPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.["event-id"])
    ? params["event-id"][0]
    : (params?.["event-id"] ?? "");
  
  const [initialForm, setInitialForm] = useState<EventForm | null>(null);
  const [form, setForm] = useState<EventForm | null>(null);
  const eventRouteKey = form?.slug ?? initialForm?.slug ?? eventId;
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      if (!eventId) {
        setLoadError("Invalid event ID.");
        setLoading(false);
        return;
      }
      const token =
        window.localStorage.getItem("auth_token") ??
        window.sessionStorage.getItem("auth_token");
      if (!token) {
        setLoadError("Session missing. Please sign in again.");
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/manage/events/${eventId}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => null);
      const payload = (await res?.json().catch(() => null)) as any;
      if (!res || !res.ok || !payload?.success || !payload.data) {
        setLoadError(payload?.error ?? "Unable to load event.");
        setLoading(false);
        return;
      }
      const e = payload.data;
      
      const loadedData: EventForm = {
        id: String(e.id ?? eventId),
        slug: e.slug ? String(e.slug) : String(e.id ?? eventId),
        title: String(e.title ?? ""),
        description: String(e.description ?? ""),
        start_date: toLocalDatetimeInput(e.start_date),
        end_date: toLocalDatetimeInput(e.end_date),
        capacity: Number(e.capacity ?? 1),
        audience_type:
          e.audience_type === "Org_Members_Only"
            ? "Org_Members_Only"
            : "CvSU_Only",
        is_paid: Boolean(e.is_paid),
        payment_instructions: String(e.payment_instructions ?? ""),
        status: (e.effective_status ?? e.status ?? "Upcoming") as EventStatus,
        venue_id: Number(e.venue_id ?? 1),
        category_id: Number(e.category_id ?? 8),
        banner_url: normalizeBannerUrl(e.banner_url ?? ""),
      };

      setForm(loadedData);
      setInitialForm(loadedData);
      setBannerFile(null);
      setLoading(false);
    })();
  }, [eventId]);

  const update = (
    field: keyof EventForm,
    value: EventForm[keyof EventForm],
  ) => {
    setForm((p) => ({ ...p!, [field]: value }));
    setIsDirty(true);
    setSaved(false);
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleDiscard = () => {
    if (initialForm) {
      setForm(initialForm);
      setBannerFile(null);
      setIsDirty(false);
      setErrors({});
      setSaved(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form?.title.trim()) e.title = "Event title is required.";
    if (!form?.description.trim()) e.description = "Description is required.";
    if (!form?.start_date) e.start_date = "Start date is required.";
    if (!form?.end_date) e.end_date = "End date is required.";
    return e;
  };

  const handleSave = async () => {
    if (!form) return;
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    const token =
      window.localStorage.getItem("auth_token") ??
      window.sessionStorage.getItem("auth_token");
    if (!token) {
      setErrors({ form: "Session missing. Please sign in again." });
      return;
    }
    setSaving(true);

    let body: BodyInit;
    let headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    if (bannerFile) {
      const formData = new FormData();
      formData.append("banner_file", bannerFile);
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("start_date", form.start_date);
      formData.append("end_date", form.end_date);
      formData.append("capacity", String(Number(form.capacity || 1)));
      formData.append("audience_type", form.audience_type);
      formData.append("is_paid", form.is_paid ? "1" : "0");
      formData.append("payment_instructions", form.payment_instructions);
      formData.append("status", form.status);
      formData.append("venue_id", String(Number(form.venue_id)));
      formData.append("category_id", String(Number(form.category_id)));
      if (form.banner_url && !form.banner_url.startsWith("blob:")) {
        formData.append("banner_url", form.banner_url);
      }
      body = formData;
    } else {
      const normalizedBannerUrl =
        form.banner_url && !form.banner_url.startsWith("blob:")
          ? form.banner_url
          : null;
      body = JSON.stringify({
        title: form.title,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date,
        capacity: Number(form.capacity || 1),
        audience_type: form.audience_type,
        is_paid: form.is_paid,
        payment_instructions: form.payment_instructions,
        status: form.status,
        venue_id: Number(form.venue_id),
        category_id: Number(form.category_id),
        banner_url: normalizedBannerUrl,
      });
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE_URL}/manage/events/${eventId}`, {
      method: "PUT",
      headers,
      body,
    }).catch(() => null);
    const payload = (await res?.json().catch(() => null)) as any;
    if (!res || !res.ok || !payload?.success) {
      const apiErrors: Record<string, string> = {};
      if (payload?.errors && typeof payload.errors === "object")
        Object.entries(payload.errors).forEach(([k, val]) => {
          if (Array.isArray(val) && val[0]) apiErrors[k] = String(val[0]);
        });
      if (payload?.details && typeof payload.details === "object")
        Object.entries(payload.details).forEach(([k, val]) => {
          if (Array.isArray(val) && val[0]) apiErrors[k] = String(val[0]);
        });
      setErrors(
        Object.keys(apiErrors).length
          ? apiErrors
          : { form: payload?.error ?? "Failed to save changes." },
      );
      setSaving(false);
      return;
    }

    const savedBannerUrl = normalizeBannerUrl(String(payload?.data?.banner_url ?? form.banner_url ?? ""));
    const nextForm = { ...form, banner_url: savedBannerUrl };
    setSaving(false);
    setSaved(true);
    setIsDirty(false);
    setBannerFile(null);
    setForm(nextForm);
    setInitialForm(nextForm);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  if (loadError)
    return (
      <ManageShell pageTitle="Salikop">
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      </ManageShell>
    );
  if (!form)
    return (
      <ManageShell pageTitle="Salikop">
        <div className="text-sm text-gray-500">Event data unavailable.</div>
      </ManageShell>
    );

  return (
    <ManageShell pageTitle="Salikop">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-5 animate-fade-in">
        <div className="flex flex-col gap-3">
          <nav className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-muted)] flex-wrap">
            <Link
              href="/manage/events"
              className="hover:text-[var(--color-primary)] transition-colors no-underline"
            >
              Events
            </Link>
            <svg
              className="w-3.5 h-3.5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Kept locked to the loaded/saved title so it doesn't shift when typing */}
            <Link
              href={`/manage/events/${eventRouteKey}`}
              className="hover:text-[var(--color-primary)] transition-colors no-underline truncate max-w-[180px] sm:max-w-xs"
            >
              {initialForm?.title || "Event"}
            </Link>
            <svg
              className="w-3.5 h-3.5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[var(--color-text)] font-semibold">
              Edit Event
            </span>
          </nav>
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <div className="flex flex-row items-center gap-2">
                <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">
                  Edit Event
                </h1>
                <UnsavedBadge visible={isDirty} />
                {saved && (
                  <span className="text-[12px] text-emerald-600 font-medium">
                    Saved
                  </span>
                )}
              </div>
              <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
                {fmt(form.start_date)} Event ID:{" "}
                <span className="font-mono">{eventRouteKey}</span>
              </p>
            </div>
          </div>
          {errors.form && (
            <p className="text-[12px] text-red-500">{errors.form}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          {isDirty && (
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="inline-flex items-center justify-center h-10 px-4 text-[13px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
            >
              Discard Changes
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center h-10 gap-2 px-4 text-[13px] font-semibold bg-green-700 hover:bg-green-800 text-white rounded-lg transition-colors no-underline"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <SectionCard
            title="Event Banner"
            subtitle="Displayed on event cards and detail page."
          >
            <BannerUpload
              currentUrl={form.banner_url}
              onChange={(file) => {
                setBannerFile(file);
                update("banner_url", URL.createObjectURL(file));
              }}
            />
          </SectionCard>
          <SectionCard title="Basic Information" subtitle="Core event details.">
            <div className="flex flex-col gap-5">
              <Field label="Event Title" required>
                <Input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                />
                {errors.title && (
                  <p className="text-[12px] text-red-500">{errors.title}</p>
                )}
              </Field>
              <Field label="Description" required>
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                />
                {errors.description && (
                  <p className="text-[12px] text-red-500">
                    {errors.description}
                  </p>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <Select
                    value={form.category_id}
                    onChange={(e) =>
                      update("category_id", Number(e.target.value))
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  {errors.category_id && (
                    <p className="text-[12px] text-red-500">
                      {errors.category_id}
                    </p>
                  )}
                </Field>
                <Field label="Venue">
                  <Select
                    value={form.venue_id}
                    onChange={(e) => update("venue_id", Number(e.target.value))}
                  >
                    {VENUES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </Select>
                  {errors.venue_id && (
                    <p className="text-[12px] text-red-500">
                      {errors.venue_id}
                    </p>
                  )}
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date" required>
                  <Input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => update("start_date", e.target.value)}
                  />
                  {errors.start_date && (
                    <p className="text-[12px] text-red-500">
                      {errors.start_date}
                    </p>
                  )}
                </Field>
                <Field label="End Date" required>
                  <Input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => update("end_date", e.target.value)}
                  />
                  {errors.end_date && (
                    <p className="text-[12px] text-red-500">
                      {errors.end_date}
                    </p>
                  )}
                </Field>
              </div>
              <Field label="Capacity">
                <Input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) =>
                    update("capacity", Number(e.target.value) || "")
                  }
                />
                {errors.capacity && (
                  <p className="text-[12px] text-red-500">{errors.capacity}</p>
                )}
              </Field>
            </div>
          </SectionCard>
        </div>
        <div className="flex flex-col gap-6">
          <SectionCard title="Event Status">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-500">Current</span>
                <StatusBadge status={form.status} />
              </div>
              <Field label="Update Status">
                <Select
                  value={form.status}
                  onChange={(e) =>
                    update("status", e.target.value as EventStatus)
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                {errors.status && (
                  <p className="text-[12px] text-red-500">{errors.status}</p>
                )}
              </Field>
            </div>
          </SectionCard>
          <SectionCard title="Audience" subtitle="Who can register.">
            <div className="flex flex-col gap-2">
              {AUDIENCE_OPTIONS.map((opt) => (
                <AudienceCard
                  key={opt.value}
                  option={opt}
                  selected={form.audience_type === opt.value}
                  onClick={() => update("audience_type", opt.value)}
                />
              ))}
            </div>
            {errors.audience_type && (
              <p className="text-[12px] text-red-500 mt-2">
                {errors.audience_type}
              </p>
            )}
          </SectionCard>
        </div>
      </div>
    </ManageShell>
  );
}
