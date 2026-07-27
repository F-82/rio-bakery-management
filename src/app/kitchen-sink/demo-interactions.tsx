"use client";

import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PrintStatus } from "@/components/patterns/PrintStatus";

/**
 * The kitchen-sink page itself is a Server Component. These two patterns
 * take onClick handlers, and an inline closure can't cross the server/client
 * boundary as a prop — so the demo instances that need one live here instead.
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
