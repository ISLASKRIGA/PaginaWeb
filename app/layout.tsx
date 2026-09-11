import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alma & Tierra | Bienestar con intención",
  description:
    "Cuarzos, cuencos, meditaciones y experiencias para acompañarte en tu camino de bienestar.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className="antialiased">{children}</body>
    </html>
  );
}
