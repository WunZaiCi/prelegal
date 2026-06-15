# Manual Test Plan — Mutual NDA Creator (PL-3)

Automated tests (`npm test`) cover the data model, the verbatim Standard Terms
transcription, the form logic, the preview rendering, and that the PDF renders
to a valid file. The checks below cover what automation can't easily verify:
real browser behaviour, the downloaded PDF's *visual* fidelity, layout, and
accessibility.

Run `npm run dev` and open http://localhost:3000.

## 1. First load / hydration
- [ ] Page loads with no console errors or React hydration warnings.
- [ ] **Effective Date** field is pre-filled with **today's** date.
- [ ] The Purpose field is pre-filled with the example business-relationship text.
- [ ] The live preview on the right mirrors the form's starting values.

## 2. Live preview reactivity
- [ ] Typing in **Purpose** updates the preview Cover Page in real time.
- [ ] Clearing a field (e.g. Governing Law) shows a bracketed placeholder
      (e.g. `[State]`) in muted/italic style in the preview.
- [ ] Editing **Party 1 → Company** updates only Party 1's signature column.

## 3. Term & confidentiality logic
- [ ] **MNDA Term = "Expires after a set period"** shows the year stepper;
      the preview reads "Expires N year(s) from the Effective Date."
- [ ] Stepper shows "year" at 1 and "years" at 2+ (singular/plural).
- [ ] Stepper does not go below 1 or above 99.
- [ ] Switching to **"Continues until terminated"** hides the stepper and the
      preview reads the until-terminated sentence.
- [ ] **Term of Confidentiality = "In perpetuity"** hides its stepper and the
      preview reads "In perpetuity."

## 4. PDF generation (the core deliverable)
- [ ] Click **Download PDF** with the default form. A file downloads.
- [ ] Filename is `Mutual-NDA.pdf` when no companies are entered.
- [ ] Enter both company names → filename becomes
      `Mutual-NDA_<Company1>_and_<Company2>.pdf` (special characters stripped).
- [ ] Open the PDF and confirm **page 1** is the Cover Page: title, intro,
      Purpose, Effective Date (long format), MNDA Term, Term of Confidentiality,
      Governing Law & Jurisdiction, Modifications, and a two-column signature
      table with dashed signature lines.
- [ ] Confirm **page 2** is the Standard Terms: heading + all **11** numbered
      clauses with bold lead-ins, plus the Common Paper attribution footer.
- [ ] Spot-check that an empty field renders a bracketed placeholder in the PDF
      (e.g. `[State]`), matching the on-screen preview.
- [ ] Compare a couple of clauses in the PDF against `templates/Mutual-NDA.md`
      to confirm wording is identical (smart quotes included).
- [ ] Button shows "Preparing PDF…" / disabled state while generating, then
      returns to "Download PDF".

## 5. Error handling
- [ ] (Optional) Throttle/simulate a failure in the PDF import; confirm the
      `alert(...)` fallback fires and the button re-enables.

## 6. Layout & responsiveness
- [ ] Desktop (≥1024px): two-column form/preview layout; preview is sticky.
- [ ] Tablet/mobile (<1024px): columns stack; signature table stacks vertically;
      no horizontal overflow.
- [ ] The preview's internal scroll works for the long document.

## 7. Accessibility
- [ ] All form controls are reachable and operable by keyboard (Tab / arrows /
      Space).
- [ ] Stepper +/- buttons expose "Increase" / "Decrease" labels to a screen
      reader.
- [ ] Radio groups announce their selected option.
- [ ] Run an axe/Lighthouse pass; note any contrast or labelling issues.

## 8. Cross-browser
- [ ] Verify download + PDF render in Chrome and at least one of Firefox/Safari.
