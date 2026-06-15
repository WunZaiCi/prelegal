/**
 * Small, presentational form-field primitives shared by NdaForm.
 * Kept deliberately simple — controlled inputs styled for the
 * legal-stationery aesthetic.
 */
import type { ReactNode } from "react";

const labelClass =
  "block font-ui text-[11px] font-600 uppercase tracking-[0.14em] text-ink-soft";

const controlClass =
  "mt-2 w-full rounded-md border border-line bg-paper px-3 py-2.5 font-body text-[15px] text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-oxblood focus:ring-2 focus:ring-oxblood/15";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {hint ? (
        <span className="mt-1 block font-body text-[13px] italic text-ink-soft">
          {hint}
        </span>
      ) : null}
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={controlClass}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={`${controlClass} resize-none leading-relaxed`}
    />
  );
}

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  suffix,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="mt-2 inline-flex items-center gap-3 rounded-md border border-line bg-paper px-2 py-1.5">
      <button
        type="button"
        aria-label="Decrease"
        onClick={() => onChange(clamp(value - 1))}
        className="grid h-7 w-7 place-items-center rounded font-ui text-ink-soft transition-colors hover:bg-paper-deep hover:text-oxblood"
      >
        –
      </button>
      <span className="min-w-[3ch] text-center font-ui text-[15px] font-600 tabular-nums text-ink">
        {value}
        {suffix ? <span className="ml-1 text-ink-soft">{suffix}</span> : null}
      </span>
      <button
        type="button"
        aria-label="Increase"
        onClick={() => onChange(clamp(value + 1))}
        className="grid h-7 w-7 place-items-center rounded font-ui text-ink-soft transition-colors hover:bg-paper-deep hover:text-oxblood"
      >
        +
      </button>
    </div>
  );
}

export function RadioRow<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 font-body text-[15px] transition-colors ${
              active
                ? "border-oxblood bg-oxblood/[0.06] text-ink"
                : "border-line bg-paper text-ink-soft hover:border-ink/30"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={active}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`grid h-4 w-4 place-items-center rounded-full border transition-colors ${
                active ? "border-oxblood" : "border-line"
              }`}
            >
              {active ? (
                <span className="h-2 w-2 rounded-full bg-oxblood" />
              ) : null}
            </span>
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
