'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}
function formatDateRange(startIso: string, endIso?: string) {
  const start = new Date(startIso);
  const end = new Date(endIso ?? startIso);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return formatDate(startIso);
  return `${formatDate(startIso)} - ${formatDate(end.toISOString())}`;
}
function formatPrice(value?: number) {
  return Number(value ?? 0).toLocaleString('en-PH');
}

/* ----------------------------------------------------------------
   Main Content Component (Reads Search Params)
   ---------------------------------------------------------------- */
function SuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  // 1. Add isLoading state here
  const [isLoading, setIsLoading] = useState(true);

  const [event, setEvent] = useState({
    id: String(eventId ?? ''),
    slug: String(eventId ?? ''),
    title: 'Event',
    date: new Date().toISOString(),
    endDate: new Date().toISOString(),
    time: '-',
    endTime: '-',
    venue: 'TBA',
    type: 'Free' as 'Free' | 'Paid',
    fee: 0,
    organization: 'Organization',
  });

  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const token = window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });

        if (!res.ok) return;

        const payload = await res.json() as any;
        if (!payload?.success || !payload?.data) return;

        const e = payload.data;
        const startDate = String(e.start_date ?? new Date().toISOString());
        const endDate = String(e.end_date ?? startDate);

        setEvent({
          id: String(e.id ?? eventId),
          slug: String(e.slug ?? eventId ?? ''),
          title: String(e.title ?? 'Event'),
          date: startDate,
          endDate: endDate,
          time: new Date(startDate).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }),
          endTime: new Date(endDate).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }),
          venue: String(e.venue_name ?? 'TBA'),
          type: Boolean(e.is_paid) ? 'Paid' : 'Free',
          fee: Number(e.fee_amount ?? 0),
          organization: String(e.organization_name ?? 'Organization'),
        });
      } catch (error) {
        console.error("Failed to fetch event data:", error);
      } finally {
        // 2. Ensure loading is set to false whether the fetch succeeds or fails
        setIsLoading(false);
      }
    })();
  }, [eventId]);

  // 3. Render a loading skeleton/spinner while fetching
  if (isLoading) {
    return (
      <main className="flex-1 w-full max-w-[560px] mx-auto px-6 py-12 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-green-200 border-t-green-700" />
      </main>
    );
  }

  // 4. State calculations now only run on the final resolved data
  const rawMethod = searchParams.get('method') || searchParams.get('paymentMode') || searchParams.get('type') || '';
  const isOnsiteChosen = /onsite|on-site/i.test(rawMethod);
  const isPaidEvent = event.type === 'Paid' || event.fee > 0;

  const state: 'confirmed' | 'pending-online' | 'pending-onsite' =
    isPaidEvent
      ? (isOnsiteChosen ? 'pending-onsite' : 'pending-online')
      : 'confirmed';

  const stateConfig = {
    confirmed: {
      icon: (
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      badge: <span className="text-[12px] font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">Confirmed</span>,
      title: "You're registered!",
      message: 'Your registration has been confirmed. See you at the event!',
      color: 'border-green-200',
    },
    'pending-online': {
      icon: (
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-amber-600" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      badge: <span className="text-[12px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-full">Pending Verification</span>,
      title: 'Payment Pending Review',
      message: 'Your proof of payment has been submitted. An officer will verify it and confirm your slot shortly.',
      color: 'border-amber-200',
    },
    'pending-onsite': {
      icon: (
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      badge: <span className="text-[12px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full">Pending On-site Payment</span>,
      title: 'Registration Pending Payment',
      message: 'Your slot has been temporarily reserved. Please settle the entry fee at the venue to complete your registration.',
      color: 'border-blue-200',
    },
  };

  const cfg = stateConfig[state];

  return (
    <main className="flex-1 w-full max-w-[560px] mx-auto px-6 py-12 flex flex-col gap-6">
      {/* ── Success card ── */}
      <div className={`bg-white rounded-2xl border ${cfg.color} shadow-sm overflow-hidden`}>

        {/* Top section */}
        <div className="flex flex-col items-center text-center px-8 py-10 gap-4">
          {cfg.icon}
          {cfg.badge}
          <div className="flex flex-col gap-2">
            <h1 className="text-[24px] font-bold text-gray-900">{cfg.title}</h1>
            <p className="text-[14px] text-gray-500 leading-relaxed max-w-sm">{cfg.message}</p>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Event summary */}
        <div className="px-6 py-5 flex flex-col gap-3">
          <h2 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">Event details</h2>

          <div className="flex flex-col gap-2.5">
            <SummaryRow icon={<IconTitle />} label={event.title} sublabel={event.organization} />
            <SummaryRow icon={<IconCalendar />} label={formatDateRange(event.date, event.endDate)} sublabel={`${event.time} - ${event.endTime}`} />
            <SummaryRow icon={<IconPin />} label={event.venue} />
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* School ID reminder */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-700" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a4 4 0 100 8 4 4 0 000-8zM4 16a6 6 0 1112 0H4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[13px] font-semibold text-gray-800">Bring your Student ID</p>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                Present your CvSU Student ID at the entrance for verification. Your registered ID is{' '}
                <span className="font-semibold text-green-700">202105142</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Next steps for pending states */}
        {state !== 'confirmed' && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="px-6 py-4">
              <h2 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Next steps</h2>
              <div className="flex flex-col gap-2.5">
                {state === 'pending-online' && (
                  <>
                    <StepItem number={1} text="An officer will review your payment screenshot." done />
                    <StepItem number={2} text="You'll receive a confirmation notification once verified." />
                    <StepItem number={3} text="Present your Student ID at the entrance on the event day." />
                  </>
                )}
                {state === 'pending-onsite' && (
                  <>
                    <StepItem number={1} text="Arrive at the venue on the event day." />
                    <StepItem number={2} text={`Pay the ₱${event.fee} entry fee at the registration table.`} />
                    <StepItem number={3} text="Present your Student ID for final verification." />
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-col gap-3">
        <Link
          href="/my-events"
          className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white text-[14px] font-semibold py-3 rounded-xl transition-colors no-underline"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
            <path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          View in My Events
        </Link>
        <Link
          href="/events"
          className="w-full flex items-center justify-center text-[14px] font-medium text-gray-500 hover:text-gray-700 py-3 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors no-underline"
        >
          Browse more events
        </Link>
      </div>
    </main>
  );
}

/* ----------------------------------------------------------------
   Page Wrapper (Includes Footer and Suspense)
   ---------------------------------------------------------------- */
export default function RegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Suspense fallback={
        <main className="flex-1 w-full max-w-[560px] mx-auto px-6 py-12 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-green-200 border-t-green-700" />
        </main>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}

/* ----------------------------------------------------------------
   Sub-components
   ---------------------------------------------------------------- */
function SummaryRow({
  icon, label, sublabel,
}: { icon: React.ReactNode; label: string; sublabel?: string }) {
  return (
    <div className={`flex gap-3 ${sublabel ? 'items-start' : 'items-center'}`}>
      {/* Icon Wrapper */}
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
        {icon}
      </div>

      {/* Text Container */}
      <div className="flex flex-col leading-tight">
        <span className="text-[13px] font-semibold text-gray-800">{label}</span>
        {sublabel && (
          <span className="text-[12px] text-gray-400 mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

// Left step item visual indicators
function StepItem({ number, text, done }: { number: number; text: string; done?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold
        ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {done
          ? <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          : number
        }
      </div>
      <p className="text-[13px] text-gray-600 leading-snug pt-0.5">{text}</p>
    </div>
  );
}

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconTitle() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function IconCalendar() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function IconPin() {
  return <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none"><path d="M10 2C7.24 2 5 4.24 5 7c0 4.5 5 11 5 11s5-6.5 5-11c0-2.76-2.24-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}



