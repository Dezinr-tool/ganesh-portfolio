import { redirect } from "next/navigation";

/** Convenience alias — tracker lives at /expense-tracker (standalone). */
export default function DashboardExpenseTrackerRedirect() {
  redirect("/expense-tracker");
}
