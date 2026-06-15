import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
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

const INK = "#1C1A17";
const SOFT = "#4A453D";
const OXBLOOD = "#7A2E2A";
const LINE = "#CFC7B5";

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 56,
    paddingVertical: 54,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.5,
    color: INK,
  },
  eyebrow: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 2,
    textAlign: "center",
    color: OXBLOOD,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 20,
    textAlign: "center",
    marginTop: 8,
  },
  intro: { marginTop: 18, fontSize: 9.5, color: SOFT },
  fieldGroup: { marginTop: 14 },
  fieldLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  fieldNote: { fontSize: 8.5, fontStyle: "italic", color: SOFT, marginTop: 1 },
  fieldValue: { marginTop: 3 },
  placeholder: { fontStyle: "italic", color: "#B07C78" },
  signIntro: { marginTop: 18, fontStyle: "italic", color: SOFT },
  signTable: {
    marginTop: 10,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 3,
  },
  signCol: { flex: 1, padding: 12 },
  signColDivider: { borderRightWidth: 1, borderRightColor: LINE },
  signRow: { borderTopWidth: 1, borderTopColor: LINE, paddingVertical: 5 },
  signRowFirst: { paddingVertical: 5 },
  signLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: SOFT,
  },
  signValue: { fontSize: 9.5, marginTop: 2 },
  signLine: {
    marginTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#7A746A",
    borderBottomStyle: "dashed",
  },
  attribution: {
    marginTop: 22,
    fontFamily: "Helvetica",
    fontSize: 7.5,
    textAlign: "center",
    color: SOFT,
  },
  termsHeading: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
  },
  clause: { marginBottom: 9, fontSize: 9.5 },
  clauseTitle: { fontFamily: "Times-Bold" },
});

/** Resolve a value to display text, falling back to a bracketed placeholder. */
function display(value: string, placeholder: string) {
  const trimmed = value.trim();
  if (trimmed) return <Text>{trimmed}</Text>;
  return <Text style={styles.placeholder}>[{placeholder}]</Text>;
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
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {note ? <Text style={styles.fieldNote}>{note}</Text> : null}
      <Text style={styles.fieldValue}>{children}</Text>
    </View>
  );
}

function SignatureColumn({
  party,
  divider,
}: {
  party: NdaParty;
  divider?: boolean;
}) {
  const row = (
    label: string,
    value: string,
    ph: string,
    first?: boolean,
  ) => (
    <View style={first ? styles.signRowFirst : styles.signRow}>
      <Text style={styles.signLabel}>{label}</Text>
      <Text style={styles.signValue}>{display(value, ph)}</Text>
    </View>
  );
  return (
    <View style={[styles.signCol, ...(divider ? [styles.signColDivider] : [])]}>
      {row("Company", party.company, "Company", true)}
      {row("Print Name", party.printName, "Name")}
      {row("Title", party.title, "Title")}
      {row("Notice Address", party.noticeAddress, "Email or postal address")}
      <View style={styles.signRow}>
        <Text style={styles.signLabel}>Signature</Text>
        <View style={styles.signLine} />
      </View>
    </View>
  );
}

export default function NdaPdfDocument({ data }: { data: NdaFormData }) {
  return (
    <Document
      title="Mutual Non-Disclosure Agreement"
      author="Prelegal"
      subject="Mutual NDA"
    >
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>COVER PAGE</Text>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>

        <Text style={styles.intro}>
          This Mutual Non-Disclosure Agreement (the “MNDA”) consists of: (1)
          this Cover Page and (2) the Common Paper Mutual NDA Standard Terms
          Version 1.0. Any modifications of the Standard Terms should be made on
          this Cover Page, which will control over conflicts with the Standard
          Terms.
        </Text>

        <CoverField label="Purpose" note="How Confidential Information may be used">
          {display(data.purpose, "Describe the purpose")}
        </CoverField>
        <CoverField label="Effective Date">
          {display(formatDate(data.effectiveDate), "Effective date")}
        </CoverField>
        <CoverField label="MNDA Term" note="The length of this MNDA">
          <Text>{describeTerm(data)}</Text>
        </CoverField>
        <CoverField
          label="Term of Confidentiality"
          note="How long Confidential Information is protected"
        >
          <Text>{describeConfidentiality(data)}</Text>
        </CoverField>
        <CoverField label="Governing Law & Jurisdiction">
          <Text>Governing Law: {display(data.governingLaw, "State")}</Text>
        </CoverField>
        <View style={{ marginTop: 3 }}>
          <Text>
            Jurisdiction:{" "}
            {display(data.jurisdiction, "City/county and state")}
          </Text>
        </View>
        <CoverField label="MNDA Modifications">
          {display(data.modifications, "None")}
        </CoverField>

        <Text style={styles.signIntro}>
          By signing this Cover Page, each party agrees to enter into this MNDA
          as of the Effective Date.
        </Text>

        <View style={styles.signTable}>
          <SignatureColumn party={data.party1} divider />
          <SignatureColumn party={data.party2} />
        </View>

        <Text style={styles.attribution}>{STANDARD_TERMS_ATTRIBUTION}</Text>
      </Page>

      {/* Standard Terms */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.termsHeading}>{STANDARD_TERMS_HEADING}</Text>
        {STANDARD_TERMS.map((clause) => (
          <Text key={clause.number} style={styles.clause}>
            <Text style={styles.clauseTitle}>
              {clause.number}. {clause.title}.
            </Text>{" "}
            {clause.body}
          </Text>
        ))}
        <Text style={styles.attribution}>{STANDARD_TERMS_ATTRIBUTION}</Text>
      </Page>
    </Document>
  );
}
