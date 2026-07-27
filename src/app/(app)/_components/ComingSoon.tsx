import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";

type ComingSoonProps = {
  title: string;
  icon: LucideIcon;
  step: string;
};

/** Placeholder for a nav destination whose real screen lands in a later STEPS.md step. */
export function ComingSoon({ title, icon, step }: ComingSoonProps) {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader title={title} />
      <EmptyState icon={icon} message={`${title} lands in ${step}.`} />
    </div>
  );
}
