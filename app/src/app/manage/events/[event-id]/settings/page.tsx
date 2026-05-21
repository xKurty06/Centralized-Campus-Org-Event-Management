'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ManageShell from '@/components/ManageShell';

/* ----------------------------------------------------------------
   Types — aligned to DB schema
   ---------------------------------------------------------------- */
type EventStatus = 'Upcoming' | 'Open' | 'Full' | 'Closed' | 'Completed' | 'Cancelled';

interface EventDetail {
    id: string;
    title: string;
    status: EventStatus;
    start_date: string;
    total_registered: number;
    total_paid: number;
}

/* ----------------------------------------------------------------
   Mock data — replace with GET /api/manage/events/:id
   ---------------------------------------------------------------- */
const MOCK_EVENT: EventDetail = {
    id: 'evt_010',
    title: 'Data Science Bootcamp',
    status: 'Upcoming',
    start_date: '2025-04-14T08:00:00',
    total_registered: 38,
    total_paid: 20,
};

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', {
        month: 'long', day: 'numeric', year: 'numeric',
    });
}

/* ----------------------------------------------------------------
   Danger action card
   ---------------------------------------------------------------- */
interface DangerCardProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    consequence: string;
    buttonLabel: string;
    buttonStyle: string;
    disabled?: boolean;
    disabledReason?: string;
    onClick: () => void;
}

function DangerCard({
    icon, iconBg, title, description, consequence,
    buttonLabel, buttonStyle, disabled, disabledReason, onClick,
}: DangerCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-900">{title}</p>
                <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{description}</p>
                <p className="text-[11px] font-medium text-gray-400 mt-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 3v4m0 2.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    {consequence}
                </p>
                {disabled && disabledReason && (
                    <p className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-3 inline-block">
                        {disabledReason}
                    </p>
                )}
            </div>
            <button
                onClick={onClick}
                disabled={disabled}
                className={`flex-shrink-0 text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer border-0 ${buttonStyle} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
                {buttonLabel}
            </button>
        </div>
    );
}

/* ----------------------------------------------------------------
   Confirm modal
   ---------------------------------------------------------------- */
interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel: string;
    confirmStyle: string;
    inputConfirm?: string;      // if set, user must type this string to confirm
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmModal({
    title, message, confirmLabel, confirmStyle, inputConfirm, onConfirm, onCancel,
}: ConfirmModalProps) {
    const [typed, setTyped] = useState('');
    const canConfirm = !inputConfirm || typed === inputConfirm;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5 animate-fade-in">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="none">
                            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[15px] font-bold text-gray-900">{title}</p>
                        <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{message}</p>
                    </div>
                </div>

                {inputConfirm && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-semibold text-gray-600">
                            Type <span className="font-bold text-gray-900">{inputConfirm}</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={typed}
                            onChange={e => setTyped(e.target.value)}
                            placeholder={inputConfirm}
                            className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            autoFocus
                        />
                    </div>
                )}

                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors cursor-pointer border-0"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!canConfirm}
                        className={`text-[13px] font-semibold text-white px-4 py-2 rounded-lg transition-all border-0 cursor-pointer ${confirmStyle} ${!canConfirm ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ----------------------------------------------------------------
   Page
   ---------------------------------------------------------------- */
type ModalType = 'archive' | 'cancel' | 'delete' | null;
type ActionState = 'idle' | 'loading' | 'done';

export default function EventSettingsPage() {
    const params = useParams();
    const eventId = params['event-id'] as string;

    // TODO: fetch real event by eventId
    const event = MOCK_EVENT;

    const [modal, setModal] = useState<ModalType>(null);
    const [state, setState] = useState<ActionState>('idle');
    const [toast, setToast] = useState('');

    const isCompleted = event.status === 'Completed';
    const isCancelled = event.status === 'Cancelled';
    const isArchivable = isCompleted || isCancelled;

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    }

    async function handleConfirm() {
        setState('loading');
        setModal(null);

        // TODO: replace with real API calls
        // archive → PATCH /api/manage/events/:id { status: 'Closed' }
        // cancel  → PATCH /api/manage/events/:id { status: 'Cancelled' }
        // delete  → DELETE /api/manage/events/:id

        await new Promise(r => setTimeout(r, 1000)); // placeholder

        const messages: Record<NonNullable<ModalType>, string> = {
            archive: 'Event archived successfully.',
            cancel: 'Event has been cancelled.',
            delete: 'Event deleted.',
        };

        setState('done');
        showToast(messages[modal ?? 'archive']);
    }

    const modalConfig: Record<NonNullable<ModalType>, {
        title: string; message: string; confirmLabel: string;
        confirmStyle: string; inputConfirm?: string;
    }> = {
        archive: {
            title: 'Archive this event?',
            message: `"${event.title}" will be closed from new registrations and moved to your archive. Existing registrations and attendance records are preserved.`,
            confirmLabel: 'Archive event',
            confirmStyle: 'bg-amber-600 hover:bg-amber-700',
        },
        cancel: {
            title: 'Cancel this event?',
            message: `"${event.title}" will be marked as Cancelled. All ${event.total_registered} registered participants will be notified. This action cannot be undone.`,
            confirmLabel: 'Cancel event',
            confirmStyle: 'bg-red-600 hover:bg-red-700',
        },
        delete: {
            title: 'Permanently delete this event?',
            message: `This will permanently remove "${event.title}" and all associated registrations, payment proofs, and attendance records. This cannot be recovered.`,
            confirmLabel: 'Delete permanently',
            confirmStyle: 'bg-red-700 hover:bg-red-800',
            inputConfirm: 'DELETE',
        },
    };

    const cfg = modal ? modalConfig[modal] : null;

    return (
        <ManageShell pageTitle="Salikop">
            <div className="flex flex-col gap-6 animate-fade-in">

                {/* ── Breadcrumb + header ── */}
                <div className="flex flex-col gap-3">
                    <nav className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-muted)] flex-wrap">
                        <Link
                            href="/manage/events"
                            className="hover:text-[var(--color-primary)] transition-colors no-underline"
                        >
                            Events
                        </Link>
                        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none">
                            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <Link
                            href={`/manage/events/${event.id}`}
                            className="hover:text-[var(--color-primary)] transition-colors no-underline truncate max-w-[180px] sm:max-w-xs"
                        >
                            {event.title}
                        </Link>
                        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none">
                            <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-[var(--color-text)] font-semibold">Event Settings</span>
                    </nav>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">Event Settings</h1>
                            <p className="text-[13px] text-gray-400 mt-0.5">{event.title}</p>
                        </div>
                        <Link
                            href={`/manage/events/${eventId}`}
                            className="flex-shrink-0 flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all no-underline"
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            Back to event
                        </Link>
                    </div>
                </div>

                {/* ── Event info strip ── */}
                <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            <svg className="w-4.5 h-4.5 text-blue-600" viewBox="0 0 20 20" fill="none">
                                <path d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[14px] font-bold text-gray-900">{event.title}</p>
                            <p className="text-[12px] text-gray-400">{formatDate(event.start_date)} · {event.total_registered} registered</p>
                        </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border self-start sm:self-auto
            ${event.status === 'Open' ? 'bg-green-50 text-green-700 border-green-200' :
                            event.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                event.status === 'Completed' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                    event.status === 'Cancelled' ? 'bg-red-50 text-red-500 border-red-200' :
                                        'bg-gray-100 text-gray-500 border-gray-200'}`}
                    >
                        {event.status}
                    </span>
                </div>

                {/* ── Section: Visibility ── */}
                <section className="flex flex-col gap-3">
                    <div>
                        <h2 className="text-[14px] font-bold text-gray-800">Visibility & State</h2>
                        <p className="text-[12px] text-gray-400 mt-0.5">Control who can see this event and its current registration state.</p>
                    </div>
                    <DangerCard
                        icon={<IconArchive />}
                        iconBg="bg-amber-50 text-amber-600"
                        title="Archive event"
                        description="Close this event to new registrations and move it out of the active events list. All existing registration and attendance data is preserved and remains accessible."
                        consequence="Only available after the event is Completed or Cancelled."
                        buttonLabel="Archive"
                        buttonStyle="bg-amber-600 hover:bg-amber-700 text-white"
                        disabled={!isArchivable}
                        disabledReason={!isArchivable ? `Event must be Completed or Cancelled first (current: ${event.status})` : undefined}
                        onClick={() => setModal('archive')}
                    />
                </section>

                <hr className="border-gray-100" />

                {/* ── Section: Danger zone ── */}
                <section className="flex flex-col gap-3">
                    <div>
                        <h2 className="text-[14px] font-bold text-red-600">Danger Zone</h2>
                        <p className="text-[12px] text-gray-400 mt-0.5">Irreversible actions. Proceed with caution.</p>
                    </div>

                    <div className="rounded-xl border border-red-200 overflow-hidden divide-y divide-red-100">
                        {/* Cancel */}
                        <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                                <IconCancel />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-gray-900">Cancel event</p>
                                <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                                    Mark this event as Cancelled. All {event.total_registered} registered participants will be notified via in-app notification.
                                    Registration will be immediately disabled.
                                </p>
                                <p className="text-[11px] font-medium text-gray-400 mt-2 flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 3v4m0 2.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                    </svg>
                                    Registration data and payment records are retained for your records.
                                </p>
                            </div>
                            <button
                                onClick={() => setModal('cancel')}
                                disabled={isCancelled}
                                className={`flex-shrink-0 text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer border border-red-300 text-red-600 bg-white hover:bg-red-50 ${isCancelled ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                                {isCancelled ? 'Already cancelled' : 'Cancel event'}
                            </button>
                        </div>

                        {/* Delete */}
                        <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-red-700">
                                <IconTrash />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-gray-900">Delete event permanently</p>
                                <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                                    Permanently removes this event and all associated data — registrations, payment proofs, and attendance records.
                                    This action <strong className="font-semibold text-gray-700">cannot be undone</strong>.
                                </p>
                                {event.total_registered > 0 && (
                                    <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 mt-3 inline-block">
                                        ⚠ {event.total_registered} registration records will be permanently lost
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setModal('delete')}
                                className="flex-shrink-0 text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer border-0 bg-red-700 hover:bg-red-800 text-white"
                            >
                                Delete event
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── Info box ── */}
                <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                    <svg className="w-4.5 h-4.5 text-gray-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <p className="text-[12px] text-gray-500 leading-relaxed">
                        All destructive actions are logged with your officer account ID and timestamp for administrative audit purposes.
                        If you need to recover a deleted event, contact your system administrator.
                    </p>
                </div>

            </div>

            {/* ── Confirm modal ── */}
            {modal && cfg && (
                <ConfirmModal
                    title={cfg.title}
                    message={cfg.message}
                    confirmLabel={cfg.confirmLabel}
                    confirmStyle={cfg.confirmStyle}
                    inputConfirm={cfg.inputConfirm}
                    onConfirm={handleConfirm}
                    onCancel={() => setModal(null)}
                />
            )}

            {/* ── Loading overlay ── */}
            {state === 'loading' && (
                <div className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 shadow-lg px-6 py-4">
                        <svg className="w-5 h-5 text-green-600 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
                            <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <p className="text-[13px] font-semibold text-gray-700">Processing…</p>
                    </div>
                </div>
            )}

            {/* ── Toast ── */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-[13px] font-medium px-5 py-3 rounded-xl shadow-xl animate-fade-in flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-green-400" viewBox="0 0 20 20" fill="none">
                        <path d="M5 10l4 4 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {toast}
                </div>
            )}

        </ManageShell>
    );
}

/* ----------------------------------------------------------------
   Icons
   ---------------------------------------------------------------- */
function IconArchive() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v1H3V5zm0 3h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
function IconCancel() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
function IconTrash() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <path d="M4 6h12M8 6V4h4v2M7 6v9a1 1 0 001 1h4a1 1 0 001-1V6H7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}