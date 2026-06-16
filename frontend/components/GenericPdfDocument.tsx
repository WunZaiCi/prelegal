import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatDate } from "@/lib/nda-types";
import {
  PARTY_SUBFIELDS,
  type DocumentSpec,
  type GenericDocData,
  type KeyTerm,
} from "@/lib/documents";

const INK = "#1F2A37";
const SOFT = "#888888";
const NAVY = "#032147";
const BLUE = "#209DD7";
const LINE = "#D9DEE7";

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
    color: BLUE,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 20,
    textAlign: "center",
    marginTop: 8,
    color: NAVY,
  },
  draftNote: {
    marginTop: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    letterSpacing: 0.5,
    textAlign: "center",
    color: "#9A6A00",
  },
  intro: { marginTop: 18, fontSize: 9.5, color: SOFT },
  fieldGroup: { marginTop: 14 },
  fieldLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: NAVY,
  },
  fieldNote: { fontSize: 8.5, fontStyle: "italic", color: SOFT, marginTop: 1 },
  fieldValue: { marginTop: 3 },
  placeholder: { fontStyle: "italic", color: "#7FB6DA" },
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
  signColTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: NAVY,
    marginBottom: 2,
  },
  signRow: { borderTopWidth: 1, borderTopColor: LINE, paddingVertical: 5 },
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
    borderBottomColor: "#9AA3B2",
    borderBottomStyle: "dashed",
  },
  attribution: {
    marginTop: 22,
    fontFamily: "Helvetica",
    fontSize: 7.5,
    textAlign: "center",
    color: SOFT,
  },
});

/** Resolve a value to display text, falling back to a bracketed placeholder. */
function display(value: string, placeholder: string) {
  const trimmed = (value ?? "").trim();
  if (trimmed) return <Text>{trimmed}</Text>;
  return <Text style={styles.placeholder}>[{placeholder}]</Text>;
}

function formatValue(term: KeyTerm, raw: string): string {
  if (!raw) return "";
  return term.type === "date" ? formatDate(raw) : raw;
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
  term,
  data,
  divider,
}: {
  term: KeyTerm;
  data: GenericDocData;
  divider?: boolean;
}) {
  return (
    <View style={[styles.signCol, ...(divider ? [styles.signColDivider] : [])]}>
      <Text style={styles.signColTitle}>{term.label}</Text>
      {PARTY_SUBFIELDS.map((sub) => (
        <View key={sub.suffix} style={styles.signRow}>
          <Text style={styles.signLabel}>{sub.label}</Text>
          <Text style={styles.signValue}>
            {display(data[`${term.key}_${sub.suffix}`] ?? "", sub.label)}
          </Text>
        </View>
      ))}
      <View style={styles.signRow}>
        <Text style={styles.signLabel}>Signature</Text>
        <View style={styles.signLine} />
      </View>
    </View>
  );
}

export default function GenericPdfDocument({
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
    <Document title={spec.name} author="Prelegal" subject={spec.name}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>COVER PAGE</Text>
        <Text style={styles.title}>{spec.name}</Text>
        <Text style={styles.draftNote}>
          DRAFT — review by a qualified lawyer before use. Not legal advice.
        </Text>

        <Text style={styles.intro}>
          This {spec.name} consists of this Cover Page and the Common Paper{" "}
          {spec.name} Standard Terms, available at commonpaper.com, which it
          incorporates by reference. Any modifications should be made on this
          Cover Page, which controls over conflicts with the Standard Terms.
        </Text>

        {fields.map((term) => (
          <CoverField key={term.key} label={term.label} note={term.hint}>
            {display(formatValue(term, data[term.key] ?? ""), term.label)}
          </CoverField>
        ))}

        {parties.length > 0 ? (
          <>
            <Text style={styles.signIntro}>
              By signing this Cover Page, each party agrees to enter into this{" "}
              {spec.name}.
            </Text>
            <View style={styles.signTable}>
              {parties.map((term, i) => (
                <SignatureColumn
                  key={term.key}
                  term={term}
                  data={data}
                  divider={i < parties.length - 1}
                />
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.attribution}>
          Document terms © Common Paper, used under CC BY 4.0. This is a draft
          cover page and not legal advice.
        </Text>
      </Page>
    </Document>
  );
}
