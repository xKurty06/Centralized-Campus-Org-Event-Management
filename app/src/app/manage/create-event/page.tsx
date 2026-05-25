'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ManageShell from '@/components/ManageShell';

/* ----------------------------------------------------------------
   Types — aligned to DB schema
   ---------------------------------------------------------------- */

type AudienceType = 'CvSU_Only' | 'Org_Members_Only';
type EventCategory = 'Workshop' | 'Seminar' | 'Competition' | 'Activity' | 'Training' | 'Outreach' | 'Cultural' | 'Other';
type SaveState = 'idle' | 'saving' | 'success' | 'error';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

interface FormData {
  title: string;
  category: EventCategory | '';
  venue_id: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  capacity: string;
  audience_type: AudienceType;
  description: string;
  is_paid: boolean;
  price: string; // NEW
  payment_instructions: string;
  banner_file: File | null;
  banner_preview: string | null;
}

interface FormErrors {
  title?: string;
  category?: string;
  venue_id?: string;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  capacity?: string;
  description?: string;
  price?: string; // NEW
  payment_instructions?: string;
  banner_file?: string;
}

/* ----------------------------------------------------------------
   Seed data
   ---------------------------------------------------------------- */
const VENUES = [
  { id: '1', name: 'Rolle Hall' },
  { id: '2', name: 'ICON' },
  { id: '3', name: 'Quadrangle' },
  { id: '4', name: 'Grandstand' },
  { id: '5', name: 'Campus Oval' },
  { id: '6', name: 'Softball Field' },
  { id: '7', name: 'Open Court' },
  { id: '8', name: 'Gymnasium' },
  { id: '9', name: 'Hostel' },
  { id: '10', name: 'Administration' },
  { id: '11', name: 'University Chapel' },
  { id: '12', name: 'Bahay ng Alumni' },
  { id: '13', name: 'International House' },
  { id: '14', name: "Laya't Diwa" },
  { id: '15', name: 'University Resort' },
];

const EVENT_CATEGORIES: EventCategory[] = [
  'Workshop', 'Seminar', 'Competition', 'Activity',
  'Training', 'Outreach', 'Cultural', 'Other',
];

const AUDIENCE_OPTIONS: { value: AudienceType; label: string; desc: string }[] = [
  { value: 'CvSU_Only', label: 'CvSU students only', desc: 'Only @cvsu.edu.ph account holders can register' },
  { value: 'Org_Members_Only', label: 'Organization members', desc: 'Only members of your organization can register' },
];

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
const INITIAL: FormData = {
  title: '', category: '', venue_id: '',
  start_date: '', start_time: '', end_date: '', end_time: '',
  capacity: '', audience_type: 'CvSU_Only',
  description: '', is_paid: false, price: '', payment_instructions: '',
  banner_file: null, banner_preview: null,
};

const getTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const TODAY = getTodayDate();

function validate(form: FormData): FormErrors {
  const e: FormErrors = {};

  if (!form.title.trim()) e.title = 'Event title is required.';
  if (!form.category) e.category = 'Please select a category.';
  if (!form.venue_id) e.venue_id = 'Please select a venue.';
  if (!form.start_date) e.start_date = 'Start date is required.';
  else if (form.start_date < TODAY) e.start_date = 'Start date cannot be in the past.';

  if (!form.start_time) e.start_time = 'Start time is required.';
  if (!form.end_date) e.end_date = 'End date is required.';
  else if (form.start_date && form.end_date < form.start_date) e.end_date = 'End date must be after start date.';

  if (!form.end_time) e.end_time = 'End time is required.';

  if (!form.capacity || isNaN(+form.capacity) || +form.capacity < 1) e.capacity = 'Enter a valid capacity (min 1).';
  if (!form.description.trim()) e.description = 'Event description is required.';

  if (form.is_paid) {
    if (!form.price || isNaN(+form.price) || +form.price <= 0) e.price = 'Enter a valid price greater than 0.';
    if (!form.payment_instructions.trim()) e.payment_instructions = 'Payment instructions are required for paid events.';
  }

  return e;
}

const STEP1_KEYS: (keyof FormErrors)[] = ['title', 'category', 'venue_id', 'start_date', 'start_time', 'end_date', 'end_time', 'capacity'];

/* ----------------------------------------------------------------
   UI helpers
   ---------------------------------------------------------------- */
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-[14px] font-semibold text-gray-800">{title}</p>
        {subtitle && <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 py-5 flex flex-col gap-5">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-gray-600">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-gray-400">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-[12px] text-red-500">
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const ic = (err?: boolean) =>
  `w-full px-4 py-3 text-[14px] text-gray-900 bg-gray-50 border rounded-lg outline-none transition-all placeholder:text-gray-400
  ${err
    ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_#fee2e2]'
    : 'border-gray-200 hover:border-gray-300 focus:border-green-600 focus:bg-white focus:shadow-[0_0_0_3px_#dcfce7]'}`;

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function CreateEventPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [step, setStep] = useState<1 | 2>(1);

  function update<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k as keyof FormErrors]) setErrors((p) => ({ ...p, [k]: undefined }));
  }

  function handleBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
    const ext = (f.name.split('.').pop() ?? '').toLowerCase();
    if (!allowedExt.includes(ext)) {
      setErrors((p) => ({ ...p, banner_file: 'Invalid file type. Use .jpg, .jpeg, .png, .webp, .heic, or .heif.' }));
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, banner_file: 'File is too large. Maximum size is 5MB.' }));
      return;
    }
    setErrors((p) => ({ ...p, banner_file: undefined }));
    update('banner_file', f);
    update('banner_preview', URL.createObjectURL(f));
  }

  function handleNext() {
    const all = validate(form);
    const step1 = Object.fromEntries(Object.entries(all).filter(([k]) => STEP1_KEYS.includes(k as keyof FormErrors)));
    if (Object.keys(step1).length) { setErrors(step1); return; }
    setErrors({});
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaveState('saving');
    try {
      const token =
        window.localStorage.getItem('auth_token') ??
        window.sessionStorage.getItem('auth_token');

      if (!token) {
        setSaveState('error');
        return;
      }

      const categoryId = EVENT_CATEGORIES.findIndex((c) => c === form.category) + 1;
      const payload = new FormData();
      payload.append('venue_id', String(form.venue_id));
      payload.append('category_id', String(categoryId));
      payload.append('category', String(form.category));
      payload.append('title', form.title.trim());
      payload.append('description', form.description.trim());
      payload.append('start_date', `${form.start_date} ${form.start_time}:00`);
      payload.append('end_date', `${form.end_date} ${form.end_time}:00`);
      payload.append('capacity', String(Number(form.capacity)));
      payload.append('audience_type', form.audience_type);
      payload.append('is_paid', form.is_paid ? '1' : '0');
      payload.append('status', 'Upcoming');
      if (form.is_paid) {
        payload.append('price', String(Number(form.price)));
        payload.append('payment_instructions', form.payment_instructions.trim());
      }
      if (form.banner_file) {
        payload.append('banner_file', form.banner_file);
      }

      const res = await fetch(`${API_BASE_URL}/manage/events`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const response = await res.json().catch(() => null) as
        | { success?: boolean; error?: string; errors?: Record<string, string[] | string> }
        | null;

      if (!res.ok || !response?.success) {
        const fieldErrors: FormErrors = {};
        if (response?.errors && typeof response.errors === 'object') {
          const first = (key: keyof FormErrors) => {
            const val = response.errors?.[key];
            if (Array.isArray(val) && val[0]) fieldErrors[key] = val[0];
            else if (typeof val === 'string') fieldErrors[key] = val;
          };
          first('title');
          first('description');
          first('capacity');
          first('payment_instructions');
          first('price');
          first('venue_id');
          first('start_date');
          first('end_date');
          const catErr = response.errors?.category_id;
          if (Array.isArray(catErr) && catErr[0]) fieldErrors.category = catErr[0];
          else if (typeof catErr === 'string') fieldErrors.category = catErr;
        }

        if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
        setSaveState('error');
        return;
      }

      setSaveState('success');
      await new Promise((r) => setTimeout(r, 600));
      router.push('/manage/events');
    } catch {
      setSaveState('error');
    }
  }

  return (
    <ManageShell pageTitle="Salikop">
      <div className="flex flex-col gap-6 animate-fade-in">

        {/* ── Header ── */}
        <div>
          <Link
            href="/manage/dashboard"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors no-underline w-fit"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Create new event</h1>
            <p className="text-[14px] text-gray-500">Fill in the details to publish an event for your organization.</p>
          </div>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-2">
          {([{ n: 1, label: 'Event details' }, { n: 2, label: 'Content & access' }] as const).map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${step >= s.n ? 'bg-green-600' : 'bg-gray-200'}`} />}
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors
                  ${step === s.n ? 'bg-green-700 text-white' : step > s.n ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {step > s.n
                    ? <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    : s.n}
                </div>
                <span className={`text-[13px] font-medium hidden sm:block ${step === s.n ? 'text-green-700' : 'text-gray-400'}`}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* ── STEP 1: Basic details ── */}
          {step === 1 && (
            <>
              <SectionCard title="Basic information" subtitle="Shown on the event card and detail page">

                <Field label="Event title" required error={errors.title}>
                  <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)}
                    placeholder="e.g. Web Development Summit 2025" maxLength={120} className={ic(!!errors.title)} />
                  <p className="text-[11px] text-gray-400 self-end">{form.title.length}/120</p>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Category" required error={errors.category}>
                    <select value={form.category} onChange={(e) => update('category', e.target.value as EventCategory)} className={`${ic(!!errors.category)} cursor-pointer`}>
                      <option value="">Select category</option>
                      {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Venue" required error={errors.venue_id}>
                    <select value={form.venue_id} onChange={(e) => update('venue_id', e.target.value)} className={`${ic(!!errors.venue_id)} cursor-pointer`}>
                      <option value="">Select venue</option>
                      {VENUES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Start date" required error={errors.start_date}>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => update('start_date', e.target.value)}
                      min={TODAY}
                      className={ic(!!errors.start_date)}
                    />
                  </Field>
                  <Field label="Start time" required error={errors.start_time}>
                    <input type="time" value={form.start_time} onChange={(e) => update('start_time', e.target.value)} className={ic(!!errors.start_time)} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="End date" required error={errors.end_date}>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => update('end_date', e.target.value)}
                      min={form.start_date || TODAY}
                      className={ic(!!errors.end_date)}
                    />
                  </Field>
                  <Field label="End time" required error={errors.end_time}>
                    <input type="time" value={form.end_time} onChange={(e) => update('end_time', e.target.value)} className={ic(!!errors.end_time)} />
                  </Field>
                </div>

                <Field label="Capacity" required hint="Registration closes automatically when this limit is reached." error={errors.capacity}>
                  <div className="relative">
                    <input type="number" value={form.capacity} onChange={(e) => update('capacity', e.target.value)}                        onWheel={(e) => e.currentTarget.blur()}                      min={1} max={10000} placeholder="e.g. 150" className={ic(!!errors.capacity)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 pointer-events-none">slots</span>
                  </div>
                </Field>
              </SectionCard>

              {/* Banner */}
              <SectionCard title="Event banner" subtitle="Displayed on the event card and detail page · PNG or JPG · Max 5MB">
                {!form.banner_preview ? (
                  <label className="flex flex-col items-center justify-center gap-3 h-44 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16V8m0 0l-3 3m3-3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-[14px] font-semibold text-gray-600">Click to upload banner</p>
                      <p className="text-[12px] text-gray-400 mt-0.5">Recommended: 1200×630px · 16:9</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleBanner} className="hidden" />
                  </label>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 h-44 bg-gray-100">
                      <img src={form.banner_preview} alt="Banner" className="w-full h-full object-cover" />
                      <button type="button"
                        onClick={() => { update('banner_file', null); update('banner_preview', null); }}
                        className="absolute top-2.5 right-2.5 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[12px] text-gray-400">{form.banner_file?.name} · {((form.banner_file?.size ?? 0) / 1024).toFixed(0)} KB</p>
                  </div>
                )}
                {errors.banner_file && (
                  <p className="text-[12px] text-red-500">{errors.banner_file}</p>
                )}
              </SectionCard>

              <div className="flex justify-end">
                <button type="button" onClick={handleNext}
                  className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-[14px] font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer">
                  Continue
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Content & access ── */}
          {step === 2 && (
            <>
              {/* Description */}
              <SectionCard title="Event description" subtitle="Full details shown on the event detail page">
                <Field label="Description" required error={errors.description}>
                  <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
                    rows={7} maxLength={3000}
                    placeholder="Tell students what this event is about, what to expect, what to bring..."
                    className={`${ic(!!errors.description)} resize-none leading-relaxed`} />
                  <p className="text-[11px] text-gray-400 self-end">{form.description.length}/3000</p>
                </Field>
              </SectionCard>

              {/* Audience */}
              <SectionCard title="Audience & access" subtitle="Determines who can register — enforced at registration endpoint">
                <div className="flex flex-col gap-3">
                  {AUDIENCE_OPTIONS.map((opt) => {
                    const active = form.audience_type === opt.value;
                    return (
                      <button key={opt.value} type="button" onClick={() => update('audience_type', opt.value)}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer
                          ${active ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50'}`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${active ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className={`text-[14px] font-semibold ${active ? 'text-green-700' : 'text-gray-800'}`}>{opt.label}</p>
                          <p className="text-[12px] text-gray-500 mt-0.5">{opt.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-all ${active ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
                          {active && <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Payment */}
              <SectionCard title="Payment" subtitle="Toggle whether this event requires an entry fee">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <p className="text-[14px] font-semibold text-gray-800">{form.is_paid ? 'Paid event' : 'Free event'}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {form.is_paid
                          ? 'Students must select a payment method (Online or On-site) at registration.'
                          : 'No payment required. Registrations are confirmed automatically upon submission.'}
                      </p>
                    </div>
                    <button type="button" onClick={() => update('is_paid', !form.is_paid)}
                      className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ml-4 ${form.is_paid ? 'bg-green-600' : 'bg-gray-300'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.is_paid ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>

                  {form.is_paid && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      <div className="w-full sm:w-1/2">
                        <Field label="Registration Price" required hint="Amount to be paid in PHP (₱)." error={errors.price}>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-500 font-medium">₱</span>
                            <input type="number" value={form.price} onChange={(e) => update('price', e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              min={1} placeholder="e.g. 150" className={`${ic(!!errors.price)} pl-8`} />
                          </div>
                        </Field>
                      </div>

                      <Field label="Payment instructions" required
                        hint="Shown to students after they choose a payment method. Include GCash number, account name, and reference format."
                        error={errors.payment_instructions}>
                        <textarea value={form.payment_instructions} onChange={(e) => update('payment_instructions', e.target.value)}
                          rows={4} maxLength={600}
                          placeholder="e.g. Pay via GCash: 09XX-XXX-XXXX (Treasurer name). Use your School ID as reference number."
                          className={`${ic(!!errors.payment_instructions)} resize-none`} />
                        <p className="text-[11px] text-gray-400 self-end">{form.payment_instructions.length}/600</p>
                      </Field>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Summary */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-3.5 border-b border-gray-100">
                  <p className="text-[13px] font-semibold text-gray-700">Review before publishing</p>
                </div>
                <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Title', value: form.title || '—' },
                    { label: 'Category', value: form.category || '—' },
                    { label: 'Venue', value: VENUES.find((v) => v.id === form.venue_id)?.name || '—' },
                    { label: 'Capacity', value: form.capacity ? `${form.capacity} slots` : '—' },
                    { label: 'Start', value: form.start_date ? `${form.start_date} ${form.start_time}` : '—' },
                    { label: 'End', value: form.end_date ? `${form.end_date} ${form.end_time}` : '—' },
                    { label: 'Audience', value: AUDIENCE_OPTIONS.find((a) => a.value === form.audience_type)?.label || '—' },
                    { label: 'Payment', value: form.is_paid ? `Paid (₱${form.price || '0'})` : 'Free' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</span>
                      <span className="text-[13px] font-semibold text-gray-800 truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 px-5 py-2.5 rounded-xl transition-colors cursor-pointer">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M16 10H4M9 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Back
                </button>

                {saveState === 'error' && <p className="text-[12px] text-red-500 font-medium">Something went wrong. Try again.</p>}

                <button type="submit" disabled={saveState === 'saving' || saveState === 'success'}
                  className="flex items-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer">
                  {saveState === 'saving' ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>Publishing...</>
                  ) : saveState === 'success' ? (
                    <><svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Published!</>
                  ) : (
                    <><svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M10 2v12M5 9l5-7 5 7M4 17h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>Publish event</>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </ManageShell>
  );
}
