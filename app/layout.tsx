import type { Metadata } from "next";
import { DesignTokensStyle } from "@/components/design-system/design-tokens-style";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { ConnectButton } from "@/components/ui/ConnectButton";
import { SiteNav } from "@/components/ui/SiteNav";
import { PageLoader } from "@/components/ui/PageLoader";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { breton, inter, machine } from "./fonts";
import "./globals.css";

const siteUrl = "https://www.designbyganesh.com";
const title = "Ganesh Das — Design & Strategy Partner";
const description =
  "Ganesh Das is a designer in Mumbai with 15+ years of experience. Product design, research, and design systems for founders and product teams.";
const ogImage = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: title,
  type: "image/jpeg",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Ganesh Das",
    locale: "en_US",
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage.url],
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: "Ganesh",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "var(--color-bg)",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${breton.variable} ${machine.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;if(p.indexOf("/dashboard")===0||p.indexOf("/expense-tracker")===0||p.indexOf("/sign")===0)return;if(sessionStorage.getItem("portfolio-loaded")==="1")return;if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;document.documentElement.classList.add("page-loader-active");setTimeout(function(){document.documentElement.classList.remove("page-loader-active")},6000)}catch(e){}})();`,
          }}
        />
      </head>
      <body className="relative min-h-full bg-[var(--color-bg)] font-sans text-[var(--color-text)] antialiased">
        <DesignTokensStyle />
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <SmoothScroll>
          <ScrollProgress />
          <PageLoader />
          {children}
          <SiteNav />
          <ConnectButton />
        </SmoothScroll>
      </body>
    </html>
  );
}
