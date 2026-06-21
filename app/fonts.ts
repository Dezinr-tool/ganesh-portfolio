import { Inter, Mohave } from "next/font/google";
import localFont from "next/font/local";

/** GANESH watermark — pre-Luke hero */
export const mohave = Mohave({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mohave",
  display: "swap",
});

/** UI / body — same as lukebaffait.fr */
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

/** Display — Breton (Luke "Luke" / headings) */
export const breton = localFont({
  src: "../public/fonts/Breton.woff2",
  variable: "--font-breton",
  display: "swap",
});

/** Serif accent — Machine / Luke `other` ("Baffait." / "Das.") */
export const machine = localFont({
  src: "../public/fonts/Machine.otf",
  variable: "--font-machine",
  display: "block",
  weight: "400",
  style: "normal",
  declarations: [{ prop: "font-synthesis", value: "none" }],
});
