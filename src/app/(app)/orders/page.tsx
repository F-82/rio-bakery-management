import Link from "next/link";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmptyState } from "@/components/patterns/EmptyState";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Orders"
        actions={
          <Button asChild>
            <Link href="/orders/new">New order</Link>
          </Button>
        }
      />
      <EmptyState icon={Receipt} message="The active/archived order list lands in step 09." />
    </div>
  );
}
