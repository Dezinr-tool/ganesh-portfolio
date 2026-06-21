"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  SignatureCanvas,
  type SignatureCanvasRef,
} from "@/components/dashboard/agreements/signature-canvas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SignGaneshButtonProps = {
  agreementId: string;
  alreadySigned: boolean;
};

export function SignGaneshButton({
  agreementId,
  alreadySigned,
}: SignGaneshButtonProps) {
  const router = useRouter();
  const canvasRef = useRef<SignatureCanvasRef>(null);
  const [open, setOpen] = useState(false);
  const [defaultSignature, setDefaultSignature] = useState<string | null>(null);
  const [loadingDefault, setLoadingDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  function openModal() {
    setOpen(true);
    setLoadingDefault(true);
    setError(null);
    setHasDrawnSignature(false);

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setDefaultSignature(data.signature ?? null))
      .catch(() => setDefaultSignature(null))
      .finally(() => setLoadingDefault(false));
  }

  if (alreadySigned) {
    return <Badge variant="secondary">Signed by you</Badge>;
  }

  async function handleSign(signature: string) {
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/agreements/${agreementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign_ganesh", signature }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to sign.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Failed to sign.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleConfirmDefault() {
    if (!defaultSignature) return;
    void handleSign(defaultSignature);
  }

  function handleConfirmDrawn() {
    const signature = canvasRef.current?.getDataUrl();
    if (!signature) {
      setError("Please draw your signature first.");
      return;
    }
    void handleSign(signature);
  }

  return (
    <>
      <Button type="button" onClick={openModal}>
        Sign as Ganesh Das
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sign agreement</DialogTitle>
            <DialogDescription>
              {loadingDefault
                ? "Loading signature…"
                : defaultSignature
                  ? "Using your saved default signature."
                  : "No default signature set. Draw your signature below, or add one in Settings."}
            </DialogDescription>
          </DialogHeader>

          {loadingDefault ? null : defaultSignature ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={defaultSignature}
                alt="Your default signature"
                className="mx-auto max-h-24 object-contain"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <Link href="/dashboard/settings" className="underline">
                  Add a default signature in Settings
                </Link>
              </p>
              <div className="overflow-x-auto rounded-lg border border-border p-2">
                <SignatureCanvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  onChange={setHasDrawnSignature}
                />
              </div>
            </div>
          )}

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {defaultSignature ? (
              <Button
                type="button"
                onClick={handleConfirmDefault}
                disabled={submitting}
              >
                {submitting ? "Signing…" : "Confirm & Sign"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleConfirmDrawn}
                disabled={submitting || !hasDrawnSignature}
              >
                {submitting ? "Signing…" : "Confirm & Sign"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
