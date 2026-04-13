import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EKI Õigekirja Abivahend",
  description:
    "Eesti keele kirjaliku eksami abivahend. Tugineb EKI ametlikele õigekirja põhireeglitele.",
  keywords: ["eesti keel", "õigekiri", "eksam", "EKI", "keelekorrektuur"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="et" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
