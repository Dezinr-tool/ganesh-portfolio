"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
};

type RazorpayInstance = { open: () => void };

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type Props = {
  invoiceId: string;
  invoiceNumber: string;
  amount: number; // in rupees, display only
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayCheckout({ invoiceId, invoiceNumber, amount }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePayment = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setStatus("error");
      setErrorMessage("Could not load Razorpay. Check your internet connection.");
      return;
    }

    // 1. Create order on backend
    let orderData: {
      order_id: string;
      amount: number;
      currency: string;
      client_name: string;
      client_email: string;
    };

    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Failed to create payment order.");
        return;
      }
      orderData = data;
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
      return;
    }

    // 2. Open Razorpay checkout modal
    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: orderData.amount as number,
      currency: orderData.currency,
      name: "Ganesh Das",
      description: `Payment for ${invoiceNumber}`,
      order_id: orderData.order_id,
      prefill: {
        name: orderData.client_name,
        email: orderData.client_email,
      },
      theme: { color: "#111111" },
      handler: async (response) => {
        // 3. Verify signature on backend
        try {
          const verifyRes = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              invoice_id: invoiceId,
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            setStatus("error");
            setErrorMessage(verifyData.error ?? "Payment verification failed.");
            return;
          }

          setStatus("success");
          // Refresh page data to show updated status
          router.refresh();
        } catch {
          setStatus("error");
          setErrorMessage("Payment received but verification failed. Please contact support.");
        }
      },
      modal: {
        ondismiss: () => {
          if (status === "loading") setStatus("idle");
        },
      },
    });

    rzp.open();
    // Status stays "loading" until handler resolves or modal is dismissed
  }, [invoiceId, invoiceNumber, router, status]);

  if (status === "success") {
    return (
      <p className="text-sm font-medium text-green-700">
        ✓ Payment received — invoice marked as paid
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handlePayment}
        disabled={status === "loading"}
        variant="default"
        size="sm"
      >
        {status === "loading" ? "Opening payment…" : "Pay Now"}
      </Button>
      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
