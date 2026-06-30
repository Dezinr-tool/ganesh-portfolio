"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmailListFieldProps = {
  id?: string;
  label?: string;
  emails: string[];
  onChange: (emails: string[]) => void;
  required?: boolean;
};

export function EmailListField({
  id = "clientEmail",
  label = "Email",
  emails,
  onChange,
  required = false,
}: EmailListFieldProps) {
  function updateEmail(index: number, value: string) {
    onChange(emails.map((email, i) => (i === index ? value : email)));
  }

  function addEmail() {
    onChange([...emails, ""]);
  }

  function removeEmail(index: number) {
    onChange(emails.length === 1 ? [""] : emails.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="space-y-2">
        {emails.map((email, index) => (
          <div key={index} className="flex gap-2">
            <Input
              id={index === 0 ? id : `${id}-${index}`}
              type="email"
              required={required && index === 0}
              value={email}
              onChange={(event) => updateEmail(index, event.target.value)}
              placeholder={index === 0 ? "Primary email" : "Additional email"}
              className="min-w-0 flex-1"
            />
            {emails.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeEmail(index)}
                aria-label={`Remove email ${index + 1}`}
              >
                Remove
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addEmail}>
        + Add email
      </Button>
    </div>
  );
}
