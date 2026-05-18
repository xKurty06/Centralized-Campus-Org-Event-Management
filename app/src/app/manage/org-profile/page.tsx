'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

/* ----------------------------------------------------------------
   Types — aligned to DB schema

   Organizations table:
     id, name, description, logo_url, adviser,
     category_id → Org_Categories(name: Academic|Non-Academic|Religious),
     accreditation_status (Active|Suspended),
     accredited_by, accredited_at
   ---------------------------------------------------------------- */

type OrgCategory = 'Academic' | 'Non-Academic' | 'Religious';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface OrgProfile {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  adviser: string;
  category: OrgCategory;
  accreditation_status: 'Active' | 'Suspended';
  accredited_at: string;
}

/* ----------------------------------------------------------------
   Mock — replace with GET /api/manage/org-profile
   ---------------------------------------------------------------- */
const MOCK_ORG: OrgProfile = {
  id: 'csso',
  name: 'Computer Science Society',
  description: 'The Computer Science Society (CSSO) is the official academic organization of BS Computer Science students at Cavite State University. We are committed to fostering a culture of innovation, technical excellence, and professional development among our members.\n\nThrough workshops, hackathons, seminars, and industry partnerships, CSSO bridges the gap between academic learning and real-world technology practice.',
  logo_url: null,
  adviser: 'Prof. Maria Santos',
  category: 'Academic',
  accreditation_status: 'Active',
  accredited_at: '2024-06-15T10:00:00',
};

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const CATEGORY_META: Record<OrgCategory, { color: string; bg: string }> = {
  'Academic': { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  'Non-Academic': { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  'Religious': { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

/* ----------------------------------------------------------------
   Form card wrapper
   ---------------------------------------------------------------- */
function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <p className="text-[13px] font-semibold text-gray-700">{title}</p>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

function ConnectionBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-300
      ${isOnline
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
      {isOnline ? 'Online' : 'Offline Mode'}
    </div>
  );
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function ManageOrgProfilePage() {
  const org = MOCK_ORG;

  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description);
  const [adviser, setAdviser] = useState(org.adviser);
  const [logoPreview, setLogoPreview] = useState<string | null>(org.logo_url);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = useState(true);

  const isDirty =
    name !== org.name ||
    description !== org.description ||
    adviser !== org.adviser ||
    logoFile !== null;

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    setSaveState('saving');
    // TODO: PATCH /api/manage/org-profile { name, description, adviser, logo }
    await new Promise((r) => setTimeout(r, 1200));
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 3000);
  }

  function discardChanges() {
    setName(org.name);
    setDescription(org.description);
    setAdviser(org.adviser);
    setLogoFile(null);
    setLogoPreview(org.logo_url);
    setSaveState('idle');
  }

  const catMeta = CATEGORY_META[org.category];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] font-sans">
      <Navbar role="officer" user={{ name: 'Maria Clara Santos', schoolId: '2021-00101', department: 'BSCS 4A' }} />

      <main className="max-w-[1240px] mx-auto px-6 py-8 flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

          {/* LEFT */}
          <div className="flex flex-col gap-3">
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

            <h1 className="text-[26px] font-bold text-[var(--color-text)] tracking-tight">
              Edit Org Profile
            </h1>
          </div>

          {/* RIGHT */}
          {/* RIGHT */}
          <div className="flex flex-col items-start lg:items-end gap-2 self-start lg:self-auto">

            <ConnectionBadge isOnline={isOnline} />

            <Link
              href={`/organizations/${org.id}`}
              target="_blank"
              className="flex items-center gap-2 text-[13px] font-semibold text-text-secondary border border-border hover:bg-surface-2 hover:text-text px-4 py-2 rounded-lg transition-all no-underline"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                <path
                  d="M2 10c1.73-2.49 4.58-5 8-5s6.27 2.51 8 5c-1.73 2.49-4.58 5-8 5s-6.27-2.51-8-5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>

              View public profile
            </Link>
          </div>

        </div>


        {/* ── Accreditation read-only strip ── */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {org.accreditation_status === 'Active' ? (
              <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Active · Accredited
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[12px] font-semibold bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />Suspended
              </span>
            )}
            <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border ${catMeta.bg} ${catMeta.color}`}>
              {org.category}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-gray-500">Last updated: <span className="font-medium text-gray-700">{formatDate(org.accredited_at)}</span></p>
            <p className="text-[11px] text-gray-400 mt-0.5">Accreditation is managed by OSA</p>
          </div>
        </div>

        {/* ── Suspended alert ── */}
        {org.accreditation_status === 'Suspended' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-[13px] font-semibold text-red-700">Organization is suspended</p>
              <p className="text-[12px] text-red-600 mt-0.5">You can still update your profile, but you cannot publish new events while suspended. Contact OSA to restore accreditation.</p>
            </div>
          </div>
        )}

        {/* ── Two-column form ── */}
        <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-5">

          {/* LEFT — editable fields */}
          <div className="flex-1 flex flex-col gap-5">

            <FormCard title="Organization name">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-600">Full official name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required maxLength={120}
                  placeholder="e.g. Computer Science Society"
                  className="w-full px-4 py-3 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 focus:bg-white focus:shadow-[0_0_0_3px_#dcfce7] transition-all placeholder:text-gray-400"
                />
                <p className="text-[11px] text-gray-400 self-end">{name.length}/120</p>
              </div>
            </FormCard>

            <FormCard title="About the organization">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-600">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required rows={8} maxLength={1500}
                  placeholder="Tell students what your organization is about, what you do, and why they should join..."
                  className="w-full px-4 py-3 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none resize-none focus:border-green-600 focus:bg-white focus:shadow-[0_0_0_3px_#dcfce7] transition-all placeholder:text-gray-400 leading-relaxed"
                />
                <p className="text-[11px] text-gray-400 self-end">{description.length}/1500</p>
              </div>
            </FormCard>

            <FormCard title="Faculty adviser">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-600">Adviser name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={adviser}
                  onChange={(e) => setAdviser(e.target.value)}
                  required
                  placeholder="e.g. Prof. Maria Santos"
                  className="w-full px-4 py-3 text-[14px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-600 focus:bg-white focus:shadow-[0_0_0_3px_#dcfce7] transition-all placeholder:text-gray-400"
                />
                <p className="text-[11px] text-gray-400">Include honorific — Prof., Dr., Engr., etc.</p>
              </div>
            </FormCard>
          </div>

          {/* RIGHT — logo + preview + save */}
          <div className="lg:w-[290px] flex flex-col gap-5 flex-shrink-0">

            {/* Logo */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <p className="text-[13px] font-semibold text-gray-700">Organization logo</p>
                <p className="text-[11px] text-gray-400 mt-0.5">PNG or JPG · Max 2MB · Square recommended</p>
              </div>
              <div className="px-5 py-5 flex flex-col items-center gap-4">
                {/* Preview circle */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      : <span className="text-[22px] font-bold text-gray-300">{getInitials(name)}</span>
                    }
                  </div>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <svg className="w-3 h-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full text-[13px] font-semibold text-green-700 border border-green-200 hover:bg-green-50 hover:border-green-400 px-4 py-2.5 rounded-lg transition-all cursor-pointer"
                >
                  {logoPreview ? 'Replace logo' : 'Upload logo'}
                </button>
              </div>
            </div>

            {/* Live preview */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <p className="text-[13px] font-semibold text-gray-700">Directory preview</p>
              </div>
              <div className="px-5 py-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-blue-700 overflow-hidden">
                    {logoPreview
                      ? <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                      : getInitials(name)
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug">{name || 'Organization name'}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{org.category}</p>
                  </div>
                </div>
                <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-3">
                  {description || 'Your description will appear here.'}
                </p>
                <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
                  <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="none">
                    <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-[11px] text-gray-400 truncate">Adviser: {adviser || '—'}</p>
                </div>
              </div>
            </div>

            {/* Save actions */}
            <div className="flex flex-col gap-2">
              {saveState === 'saved' && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-[12px] font-semibold text-green-700">Profile saved successfully</p>
                </div>
              )}
              {saveState === 'error' && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-[12px] font-semibold text-red-600">Save failed. Try again.</p>
                </div>
              )}
              <button
                type="submit"
                disabled={!isDirty || saveState === 'saving'}
                className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13px] font-semibold py-3 rounded-xl transition-colors cursor-pointer"
              >
                {saveState === 'saving' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                      <path d="M16.5 3.5l-10 10L3 17l3.5-3.5 10-10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Save changes
                  </>
                )}
              </button>
              {isDirty && (
                <button
                  type="button"
                  onClick={discardChanges}
                  className="w-full text-[13px] font-medium text-gray-500 hover:text-gray-700 border border-gray-200 hover:bg-gray-100 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Discard changes
                </button>
              )}
            </div>

            {/* Read-only note */}
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                <span className="font-semibold">Category and accreditation status</span> are controlled by the OSA and cannot be edited here.
              </p>
            </div>
          </div>
        </form>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-gray-400">© {new Date().getFullYear()} Cavite State University · Office of Student Affairs</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline">Privacy Policy</Link>
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}