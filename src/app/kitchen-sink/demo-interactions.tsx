"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PrintStatus } from "@/components/patterns/PrintStatus";
import { TabPills } from "@/components/patterns/TabPills";

/**
 * The kitchen-sink page itself is a Server Component. These patterns take
 * onClick/onChange handlers or hold state, and neither can cross the
 * server/client boundary as a prop — so the demo instances live here instead.
 */
export function EmptyStateDemo() {
  return (
    <EmptyState
      icon={Inbox}
      message="No orders yet today. Take the first one."
      action={{ label: "New order", onClick: () => {} }}
    />
  );
}

export function PrintStatusFailedDemo() {
  return <PrintStatus status="failed" onReprint={() => {}} />;
}

const TAB_PILLS_DEMO_TABS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;

export function TabPillsDemo() {
  const [value, setValue] = useState<"active" | "archived">("active");
  return <TabPills tabs={TAB_PILLS_DEMO_TABS} value={value} onChange={setValue} label="Demo tabs" />;
}
