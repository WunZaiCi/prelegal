# Prelegal · Mutual NDA Creator (PL-3)

A Next.js web app that generates a **Common Paper Mutual Non-Disclosure
Agreement** from a simple form and lets the user download it as a PDF.

The user fills in the Cover Page details (purpose, dates, term, governing law,
and both parties' information); the app renders a live preview of the complete
agreement — the filled Cover Page followed by the full Standard Terms — and a
one-click **Download PDF** button produces a ready-to-sign document.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [`@react-pdf/renderer`](https://react-pdf.org/) for client-side PDF generation

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## How it works

- `lib/standard-terms.ts` holds the Common Paper Mutual NDA **Standard Terms
  v1.0** as structured data — transcribed verbatim from
  [`../templates/Mutual-NDA.md`](../templates/Mutual-NDA.md). It is the single
  source of truth shared by both the on-screen preview and the PDF.
- `lib/nda-types.ts` defines the Cover Page form model and small formatting
  helpers.
- `components/NdaForm.tsx` is the controlled form; `components/NdaPreview.tsx`
  renders the live HTML document; `components/NdaPdfDocument.tsx` renders the
  downloadable PDF. Both renderers consume the same data.

## Attribution

The legal text is © [Common Paper](https://commonpaper.com) and used under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This tool does not
provide legal advice.
