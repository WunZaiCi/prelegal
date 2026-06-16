/** Persistent draft disclaimer shown across the app (PL-7). */
export default function Disclaimer() {
  return (
    <div className="border-b border-yellow/40 bg-yellow/10">
      <div className="mx-auto flex max-w-[1400px] items-start gap-2.5 px-5 py-2.5 sm:px-8 lg:px-12">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="mt-0.5 shrink-0 text-yellow-deep"
          aria-hidden
        >
          <path
            d="M8 1.5 1 14h14L8 1.5Z M8 6.5v3.5 M8 12h.01"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="font-body text-[13px] leading-snug text-navy">
          <span className="font-600">Draft only.</span> Documents generated here
          are drafts and must be reviewed by a qualified lawyer before use.
          Prelegal does not provide legal advice.
        </p>
      </div>
    </div>
  );
}
