"use client";

import { useState, useTransition } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { inviteEmployee } from "@/lib/actions/employees";
import { useTranslation } from "react-i18next";

type InviteDrawerProps = {
  counters: { id: string; name: string }[];
};

export function InviteDrawer({ counters }: InviteDrawerProps) {
    const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"owner" | "manager" | "staff">("staff");
  const [counterId, setCounterId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await inviteEmployee(email, name, role, counterId || null);
      if (res.success) {
        setIsOpen(false);
        setEmail("");
        setName("");
        setRole("staff");
        setCounterId("");
      } else {
        setError(res.error || "Failed to send invite");
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>{t("Invite Employee")}</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("Invite Employee")}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleInvite} className="mt-6 flex flex-col gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">{t("Email Address")}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-tile border border-line bg-surface p-3 text-body"
              placeholder={t("staff@example.com")}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">{t("Name")}</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-tile border border-line bg-surface p-3 text-body"
              placeholder={t("e.g. Nimal")}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">{t("Role")}</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "owner" | "manager" | "staff")}
              className="rounded-tile border border-line bg-surface p-3 text-body"
            >
              <option value="owner">{t("Owner")}</option>
              <option value="manager">{t("Manager")}</option>
              <option value="staff">{t("Staff")}</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">{t("Counter Assignment")}</span>
            <select
              value={counterId}
              onChange={(e) => setCounterId(e.target.value)}
              className="rounded-tile border border-line bg-surface p-3 text-body"
            >
              <option value="">{t("None (Floating)")}</option>
              {counters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="text-alert-strong text-body-sm">{error}</p>}

          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? "Sending Invite..." : "Send Invite"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
