import { isAdSenseConfigured } from "@/lib/adsense-config";
import { DashboardAd } from "./dashboard-ad";

export function DashboardAdRail() {
  if (!isAdSenseConfigured()) return null;

  return (
    <aside className="hidden w-[300px] shrink-0 xl:block" aria-label="Sidebar ads">
      <div className="sticky top-24">
        <DashboardAd placement="sidebar" />
      </div>
    </aside>
  );
}

export function DashboardAdBanner({ className }: { className?: string }) {
  if (!isAdSenseConfigured()) return null;
  return <DashboardAd placement="banner" className={className} />;
}
