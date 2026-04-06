import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aether Ink — Flow-State Creative Writing",
  description: "A local-first, minimalist creative writing environment designed for flow state. Zen-focused, context-aware interface with LLM-powered narrative architecture.",
  keywords: ["creative writing", "writing app", "flow state", "minimalist editor", "local-first"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#141519" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
