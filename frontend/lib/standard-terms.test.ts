import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  STANDARD_TERMS,
  STANDARD_TERMS_ATTRIBUTION,
  STANDARD_TERMS_HEADING,
} from "./standard-terms";

/**
 * The structured Standard Terms are the single source of truth rendered into
 * both the on-screen preview and the downloadable PDF. Because this is a legal
 * document, the text must match the Common Paper source template *verbatim* —
 * a single altered word changes the agreement. These tests parse the canonical
 * `templates/Mutual-NDA.md` and assert the transcription is exact.
 */

const here = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(here, "../../templates/Mutual-NDA.md");
const template = readFileSync(templatePath, "utf8");

/** Strip the markdown/HTML decorations the template uses but the data omits. */
function stripInline(s: string): string {
  return s
    .replace(/<span class="coverpage_link">(.*?)<\/span>/g, "$1") // defined-term links
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold lead-ins / defined terms
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // markdown links
}

interface ParsedClause {
  number: number;
  title: string;
  body: string;
}

/** Parse the numbered clauses out of the markdown template. */
function parseTemplateClauses(md: string): ParsedClause[] {
  const clauses: ParsedClause[] = [];
  for (const rawLine of md.split("\n")) {
    const line = rawLine.trim();
    const match = line.match(/^(\d+)\.\s+(.*)$/);
    if (!match) continue;
    const number = Number(match[1]);
    const rest = stripInline(match[2]);
    // Title is the bold lead-in up to the first ". ", body is the remainder.
    const split = rest.match(/^(.+?)\.\s+(.+)$/);
    if (!split) continue;
    clauses.push({ number, title: split[1], body: split[2] });
  }
  return clauses;
}

const templateClauses = parseTemplateClauses(template);

describe("STANDARD_TERMS transcription", () => {
  it("transcribes all 11 clauses from the template", () => {
    expect(templateClauses).toHaveLength(11);
    expect(STANDARD_TERMS).toHaveLength(templateClauses.length);
  });

  it("numbers clauses sequentially from 1", () => {
    expect(STANDARD_TERMS.map((c) => c.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it.each(templateClauses)(
    "clause $number title matches the template verbatim",
    ({ number, title }) => {
      const clause = STANDARD_TERMS.find((c) => c.number === number);
      expect(clause?.title).toBe(title);
    },
  );

  it.each(templateClauses)(
    "clause $number body matches the template verbatim",
    ({ number, body }) => {
      const clause = STANDARD_TERMS.find((c) => c.number === number);
      expect(clause?.body).toBe(body);
    },
  );

  it("uses the template's curly quotes, not straight quotes", () => {
    const joined = STANDARD_TERMS.map((c) => c.body).join(" ");
    // Clause 1 introduces several defined terms in curly double quotes.
    expect(joined).toContain("“MNDA”");
    expect(joined).toContain("“Confidential Information”");
    // No straight double quotes should have crept in.
    expect(joined).not.toContain('"');
  });
});

describe("STANDARD_TERMS heading and attribution", () => {
  it("matches the template heading", () => {
    expect(template).toContain(`# ${STANDARD_TERMS_HEADING}`);
    expect(STANDARD_TERMS_HEADING).toBe("Standard Terms");
  });

  it("matches the template attribution line verbatim", () => {
    const attributionLine = template
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("Common Paper"));
    expect(attributionLine).toBeDefined();
    expect(stripInline(attributionLine as string)).toBe(
      STANDARD_TERMS_ATTRIBUTION,
    );
  });
});
