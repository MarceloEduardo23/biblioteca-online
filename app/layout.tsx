import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { LibraryProvider } from "@/contexts/library-context";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "BiblioFlix - Biblioteca Digital",
  description: "Sistema de biblioteca digital com empréstimos via QR Code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark bg-background">
      <body className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased`}>
        <LibraryProvider>
          {children}
          <Toaster />
        </LibraryProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
