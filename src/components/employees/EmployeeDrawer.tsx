"use client";

import { useState, useTransition, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { updateEmployeeRole, updateEmployeeStatus } from "@/lib/actions/employees";
import type { EmployeeProfile } from "@/lib/queries/employees";

type EmployeeDrawerProps = {
  profileId: string | null;
  employee?: EmployeeProfile;
  counters: { id: string; name: string }[];
  onClose: () => void;
};

export function EmployeeDrawer({ profileId, employee, counters, onClose }: EmployeeDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<"owner" | "manager" | "staff">("staff");
  const [counterId, setCounterId] = useState<string>("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (employee) {
      setRole(employee.role);
      setCounterId(employee.counter_id ?? "");
      setActive(employee.active);
    }
  }, [employee]);

  const handleSave = () => {
    if (!profileId) return;
    startTransition(async () => {
      await updateEmployeeRole(profileId, role, counterId || null);
      await updateEmployeeStatus(profileId, active);
      onClose();
    });
  };

  return (
    <Sheet open={!!profileId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Employee</SheetTitle>
        </SheetHeader>
        {employee && (
          <div className="mt-6 flex flex-col gap-6">
            <div>
              <p className="text-h3">{employee.name}</p>
              <p className="text-body-sm text-ink-2">{employee.id}</p>
            </div>

            <div className="flex flex-col gap-4">
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

              <label className="flex items-center gap-3 mt-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="size-5 rounded border-line text-accent"
                />
                <span className="text-body">Account active</span>
              </label>
            </div>

            <div className="mt-4 flex gap-3">
              <Button onClick={handleSave} disabled={isPending} className="flex-1">
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
