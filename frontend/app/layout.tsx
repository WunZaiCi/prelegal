import type { Metadata } from "next";
// Self-hosted fonts (no build-time Google Fonts fetch). The matching CSS
// variables are defined in globals.css and consumed by tailwind.config.ts.
// Archivo drives the app chrome; Newsreader is reserved for the document preview.
import "@fontsource-variable/archivo/index.css";
import "@fontsource-variable/newsreader/index.css";
import "@fontsource-variable/newsreader/standard-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prelegal · Legal Document Creator",
  description:
    "Draft legal documents through an AI chat, save your drafts, and download ready-to-review PDFs. Drafts only — not legal advice.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
