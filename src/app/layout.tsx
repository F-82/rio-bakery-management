import type { Metadata } from "next";
import { ranade, generalSans } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rio Bakers Hut",
  description: "Till, kitchen and back office for Rio Bakers Hut",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ranade.variable} ${generalSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
