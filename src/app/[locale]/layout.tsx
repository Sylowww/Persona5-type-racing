import type { Metadata } from "next";
import { Anton, Chivo, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { iconNames } from "@/components/ui/icon";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { mockPlayer, mockServerStatus } from "@/mocks/player";
import "../globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const chivo = Chivo({ weight: ["700", "900"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-chivo" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

// Only the icons in use are requested; Google Fonts expects them sorted.
const iconFontUrl = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${[...iconNames].sort().join(",")}&display=block`;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { metadata } = await getDictionary(locale);
  return { title: metadata.title, description: metadata.description };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale} className={`${anton.variable} ${chivo.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="stylesheet" href={iconFontUrl} />
      </head>
      <body className="relative min-h-screen overflow-x-hidden bg-surface-container-lowest font-body text-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container">
        <SiteHeader locale={locale} dictionary={dictionary.header} player={mockPlayer} server={mockServerStatus} />
        {children}
        <SiteFooter dictionary={dictionary.footer} />
      </body>
    </html>
  );
}
