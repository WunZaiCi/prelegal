"use client";

import { Fragment } from "react";
import { formatDate } from "@/lib/nda-types";
import {
  PARTY_SUBFIELDS,
  type DocumentSpec,
  type GenericDocData,
  type KeyTerm,
} from "@/lib/documents";

/** Render a value, or a muted placeholder when it is empty. */
function Value({ children, placeholder }: { children: string; placeholder: string }) {
  if (children.trim()) return <span className="text-ink">{children}</span>;
  return <span className="italic text-blue/70">[{placeholder}]</span>;
}

function formatValue(term: KeyTerm, raw: string): string {
  if (!raw) return "";
  return term.type === "date" ? formatDate(raw) : raw;
}

function PartyColumn({
  term,
  data,
}: {
  term: KeyTerm;
  data: GenericDocData;
}) {
  const row = (label: string, value: string, ph: string) => (
    <div className="border-t border-line/70 py-2">
      <div className="font-ui text-[9px] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="mt-0.5 text-[13px]">
        <Value placeholder={ph}>{value}</Value>
      </div>
    </div>
  );
  return (
    <div className="flex-1">
      <div className="font-ui text-[10px] font-700 uppercase tracking-[0.16em] text-navy">
        {term.label}
      </div>
      {PARTY_SUBFIELDS.map((sub) =>
        row(sub.label, data[`${term.key}_${sub.suffix}`] ?? "", sub.label),
      )}
      <div className="border-t border-line/70 py-2">
        <div className="font-ui text-[9px] uppercase tracking-[0.14em] text-muted">
          Signature
        </div>
        <div className="mt-4 border-b border-dashed border-ink/40" />
      </div>
    </div>
  );
}

export default function GenericPreview({
  spec,
  data,
}: {
  spec: DocumentSpec;
  data: GenericDocData;
}) {
  const terms = spec.keyTerms ?? [];
  const parties = terms.filter((t) => t.type === "party");
  const fields = terms.filter((t) => t.type !== "party");

  return (
    <article className="mx-auto max-w-[640px] bg-white px-10 py-12 font-serif text-[14px] leading-relaxed text-ink shadow-document sm:px-14 sm:py-16">
      <header className="text-center">
        <p className="font-ui text-[10px] uppercase tracking-[0.32em] text-blue">
          Cover Page
        </p>
        <h1 className="mt-3 font-serif text-[28px] font-600 leading-tight text-navy">
          {spec.name}
        </h1>
      </header>

      <p className="mt-8 text-[13px] leading-relaxed text-muted">
        This {spec.name} consists of this Cover Page and the Common Paper{" "}
        {spec.name} Standard Terms, which it incorporates by reference. The
        Standard Terms are available at{" "}
        <span className="text-blue">commonpaper.com</span>. Any modifications
        should be made on this Cover Page, which controls over conflicts with the
        Standard Terms.
      </p>

      {fields.length > 0 ? (
        <dl className="mt-8 flex flex-col gap-6">
          {fields.map((term) => (
            <div key={term.key}>
              <dt className="font-ui text-[11px] font-700 uppercase tracking-[0.16em] text-navy">
                {term.label}
              </dt>
              {term.hint ? (
                <dd className="mt-0.5 text-[12px] italic text-muted">
                  {term.hint}
                </dd>
              ) : null}
              <dd className="mt-1.5 text-[14px]">
                <Value placeholder={term.label}>
                  {formatValue(term, data[term.key] ?? "")}
                </Value>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {parties.length > 0 ? (
        <>
          <p className="mt-8 text-[13px] italic text-muted">
            By signing this Cover Page, each party agrees to enter into this{" "}
            {spec.name}.
          </p>
          <div className="mt-6 flex flex-col gap-6 rounded-md border border-line bg-canvas p-5 sm:flex-row">
            {parties.map((term, i) => (
              <Fragment key={term.key}>
                {i > 0 ? (
                  <div className="hidden w-px bg-line sm:block" />
                ) : null}
                <PartyColumn term={term} data={data} />
              </Fragment>
            ))}
          </div>
        </>
      ) : null}

      <p className="mt-10 text-center font-ui text-[10px] leading-relaxed text-muted/80">
        Document terms © Common Paper, used under CC BY 4.0. This is a draft cover
        page and not legal advice.
      </p>
    </article>
  );
}
