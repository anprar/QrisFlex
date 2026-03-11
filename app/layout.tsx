import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import { Providers } from "@/app/providers";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://qrisflex.id"),
  title: {
    default: "QrisFlex - Ubah QRIS Statis jadi Dinamis dalam 3 Detik",
    template: "%s | QrisFlex",
  },
  description:
    "QrisFlex adalah converter QRIS statis ke dinamis yang cepat, offline-ready, API ready, dan dioptimalkan untuk Vercel Edge.",
  applicationName: "QrisFlex",
  keywords: ["QRIS", "QRIS dinamis", "converter QRIS", "QRIS statis ke dinamis", "Vercel Next.js"],
  openGraph: {
    title: "QrisFlex",
    description: "Ubah QRIS statis menjadi dinamis dalam 3 detik.",
    url: "https://qrisflex.id",
    siteName: "QrisFlex",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QrisFlex",
    description: "Converter QRIS statis ke dinamis yang ringan, aman, dan API ready.",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe3" },
    { media: "(prefers-color-scheme: dark)", color: "#07110d" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} bg-background text-foreground antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
