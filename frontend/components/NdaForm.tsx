"use client";

import type {
  ConfidentialityMode,
  NdaFormData,
  NdaParty,
  TermMode,
} from "@/lib/nda-types";
import {
  Field,
  NumberStepper,
  RadioRow,
  TextArea,
  TextInput,
} from "./fields";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

function SectionHeading({
  index,
  title,
}: {
  index: string;
  title: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-ui text-[12px] font-700 tracking-[0.18em] text-oxblood">
        {index}
      </span>
      <h2 className="font-display text-[20px] font-500 text-ink">{title}</h2>
    </div>
  );
}

export default function NdaForm({ data, onChange }: NdaFormProps) {
  const set = <K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) =>
    onChange({ ...data, [key]: value });

  const setParty = (
    which: "party1" | "party2",
    key: keyof NdaParty,
    value: string,
  ) => onChange({ ...data, [which]: { ...data[which], [key]: value } });

  return (
    <form className="flex flex-col gap-12" onSubmit={(e) => e.preventDefault()}>
      {/* 1 — Agreement basics */}
      <section className="flex flex-col gap-5">
        <SectionHeading index="01" title="Agreement details" />
        <Field
          label="Purpose"
          hint="How Confidential Information may be used."
        >
          <TextArea
            value={data.purpose}
            onChange={(v) => set("purpose", v)}
            placeholder="Evaluating whether to enter into a business relationship…"
            rows={3}
          />
        </Field>
        <Field label="Effective Date">
          <TextInput
            type="date"
            value={data.effectiveDate}
            onChange={(v) => set("effectiveDate", v)}
          />
        </Field>
      </section>

      {/* 2 — Term */}
      <section className="flex flex-col gap-5">
        <SectionHeading index="02" title="Term & confidentiality" />
        <Field label="MNDA Term" hint="The length of this MNDA.">
          <RadioRow<TermMode>
            name="termMode"
            value={data.termMode}
            onChange={(v) => set("termMode", v)}
            options={[
              { value: "expires", label: "Expires after a set period" },
              {
                value: "untilTerminated",
                label: "Continues until terminated",
              },
            ]}
          />
          {data.termMode === "expires" ? (
            <NumberStepper
              value={data.termYears}
              onChange={(v) => set("termYears", v)}
              suffix={data.termYears === 1 ? "year" : "years"}
            />
          ) : null}
        </Field>

        <Field
          label="Term of Confidentiality"
          hint="How long Confidential Information is protected."
        >
          <RadioRow<ConfidentialityMode>
            name="confidentialityMode"
            value={data.confidentialityMode}
            onChange={(v) => set("confidentialityMode", v)}
            options={[
              { value: "years", label: "For a set period from the Effective Date" },
              { value: "perpetuity", label: "In perpetuity" },
            ]}
          />
          {data.confidentialityMode === "years" ? (
            <NumberStepper
              value={data.confidentialityYears}
              onChange={(v) => set("confidentialityYears", v)}
              suffix={data.confidentialityYears === 1 ? "year" : "years"}
            />
          ) : null}
        </Field>
      </section>

      {/* 3 — Governing law */}
      <section className="flex flex-col gap-5">
        <SectionHeading index="03" title="Governing law & jurisdiction" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Governing Law">
            <TextInput
              value={data.governingLaw}
              onChange={(v) => set("governingLaw", v)}
              placeholder="Delaware"
            />
          </Field>
          <Field label="Jurisdiction">
            <TextInput
              value={data.jurisdiction}
              onChange={(v) => set("jurisdiction", v)}
              placeholder="New Castle, DE"
            />
          </Field>
        </div>
        <Field
          label="MNDA Modifications"
          hint="Optional — list any changes to the standard terms."
        >
          <TextArea
            value={data.modifications}
            onChange={(v) => set("modifications", v)}
            placeholder="None."
            rows={2}
          />
        </Field>
      </section>

      {/* 4 — Parties */}
      <section className="flex flex-col gap-5">
        <SectionHeading index="04" title="The parties" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {(["party1", "party2"] as const).map((key, i) => {
            const party = data[key];
            return (
              <fieldset
                key={key}
                className="flex flex-col gap-4 rounded-lg border border-line bg-paper-deep/40 p-5"
              >
                <legend className="px-2 font-ui text-[12px] font-700 uppercase tracking-[0.16em] text-ink-soft">
                  Party {i + 1}
                </legend>
                <Field label="Company">
                  <TextInput
                    value={party.company}
                    onChange={(v) => setParty(key, "company", v)}
                    placeholder="Acme, Inc."
                  />
                </Field>
                <Field label="Print Name">
                  <TextInput
                    value={party.printName}
                    onChange={(v) => setParty(key, "printName", v)}
                    placeholder="Jane Doe"
                  />
                </Field>
                <Field label="Title">
                  <TextInput
                    value={party.title}
                    onChange={(v) => setParty(key, "title", v)}
                    placeholder="Chief Executive Officer"
                  />
                </Field>
                <Field
                  label="Notice Address"
                  hint="Use either an email or a postal address."
                >
                  <TextArea
                    value={party.noticeAddress}
                    onChange={(v) => setParty(key, "noticeAddress", v)}
                    placeholder="legal@acme.com"
                    rows={2}
                  />
                </Field>
              </fieldset>
            );
          })}
        </div>
      </section>
    </form>
  );
}
