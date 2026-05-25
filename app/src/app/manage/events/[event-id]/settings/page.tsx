"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ManageShell from "@/components/ManageShell";

type EventStatus =
    | "Upcoming"
    | "Open"
        | "Closed"
    | "Completed"
    | "Cancelled";

interface EventDetail {
    id: string;
    title: string;
    status: EventStatus;
    start_date: string;
    total_registered: number;
    total_paid: number;
}

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

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
    icon,
    iconBg,
    title,
    description,
    consequence,
    buttonLabel,
    buttonStyle,
    disabled,
    disabledReason,
    onClick,
}: DangerCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-start gap-4">
            <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
            >
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-gray-900">{title}</p>
                <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                    {description}
                </p>
                <p className="text-[11px] font-medium text-gray-400 mt-2 flex items-center gap-1.5">
                    <svg
                        className="w-3.5 h-3.5 flex-shrink-0"
                        viewBox="0 0 16 16"
                        fill="none"
                    >
                        <path
                            d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 3v4m0 2.5v.5"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                        />
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
                className={`flex-shrink-0 text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer border-0 ${buttonStyle} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
                {buttonLabel}
            </button>
        </div>
    );
}

interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel: string;
    confirmStyle: string;
    inputConfirm?: string;
    reasonLabel?: string;
    reason?: string;
    onReasonChange?: (reason: string) => void;
    showStatusSelect?: boolean;
    statusValue?: "Upcoming" | "Open";
    onStatusChange?: (status: "Upcoming" | "Open") => void;
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmModal({
    title,
    message,
    confirmLabel,
    confirmStyle,
    inputConfirm,
    reasonLabel,
    reason,
    onReasonChange,
    showStatusSelect,
    statusValue,
    onStatusChange,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const [typed, setTyped] = useState("");
    const canConfirm = !inputConfirm || typed === inputConfirm;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5 animate-fade-in">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg
                            className="w-5 h-5 text-red-600"
                            viewBox="0 0 20 20"
                            fill="none"
                        >
                            <path
                                d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3.5v.5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[15px] font-bold text-gray-900">{title}</p>
                        <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                {showStatusSelect && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-semibold text-gray-600">
                            Reactivate as status
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => onStatusChange?.("Upcoming")}
                                className={`flex-1 px-3 py-2 text-[13px] font-semibold rounded-lg border transition-colors ${
                                    statusValue === "Upcoming"
                                        ? "bg-blue-100 border-blue-300 text-blue-700"
                                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                Upcoming
                            </button>
                            <button
                                type="button"
                                onClick={() => onStatusChange?.("Open")}
                                className={`flex-1 px-3 py-2 text-[13px] font-semibold rounded-lg border transition-colors ${
                                    statusValue === "Open"
                                        ? "bg-green-100 border-green-300 text-green-700"
                                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                Open
                            </button>
                        </div>
                    </div>
                )}

                {reasonLabel && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-semibold text-gray-600">
                            {reasonLabel}
                        </label>
                        <textarea
                            value={reason || ""}
                            onChange={(e) => onReasonChange?.(e.target.value)}
                            placeholder="Enter reason (optional)..."
                            className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
                            rows={3}
                        />
                    </div>
                )}

                {inputConfirm && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-semibold text-gray-600">
                            Type{" "}
                            <span className="font-bold text-gray-900">{inputConfirm}</span> to
                            confirm
                        </label>
                        <input
                            type="text"
                            value={typed}
                            onChange={(e) => setTyped(e.target.value)}
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
                        className={`text-[13px] font-semibold text-white px-4 py-2 rounded-lg transition-all border-0 cursor-pointer ${confirmStyle} ${!canConfirm ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

type ModalType = "archive" | "cancel" | "delete" | "reactivate" | null;
type ActionState = "idle" | "loading" | "done";

export default function EventSettingsPage() {
    const params = useParams();
    const eventId = params["event-id"] as string;

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [modal, setModal] = useState<ModalType>(null);
    const [state, setState] = useState<ActionState>("idle");
    const [toast, setToast] = useState("");
    const [reasonInput, setReasonInput] = useState("");
    const [newStatus, setNewStatus] = useState<"Upcoming" | "Open">("Upcoming");

    const isCompleted = event?.status === "Completed";
    const isCancelled = event?.status === "Cancelled";
    const isArchivable = Boolean(isCompleted || isCancelled);
    const isReactivatable = event && (event.status === "Closed" || event.status === "Cancelled");

    function showToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(""), 3500);
    }

    function getToken() {
        return (
            window.localStorage.getItem("auth_token") ??
            window.sessionStorage.getItem("auth_token")
        );
    }

    async function fetchEvent() {
        const token = getToken();
        if (!token) {
            setLoadError("Session missing. Please sign in again.");
            setLoadingEvent(false);
            return;
        }

        const res = await fetch(`${API_BASE_URL}/manage/events/${eventId}`, {
            headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        }).catch(() => null);
        const payload = (await res?.json().catch(() => null)) as {
            success?: boolean;
            data?: any;
            error?: string;
        } | null;

        if (!res || !res.ok || !payload?.success || !payload.data) {
            setLoadError(payload?.error ?? "Unable to load event settings.");
            setLoadingEvent(false);
            return;
        }

        const e = payload.data;
        setEvent({
            id: String(e.id ?? eventId),
            title: String(e.title ?? "Untitled Event"),
            status: (e.status ?? "Upcoming") as EventStatus,
            start_date: String(e.start_date ?? new Date().toISOString()),
            total_registered: Number(e.total_registered ?? 0),
            total_paid: Number(e.total_paid ?? 0),
        });
        setLoadError("");
        setLoadingEvent(false);
    }

    useEffect(() => {
        fetchEvent();
    }, [eventId]);

    async function handleConfirm() {
        if (!event || !modal) return;

        setState("loading");
        setModal(null);

        const token = getToken();
        if (!token) {
            setState("idle");
            showToast("Session missing. Please sign in again.");
            return;
        }

        try {
            if (modal === "archive") {
                const res = await fetch(`${API_BASE_URL}/manage/events/${event.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: "Closed", reason: reasonInput }),
                });
                const payload = (await res.json().catch(() => null)) as {
                    success?: boolean;
                    error?: string;
                } | null;
                if (!res.ok || !payload?.success)
                    throw new Error(payload?.error ?? "Failed to archive event.");
                setEvent((prev) => (prev ? { ...prev, status: "Closed" } : prev));
                showToast("Event archived successfully.");
                setReasonInput("");
            }

            if (modal === "cancel") {
                const res = await fetch(`${API_BASE_URL}/manage/events/${event.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: "Cancelled", reason: reasonInput }),
                });
                const payload = (await res.json().catch(() => null)) as {
                    success?: boolean;
                    error?: string;
                } | null;
                if (!res.ok || !payload?.success)
                    throw new Error(payload?.error ?? "Failed to cancel event.");
                setEvent((prev) => (prev ? { ...prev, status: "Cancelled" } : prev));
                showToast("Event has been cancelled.");
                setReasonInput("");
            }

            if (modal === "delete") {
                const res = await fetch(`${API_BASE_URL}/manage/events/${event.id}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ reason: reasonInput }),
                });
                const payload = (await res.json().catch(() => null)) as {
                    success?: boolean;
                    error?: string;
                } | null;
                if (!res.ok || !payload?.success)
                    throw new Error(payload?.error ?? "Failed to delete event.");
                showToast("Event deleted.");
                window.location.href = "/manage/events";
                return;
            }

            if (modal === "reactivate") {
                const res = await fetch(`${API_BASE_URL}/manage/events/${event.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: newStatus, reason: reasonInput }),
                });
                const payload = (await res.json().catch(() => null)) as {
                    success?: boolean;
                    error?: string;
                } | null;
                if (!res.ok || !payload?.success)
                    throw new Error(payload?.error ?? "Failed to reactivate event.");
                setEvent((prev) => (prev ? { ...prev, status: newStatus } : prev));
                showToast("Event reactivated successfully.");
                setReasonInput("");
                setNewStatus("Upcoming");
            }

            setState("done");
        } catch (e: any) {
            showToast(e?.message ?? "Action failed.");
            setState("idle");
        }
    }

    const modalConfig: Record<
        NonNullable<ModalType>,
        {
            title: string;
            message: string;
            confirmLabel: string;
            confirmStyle: string;
            inputConfirm?: string;
            reasonLabel?: string;
            showStatusSelect?: boolean;
        }
    > = {
        archive: {
            title: "Archive this event?",
            message: `"${event?.title ?? "This event"}" will be closed from new registrations and moved to your archive. Existing registrations and attendance records are preserved.`,
            confirmLabel: "Archive event",
            confirmStyle: "bg-amber-600 hover:bg-amber-700",
            reasonLabel: "Reason for archiving (optional)",
        },
        cancel: {
            title: "Cancel this event?",
            message: `"${event?.title ?? "This event"}" will be marked as Cancelled. All ${event?.total_registered ?? 0} registered participants will be notified. This action cannot be undone.`,
            confirmLabel: "Cancel event",
            confirmStyle: "bg-red-600 hover:bg-red-700",
            reasonLabel: "Reason for cancellation (optional)",
        },
        delete: {
            title: "Permanently delete this event?",
            message: `This will permanently remove "${event?.title ?? "this event"}" and all associated registrations, payment proofs, and attendance records. This cannot be recovered.`,
            confirmLabel: "Delete permanently",
            confirmStyle: "bg-red-700 hover:bg-red-800",
            inputConfirm: "DELETE",
            reasonLabel: "Reason for deletion (optional)",
        },
        reactivate: {
            title: "Reactivate this event?",
            message: `"${event?.title ?? "This event"}" will be reactivated and made available for registrations again. You can choose the status to reactivate it as.`,
            confirmLabel: "Reactivate event",
            confirmStyle: "bg-green-600 hover:bg-green-700",
            reasonLabel: "Reason for reactivation (optional)",
            showStatusSelect: true,
        },
    };

    const cfg = modal ? modalConfig[modal] : null;

    return (
        <ManageShell pageTitle="Salikop">
            <div className="flex flex-col gap-6 animate-fade-in">
                {loadingEvent ? (
                    <div className="text-sm text-gray-500">Loading event settings...</div>
                ) : loadError ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                        {loadError}
                    </div>
                ) : !event ? (
                    <div className="text-sm text-gray-500">Event not found.</div>
                ) : (
                    <>
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
                                <Link
                                    href={`/manage/events/${event.id}`}
                                    className="hover:text-[var(--color-primary)] transition-colors no-underline truncate max-w-[180px] sm:max-w-xs"
                                >
                                    {event.title}
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
                                    Event Settings
                                </span>
                            </nav>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
                                        Event Settings
                                    </h1>
                                    <p className="text-[13px] text-gray-400 mt-0.5">
                                        {event.title}
                                    </p>
                                </div>
                                <Link
                                    href={`/manage/events/${eventId}`}
                                    className="flex-shrink-0 flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all no-underline"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                                        <path
                                            d="M10 3L5 8l5 5"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    Back to event
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <svg
                                        className="w-4.5 h-4.5 text-blue-600"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                    >
                                        <path
                                            d="M6 2v2M14 2v2M3 8h14M5 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-[14px] font-bold text-gray-900">
                                        {event.title}
                                    </p>
                                    <p className="text-[12px] text-gray-400">
                                        {formatDate(event.start_date)} · {event.total_registered}{" "}
                                        registered
                                    </p>
                                </div>
                            </div>
                            <span
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border self-start sm:self-auto ${event.status === "Open" ? "bg-green-50 text-green-700 border-green-200" : event.status === "Upcoming" ? "bg-blue-50 text-blue-700 border-blue-200" : event.status === "Completed" ? "bg-gray-100 text-gray-500 border-gray-200" : event.status === "Cancelled" ? "bg-red-50 text-red-500 border-red-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}
                            >
                                {event.status}
                            </span>
                        </div>

                        <section className="flex flex-col gap-3">
                            <div>
                                <h2 className="text-[14px] font-bold text-gray-800">
                                    Visibility & State
                                </h2>
                                <p className="text-[12px] text-gray-400 mt-0.5">
                                    Control who can see this event and its current registration
                                    state.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                {isArchivable && (
                                    <DangerCard
                                        icon={<IconArchive />}
                                        iconBg="bg-amber-50 text-amber-600"
                                        title="Archive event"
                                        description="Close this event to new registrations and move it out of the active events list. All existing registration and attendance data is preserved and remains accessible."
                                        consequence="Only available after the event is Completed or Cancelled."
                                        buttonLabel="Archive"
                                        buttonStyle="bg-amber-600 hover:bg-amber-700 text-white"
                                        onClick={() => setModal("archive")}
                                    />
                                )}
                                {isReactivatable && (
                                    <DangerCard
                                        icon={<IconRefresh />}
                                        iconBg="bg-green-50 text-green-600"
                                        title="Reactivate event"
                                        description="Bring this event back to active status and allow registrations again. Choose whether to reactivate as Upcoming or Open."
                                        consequence="You can always archive or cancel it again if needed."
                                        buttonLabel="Reactivate"
                                        buttonStyle="bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => setModal("reactivate")}
                                    />
                                )}
                                {!isArchivable && !isReactivatable && (
                                    <DangerCard
                                        icon={<IconArchive />}
                                        iconBg="bg-amber-50 text-amber-600"
                                        title="Archive event"
                                        description="Close this event to new registrations and move it out of the active events list. All existing registration and attendance data is preserved and remains accessible."
                                        consequence="Only available after the event is Completed or Cancelled."
                                        buttonLabel="Archive"
                                        buttonStyle="bg-amber-600 hover:bg-amber-700 text-white"
                                        disabled={!isArchivable}
                                        disabledReason={
                                            !isArchivable
                                                ? `Event must be Completed or Cancelled first (current: ${event.status})`
                                                : undefined
                                        }
                                        onClick={() => setModal("archive")}
                                    />
                                )}
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        <section className="flex flex-col gap-3">
                            <div>
                                <h2 className="text-[14px] font-bold text-red-600">
                                    Danger Zone
                                </h2>
                                <p className="text-[12px] text-gray-400 mt-0.5">
                                    Irreversible actions. Proceed with caution.
                                </p>
                            </div>
                            <div className="rounded-xl border border-red-200 overflow-hidden divide-y divide-red-100">
                                <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 text-red-500">
                                        <IconCancel />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-bold text-gray-900">
                                            Cancel event
                                        </p>
                                        <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                                            Mark this event as Cancelled. All {event.total_registered}{" "}
                                            registered participants will be notified via in-app
                                            notification. Registration will be immediately disabled.
                                        </p>
                                        <p className="text-[11px] font-medium text-gray-400 mt-2 flex items-center gap-1.5">
                                            <svg
                                                className="w-3.5 h-3.5 flex-shrink-0"
                                                viewBox="0 0 16 16"
                                                fill="none"
                                            >
                                                <path
                                                    d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 3v4m0 2.5v.5"
                                                    stroke="currentColor"
                                                    strokeWidth="1.3"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            Registration data and payment records are retained for
                                            your records.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setModal("cancel")}
                                        disabled={Boolean(isCancelled)}
                                        className={`flex-shrink-0 text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer border border-red-300 text-red-600 bg-white hover:bg-red-50 ${isCancelled ? "opacity-40 cursor-not-allowed" : ""}`}
                                    >
                                        {isCancelled ? "Already cancelled" : "Cancel event"}
                                    </button>
                                </div>
                                <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-red-700">
                                        <IconTrash />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-bold text-gray-900">
                                            Delete event permanently
                                        </p>
                                        <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                                            Permanently removes this event and all associated data with registrations, payment proofs, and attendance records.
                                            This action{" "}
                                            <strong className="font-semibold text-gray-700">
                                                cannot be undone
                                            </strong>
                                            .
                                        </p>
                                        {event.total_registered > 0 && (
                                            <p className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 mt-3 inline-block">
                                                ? {event.total_registered} registration records will be
                                                permanently lost
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setModal("delete")}
                                        className="flex-shrink-0 text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer border-0 bg-red-700 hover:bg-red-800 text-white"
                                    >
                                        Delete event
                                    </button>
                                </div>
                            </div>
                        </section>

                        <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
                            <svg
                                className="w-4.5 h-4.5 text-gray-400 flex-shrink-0 mt-0.5"
                                viewBox="0 0 20 20"
                                fill="none"
                            >
                                <path
                                    d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v5m0 3v.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <p className="text-[12px] text-gray-500 leading-relaxed">
                                All destructive actions are logged with your officer account ID
                                and timestamp for administrative audit purposes. If you need to
                                recover a deleted event, contact your system administrator.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {modal && cfg && (
                <ConfirmModal
                    title={cfg.title}
                    message={cfg.message}
                    confirmLabel={cfg.confirmLabel}
                    confirmStyle={cfg.confirmStyle}
                    inputConfirm={cfg.inputConfirm}
                    reasonLabel={cfg.reasonLabel}
                    reason={reasonInput}
                    onReasonChange={setReasonInput}
                    showStatusSelect={cfg.showStatusSelect}
                    statusValue={newStatus}
                    onStatusChange={setNewStatus}
                    onConfirm={handleConfirm}
                    onCancel={() => {
                        setModal(null);
                        setReasonInput("");
                        setNewStatus("Upcoming");
                    }}
                />
            )}

            {state === "loading" && (
                <div className="fixed inset-0 z-40 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 shadow-lg px-6 py-4">
                        <svg
                            className="w-5 h-5 text-green-600 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeOpacity="0.2"
                            />
                            <path
                                d="M12 2a10 10 0 0110 10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                        <p className="text-[13px] font-semibold text-gray-700">
                            Processing�
                        </p>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-[13px] font-medium px-5 py-3 rounded-xl shadow-xl animate-fade-in flex items-center gap-2.5">
                    <svg
                        className="w-4 h-4 text-green-400"
                        viewBox="0 0 20 20"
                        fill="none"
                    >
                        <path
                            d="M5 10l4 4 6-7"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    {toast}
                </div>
            )}
        </ManageShell>
    );
}

function IconArchive() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <path
                d="M3 5a2 2 0 012-2h10a2 2 0 012 2v1H3V5zm0 3h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}
function IconRefresh() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <path
                d="M4 10a6 6 0 016-6v3m0 0H7m3 0h3m2 6a6 6 0 01-6 6v-3m0 0h3m-3 0h-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
function IconCancel() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M7 7l6 6M13 7l-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}
function IconTrash() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
            <path
                d="M4 6h12M8 6V4h4v2M7 6v9a1 1 0 001 1h4a1 1 0 001-1V6H7z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
