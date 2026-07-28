import type { Metadata } from "next";
import { generalSans, notoSansSinhala } from "@/lib/fonts";
import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";
import { getCurrentProfile } from "@/lib/queries/profile";

export const metadata: Metadata = {
  title: "Rio Bakers Hut",
  description: "Till, kitchen and back office for Rio Bakers Hut",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();
  const languagePref = profile?.language_pref || "en";

  return (
    <html lang={languagePref} className={`${generalSans.variable} ${notoSansSinhala.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <I18nProvider languagePref={languagePref}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
