import { BrandSettingsForm } from "./brand-settings-form";
import { PaymentBillingSettingsForm } from "./payment-billing-settings-form";
import { SignatureSettingsForm } from "./signature-settings-form";
import { PageHeader } from "../_components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage brand tokens, billing details, and your default signature."
      />

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Brand</CardTitle>
            <CardDescription>
              Colors used on invoices, agreements, and exported PDFs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BrandSettingsForm />
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Payment & Billing</CardTitle>
            <CardDescription>
              Default rates and payment details for new invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentBillingSettingsForm />
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Signature</CardTitle>
            <CardDescription>
              Default signature for signing agreements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignatureSettingsForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
