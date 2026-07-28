import { CircleHelp } from "lucide-react";
import { EmptyState } from "@/components/patterns/EmptyState";

/**
 * Client blocker #6 (STEPS.md §Client blockers) — "Platform Earnings — what
 * is it, is it internal" — is unanswered, so this stays a stub rather than
 * guessing a schema or a metric (STEPS.md §14: "Client hasn't defined it").
 */
export function PlatformEarningsTab() {
  return (
    <div className="p-4 sm:p-6">
      <EmptyState icon={CircleHelp} message="Confirming scope with the client. Platform Earnings isn't defined yet." />
    </div>
  );
}
