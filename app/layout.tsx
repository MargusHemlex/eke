import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#f9f9f8",
};

export const metadata: Metadata = {
  title: "EKE Kirjutamise Abiline",
  description: "Eesti keele kirjaliku eksami abivahend. Tugineb EKI ametlikele õigekirja põhireeglitele.",
  keywords: ["eesti keel", "õigekiri", "eksam", "EKI", "keelekorrektuur"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="et" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
