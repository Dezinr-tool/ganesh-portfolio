import { Syne, DM_Sans } from "next/font/google";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export default function DesignAuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${syne.variable} ${dmSans.variable} font-[family-name:var(--font-dm-sans)]`}>
      {children}
    </div>
  );
}
