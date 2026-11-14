import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nexus CRM | High-Velocity Sales & Evolution API WhatsApp Hub",
  description:
    "CRM moderno de alta produtividade para times de vendas com Funil Kanban, Visão 360º do Cliente e Integração Evolution API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-[#f8f9fa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
