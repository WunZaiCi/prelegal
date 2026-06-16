"use client";

import {
  describeConfidentiality,
  describeTerm,
  formatDate,
  type NdaFormData,
  type NdaParty,
} from "@/lib/nda-types";
import {
  STANDARD_TERMS,
  STANDARD_TERMS_ATTRIBUTION,
  STANDARD_TERMS_HEADING,
} from "@/lib/standard-terms";

/** Render a value, or a muted placeholder when it is empty. */
function Value({ children, placeholder }: { children: string; placeholder: string }) {
  if (children.trim()) return <span className="text-ink">{children}</span>;
  return (
    <span className="italic text-blue/70">[{placeholder}]</span>
  );
}

function PartyColumn({ party }: { party: NdaParty }) {
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
      {row("Company", party.company, "Company")}
      {row("Print Name", party.printName, "Name")}
      {row("Title", party.title, "Title")}
      {row("Notice Address", party.noticeAddress, "Email or postal address")}
      <div className="border-t border-line/70 py-2">
        <div className="font-ui text-[9px] uppercase tracking-[0.14em] text-muted">
          Signature
        </div>
        <div className="mt-4 border-b border-dashed border-ink/40" />
      </div>
    </div>
  );
}

export default function NdaPreview({ data }: { data: NdaFormData }) {
  return (
    <article className="mx-auto max-w-[640px] bg-white px-10 py-12 font-serif text-[14px] leading-relaxed text-ink shadow-document sm:px-14 sm:py-16">
      {/* ── Cover Page ── */}
      <header className="text-center">
        <p className="font-ui text-[10px] uppercase tracking-[0.32em] text-blue">
          Cover Page
        </p>
        <h1 className="mt-3 font-serif text-[28px] font-600 leading-tight text-navy">
          Mutual Non-Disclosure Agreement
        </h1>
      </header>

      <p className="mt-8 text-[13px] leading-relaxed text-muted">
        This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1) this
        Cover Page and (2) the Common Paper Mutual NDA Standard Terms Version
        1.0. Any modifications of the Standard Terms should be made on this Cover
        Page, which will control over conflicts with the Standard Terms.
      </p>

      <dl className="mt-8 flex flex-col gap-6">
        <CoverField label="Purpose" note="How Confidential Information may be used">
          <Value placeholder="Describe the purpose">{data.purpose}</Value>
        </CoverField>

        <CoverField label="Effective Date">
          <Value placeholder="Effective date">
            {formatDate(data.effectiveDate)}
          </Value>
        </CoverField>

        <CoverField label="MNDA Term" note="The length of this MNDA">
          {describeTerm(data)}
        </CoverField>

        <CoverField
          label="Term of Confidentiality"
          note="How long Confidential Information is protected"
        >
          {describeConfidentiality(data)}
        </CoverField>

        <CoverField label="Governing Law & Jurisdiction">
          <div className="flex flex-col gap-1">
            <span>
              Governing Law:{" "}
              <Value placeholder="State">{data.governingLaw}</Value>
            </span>
            <span>
              Jurisdiction:{" "}
              <Value placeholder="City/county and state">
                {data.jurisdiction}
              </Value>
            </span>
          </div>
        </CoverField>

        <CoverField label="MNDA Modifications">
          <Value placeholder="None">{data.modifications}</Value>
        </CoverField>
      </dl>

      <p className="mt-8 text-[13px] italic text-muted">
        By signing this Cover Page, each party agrees to enter into this MNDA as
        of the Effective Date.
      </p>

      {/* Signature table */}
      <div className="mt-6 flex flex-col gap-6 rounded-md border border-line bg-canvas p-5 sm:flex-row">
        <PartyColumn party={data.party1} />
        <div className="hidden w-px bg-line sm:block" />
        <PartyColumn party={data.party2} />
      </div>

      <Attribution />

      {/* ── Standard Terms ── */}
      <div className="mt-14 border-t-2 border-double border-ink/30 pt-12">
        <h2 className="text-center font-serif text-[22px] font-600 text-navy">
          {STANDARD_TERMS_HEADING}
        </h2>
        <ol className="mt-6 flex flex-col gap-4">
          {STANDARD_TERMS.map((clause) => (
            <li key={clause.number} className="text-[13px] leading-relaxed">
              <span className="font-600">
                {clause.number}. {clause.title}.
              </span>{" "}
              {clause.body}
            </li>
          ))}
        </ol>
      </div>

      <Attribution />
    </article>
  );
}

function CoverField({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-ui text-[11px] font-700 uppercase tracking-[0.16em] text-navy">
        {label}
      </dt>
      {note ? (
        <dd className="mt-0.5 text-[12px] italic text-muted">{note}</dd>
      ) : null}
      <dd className="mt-1.5 text-[14px]">{children}</dd>
    </div>
  );
}

function Attribution() {
  return (
    <p className="mt-10 text-center font-ui text-[10px] leading-relaxed text-muted/80">
      {STANDARD_TERMS_ATTRIBUTION}
    </p>
  );
}
