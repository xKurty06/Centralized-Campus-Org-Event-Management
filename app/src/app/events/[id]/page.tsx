'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */
type EventCategory =
  | 'Workshop' | 'Seminar' | 'Competition' | 'Training'
  | 'Outreach' | 'Cultural' | 'Activity' | 'Other';

type EventType = 'Free' | 'Paid';
type RegistrationStatus = 'none' | 'registered' | 'pending';
type PaymentMethod = 'online' | 'onsite';

interface CampusEvent {
  id: string;
  title: string;
  category: EventCategory;
  organization: string;
  orgId: string;
  orgCategory: 'Academic' | 'Non-Academic' | 'Religious';
  date: string;
  time: string;
  endTime: string;
  venue: string;
  type: EventType;
  fee?: number;
  capacity: number;
  registered: number;
  description: string;
  paymentInstructions?: string;
  adviser: string;
  bannerColor: string;
}

/* ----------------------------------------------------------------
   Mock data — replace with API fetch using params.id
   ---------------------------------------------------------------- */
const MOCK_EVENTS: Record<string, CampusEvent> = {
  '1': {
    id: '1',
    title: 'Web Development Summit 2025',
    category: 'Workshop',
    organization: 'Computer Science Society',
    orgId: 'csso',
    orgCategory: 'Academic',
    date: '2025-03-12',
    time: '8:00 AM',
    endTime: '5:00 PM',
    venue: 'Main Hall, CvSU Indang Campus',
    type: 'Free',
    capacity: 150,
    registered: 42,
    adviser: 'Prof. Maria Santos',
    bannerColor: 'bg-blue-100',
    description: `Join us for the Web Development Summit 2025 — a full-day workshop covering modern web technologies, frameworks, and industry best practices. This event is open to all CvSU students who want to level up their web development skills.\n\nTopics covered include:\n• HTML, CSS, and Tailwind fundamentals\n• React and Next.js development\n• RESTful API integration\n• Deployment and DevOps basics\n\nParticipants will work on hands-on projects and receive a certificate of participation upon completion. Bring your laptop and be ready to code!`,
  },
  '2': {
    id: '2',
    title: 'Leadership & Governance Talk',
    category: 'Seminar',
    organization: 'University Student Council',
    orgId: 'usc',
    orgCategory: 'Non-Academic',
    date: '2025-03-15',
    time: '1:00 PM',
    endTime: '4:00 PM',
    venue: 'AVR Building B, CvSU Indang Campus',
    type: 'Paid',
    fee: 50,
    capacity: 80,
    registered: 67,
    adviser: 'Dr. Jose Reyes',
    bannerColor: 'bg-purple-100',
    paymentInstructions: 'Pay via GCash: 09XX-XXX-XXXX (USC Treasurer). Use your School ID as reference. Upload screenshot after registration.',
    description: `The Leadership & Governance Talk is a seminar designed to equip student leaders with the skills and knowledge needed for effective governance and organizational management.\n\nSpeakers include current and former student government officials, faculty advisers, and community leaders who will share their experiences and insights.\n\nAttendees will receive a certificate of participation. The ₱50 registration fee covers the seminar kit and snacks.`,
  },
};

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

const CATEGORY_COLORS: Record<EventCategory, string> = {
  Workshop:    'bg-blue-50 text-blue-700',
  Seminar:     'bg-purple-50 text-purple-700',
  Competition: 'bg-orange-50 text-orange-700',
  Training:    'bg-yellow-50 text-yellow-800',
  Outreach:    'bg-teal-50 text-teal-700',
  Cultural:    'bg-pink-50 text-pink-700',
  Activity:    'bg-indigo-50 text-indigo-700',
  Other:       'bg-gray-100 text-gray-600',
};

/* ----------------------------------------------------------------
   Sub-components
   ---------------------------------------------------------------- */
function DetailItem({
  icon, label, children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-700">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</span>
        <span className="text-[13px] font-semibold text-gray-800 leading-snug">{children}</span>
      </div>
    </div>
  );
}

function PaymentOptionCard({
  method, selected, onSelect, label, description, icon,
}: {
  method: PaymentMethod;
  selected: PaymentMethod | null;
  onSelect: (m: PaymentMethod) => void;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  const active = selected === method;
  return (
    <button
      onClick={() => onSelect(method)}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 cursor-pointer
        ${active ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50'}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
        ${active ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 flex-1">
        <span className={`text-[14px] font-semibold ${active ? 'text-green-700' : 'text-gray-800'}`}>{label}</span>
        <span className="text-[12px] text-gray-500 leading-snug">{description}</span>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
        ${active ? 'border-green-600 bg-green-600' : 'border-gray-300'}`}>
        {active && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        )}
      </div>
    </button>
  );
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
export default function EventDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const event   = MOCK_EVENTS[params.id as string];

  const [status,           setStatus]           = useState<RegistrationStatus>('none');
  const [paymentMethod,    setPaymentMethod]    = useState<PaymentMethod | null>(null);
  const [isRegistering,    setIsRegistering]    = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar role="student" user={{ name: 'Juan dela Cruz', schoolId: '2021-00142', department: 'BSCS 3A' }} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none">
              <path d="M9.172 14.828L12 12m0 0l2.828-2.828M12 12L9.172 9.172M12 12l2.828 2.828M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[18px] font-semibold text-gray-700">Event not found</p>
          <Link href="/events" className="text-[14px] font-semibold text-green-700 hover:underline no-underline">← Back to Events</Link>
        </div>
      </div>
    );
  }

  const spots   = event.capacity - event.registered;
  const isFull  = spots <= 0;
  const fillPct = Math.min((event.registered / event.capacity) * 100, 100);

  async function handleRegister() {
    if (event.type === 'Paid') { setShowPaymentModal(true); return; }
    setIsRegistering(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsRegistering(false);
    setStatus('registered');
    router.push(`/events/${event.id}/registration-success`);
  }

  async function handleConfirmPayment() {
    if (!paymentMethod) return;
    setShowPaymentModal(false);
    setIsRegistering(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsRegistering(false);
    setStatus('pending');
    if (paymentMethod === 'online') {
      router.push(`/events/${event.id}/payment-upload?registration=reg_mock_001`);
    } else {
      router.push(`/events/${event.id}/registration-success`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar role="student" user={{ name: 'Juan dela Cruz', schoolId: '2021-00142', department: 'BSCS 3A' }} />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-6 lg:px-12 py-8 flex flex-col gap-3">

        {/* ── Breadcrumb ── */}
        <Link
              href="/events"
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

              Back to Events  
            </Link>

        {/* ── Banner ── */}
        <div className={`w-full h-56 lg:h-64 rounded-2xl ${event.bannerColor} flex items-center justify-center mb-8 relative overflow-hidden`}>
          <svg className="w-14 h-14 text-gray-300" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div className="absolute bottom-4 left-5 flex items-center gap-2">
            <span className={`text-[12px] font-semibold px-3 py-1 rounded-full ${CATEGORY_COLORS[event.category]}`}>
              {event.category}
            </span>
            {event.type === 'Free'
              ? <span className="text-[12px] font-semibold bg-green-700 text-white px-3 py-1 rounded-full">Free</span>
              : <span className="text-[12px] font-semibold bg-amber-500 text-white px-3 py-1 rounded-full">₱{event.fee}</span>
            }
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Title + org */}
            <div className="flex flex-col gap-3">
              <h1 className="text-[26px] font-bold text-gray-900 leading-tight tracking-tight">{event.title}</h1>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-700" viewBox="0 0 20 20" fill="none">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-800">{event.organization}</p>
                  <p className="text-[11px] text-gray-400">{event.orgCategory} Organization</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-200" />

            {/* Details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailItem icon={<IconCalendar />} label="Date">{formatDate(event.date)}</DetailItem>
              <DetailItem icon={<IconClock />} label="Time">{event.time} – {event.endTime}</DetailItem>
              <DetailItem icon={<IconPin />} label="Venue">{event.venue}</DetailItem>
              <DetailItem icon={<IconUsers />} label="Capacity">{event.registered} / {event.capacity} registered</DetailItem>
              <DetailItem icon={<IconTag />} label="Entry">
                {event.type === 'Free'
                  ? <span className="text-green-700">Free</span>
                  : <span className="text-amber-600">₱{event.fee}</span>
                }
              </DetailItem>
              <DetailItem icon={<IconAdviser />} label="Adviser">{event.adviser}</DetailItem>
            </div>

            <div className="h-px bg-gray-200" />

            {/* About */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[18px] font-bold text-gray-900">About this event</h2>
              {event.description.split('\n').map((line, i) => (
                <p key={i} className="text-[14px] text-gray-600 leading-relaxed">{line}</p>
              ))}
            </div>

            {/* Payment instructions */}
            {event.type === 'Paid' && event.paymentInstructions && (
              <>
                <div className="h-px bg-gray-200" />
                <div className="flex flex-col gap-3">
                  <h2 className="text-[18px] font-bold text-gray-900">Payment instructions</h2>
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <p className="text-[13px] text-amber-800 leading-relaxed">{event.paymentInstructions}</p>
                  </div>
                </div>
              </>
            )}

            <div className="h-px bg-gray-200" />

            {/* Organizer card */}
            <div className="flex flex-col gap-3">
              <h2 className="text-[18px] font-bold text-gray-900">Organizer</h2>
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-green-700" viewBox="0 0 20 20" fill="none">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-800">{event.organization}</p>
                    <p className="text-[12px] text-gray-400">{event.orgCategory} Organization</p>
                    <p className="text-[12px] text-gray-400">Adviser: {event.adviser}</p>
                  </div>
                </div>
                <Link
                  href={`/organizations/${event.orgId}`}
                  className="text-[13px] font-semibold text-green-700 hover:text-green-800 border border-green-200 hover:border-green-400 px-3 py-1.5 rounded-lg transition-all no-underline whitespace-nowrap"
                >
                  View profile
                </Link>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Registration panel ── */}
          <div className="lg:w-[300px] flex-shrink-0">
            <div className="sticky top-[80px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <p className="text-[13px] font-semibold text-gray-800">Register for this event</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Secure your slot now</p>
              </div>

              <div className="px-5 py-5 flex flex-col gap-4">

                {/* Slots bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">Available slots</span>
                    <span className={`text-[12px] font-semibold ${isFull ? 'text-red-500' : 'text-green-700'}`}>
                      {isFull ? 'Full' : `${spots} left`}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-green-600'}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">{event.registered} of {event.capacity} registered</p>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Fee */}
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-gray-500">Entry fee</span>
                  {event.type === 'Free'
                    ? <span className="text-[15px] font-bold text-green-700">Free</span>
                    : <span className="text-[15px] font-bold text-amber-600">₱{event.fee}</span>
                  }
                </div>

                <div className="h-px bg-gray-100" />

                {/* Registering as */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] text-gray-500">Registering as</span>
                  <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-green-700">JD</span>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[12px] font-semibold text-gray-800">Juan dela Cruz</span>
                      <span className="text-[11px] text-gray-400">2021-00142 · BSCS 3A</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                {status === 'none' && (
                  <button
                    onClick={handleRegister}
                    disabled={isFull || isRegistering}
                    className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    {isRegistering ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                        </svg>
                        Registering...
                      </>
                    ) : isFull ? 'Event is Full' : (
                      <>Register now <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></>
                    )}
                  </button>
                )}

                {status === 'registered' && (
                  <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <p className="text-[13px] font-semibold text-green-700">You're registered!</p>
                      <p className="text-[11px] text-green-600">Check My Events for details.</p>
                    </div>
                  </div>
                )}

                {status === 'pending' && (
                  <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <p className="text-[13px] font-semibold text-amber-700">Pending payment</p>
                      <p className="text-[11px] text-amber-600">Complete payment to confirm.</p>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                  By registering, you confirm attendance and agree to the event guidelines.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[12px] text-gray-400">© {new Date().getFullYear()} Cavite State University · SALIKOP</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline">Privacy Policy</Link>
            <Link href="#" className="text-[12px] text-gray-400 hover:text-gray-600 no-underline">Contact Support</Link>
          </div>
        </div>
      </footer>

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-gray-900">Choose payment method</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">How would you like to pay the ₱{event.fee} fee?</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-3">
              <PaymentOptionCard
                method="online"
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                label="Pay online"
                description="Pay via GCash or bank transfer then upload your proof of payment screenshot."
                icon={<svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M3 10h14M3 6h14M3 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              />
              <PaymentOptionCard
                method="onsite"
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                label="Pay on-site"
                description="Pay in cash at the venue on the day of the event. Your slot will be reserved."
                icon={<svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              />

              {paymentMethod === 'online' && event.paymentInstructions && (
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p className="text-[12px] text-amber-800 leading-relaxed">{event.paymentInstructions}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[13px] font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={!paymentMethod}
                className="text-[13px] font-semibold bg-green-700 hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Confirm & Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconCalendar() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function IconClock() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M10 6v4.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function IconPin() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M10 2C7.24 2 5 4.24 5 7c0 4.5 5 11 5 11s5-6.5 5-11c0-2.76-2.24-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function IconUsers() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM3 17a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function IconTag() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M9.243 3H5a2 2 0 00-2 2v4.243a1 1 0 00.293.707l7.757 7.757a2 2 0 002.828 0l3.172-3.172a2 2 0 000-2.828L9.95 3.293A1 1 0 009.243 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="6.5" cy="7.5" r="1" fill="currentColor"/></svg>;
}
function IconAdviser() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 1114 0H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}