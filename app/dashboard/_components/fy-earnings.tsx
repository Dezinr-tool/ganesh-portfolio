import type { FYSummary } from "@/lib/dashboard-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkline } from "./sparkline";
import { formatCurrency } from "../_lib/invoices";

const MONTH_LABELS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

type FYEarningsProps = {
  current: FYSummary;
  previous: FYSummary;
};

function FYCard({ fy, isCurrent }: { fy: FYSummary; isCurrent: boolean }) {
  const hasData = fy.earned > 0 || fy.pending > 0;
  const maxMonth = fy.monthlyEarned.indexOf(Math.max(...fy.monthlyEarned));

  return (
    <Card className={isCurrent ? "ring-1 ring-foreground/10" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {fy.label}
          </CardTitle>
          {isCurrent ? (
            <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
              Current
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {formatCurrency(fy.earned)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            earned · {fy.invoiceCount} invoice{fy.invoiceCount !== 1 ? "s" : ""}
            {fy.pending > 0 ? ` · ${formatCurrency(fy.pending)} pending` : ""}
          </p>
        </div>

        {hasData ? (
          <div>
            <Sparkline data={fy.monthlyEarned} color="#111111" variant="bar" />
            <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
              {MONTH_LABELS.map((m, i) => (
                <span key={m} className={i === maxMonth && fy.monthlyEarned[i] > 0 ? "font-semibold text-foreground" : ""}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No invoices this year</p>
        )}
      </CardContent>
    </Card>
  );
}

export function FYEarnings({ current, previous }: FYEarningsProps) {
  const showPrevious = previous.invoiceCount > 0 || previous.earned > 0;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Earnings by financial year</h2>
      <div className={`grid gap-4 ${showPrevious ? "sm:grid-cols-2" : ""}`}>
        <FYCard fy={current} isCurrent={true} />
        {showPrevious ? <FYCard fy={previous} isCurrent={false} /> : null}
      </div>
    </div>
  );
}
