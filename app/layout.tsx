import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { mohave } from "./fonts";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ganesh Das — Design & Strategy Partner",
  description:
    "Design & Strategy Partner for Startups. Ganesh Das helps founders build products people love — D2C, B2B & B2B2C specialist with 14+ years across funded Indian startups.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mohave.variable} h-full`}
    >
      <body className="min-h-full font-sans antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
