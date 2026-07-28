"use client";

import { useState, useTransition } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { inviteEmployee } from "@/lib/actions/employees";

type InviteDrawerProps = {
  counters: { id: string; name: string }[];
};

export function InviteDrawer({ counters }: InviteDrawerProps) {
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
        <Button>Invite Employee</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Invite Employee</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleInvite} className="mt-6 flex flex-col gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">Email Address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-tile border border-line bg-surface p-3 text-body"
              placeholder="staff@example.com"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">Name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-tile border border-line bg-surface p-3 text-body"
              placeholder="e.g. Nimal"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="rounded-tile border border-line bg-surface p-3 text-body"
            >
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-label text-ink-2">Counter Assignment</span>
            <select
              value={counterId}
              onChange={(e) => setCounterId(e.target.value)}
              className="rounded-tile border border-line bg-surface p-3 text-body"
            >
              <option value="">None (Floating)</option>
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
