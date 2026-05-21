// ─── Shared filter primitives ─────────────────────────────────────────────────

interface SelectOption { value: string; label: string; }

function FilterSelect({
    value, defaultValue, onChange, options, className = '',
}: {
    value: string;
    defaultValue: string;
    onChange: (v: string) => void;
    options: SelectOption[];
    className?: string;
}) {
    const isActive = value !== defaultValue;
    return (
        <div className={`relative ${className}`}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
                    width: '100%',
                    paddingTop: '0.5rem', paddingBottom: '0.5rem',
                    paddingLeft: '0.75rem', paddingRight: '2rem',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: isActive ? 'var(--color-primary-muted)' : 'var(--color-surface)',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: isActive ? '600' : '400',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'border-color 150ms, background 150ms, color 150ms',
                }}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>

            {/* Active: filled dot. Inactive: chevron */}
            <span
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
            >
                {isActive ? (
                    <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor">
                        <circle cx="3.5" cy="3.5" r="3.5" />
                    </svg>
                ) : (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4.5l3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </span>
        </div>
    );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span
            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-[11.5px] font-semibold"
            style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
        >
            {label}
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label} filter`}
                className="flex items-center justify-center w-3.5 h-3.5 rounded-full transition-opacity hover:opacity-60"
            >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>
        </span>
    );
}

export { FilterSelect, FilterChip };