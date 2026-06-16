import type { Metadata } from "next";
// Self-hosted fonts (no build-time Google Fonts fetch). The matching CSS
// variables are defined in globals.css and consumed by tailwind.config.ts.
import "@fontsource-variable/fraunces/index.css";
import "@fontsource-variable/fraunces/standard-italic.css";
import "@fontsource-variable/newsreader/index.css";
import "@fontsource-variable/newsreader/standard-italic.css";
import "@fontsource-variable/archivo/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prelegal · Mutual NDA Creator",
  description:
    "Generate a Common Paper Mutual Non-Disclosure Agreement from a simple form and download it as a PDF.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-grain-overlay">{children}</body>
    </html>
  );
}
