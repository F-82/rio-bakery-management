import { PageHeader } from "@/components/patterns/PageHeader";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { CustomerList } from "@/components/customers/CustomerList";
import { AddCustomerDrawer } from "@/components/customers/AddCustomerDrawer";
import { LoyaltySettingsCard } from "@/components/customers/LoyaltySettingsCard";
import { getCustomers, getPriorityCustomers, getLoyaltySettings, type CustomerFilter } from "@/lib/queries/customers";
import { getCurrentProfile } from "@/lib/queries/profile";

type CustomersPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;

  const filter: CustomerFilter = {
    priorityOnly: firstValue(params.priority) === "1",
    search: firstValue(params.search),
  };

  const [profile, customers, loyaltySettings] = await Promise.all([
    getCurrentProfile(),
    filter.priorityOnly ? getPriorityCustomers(filter.search) : getCustomers(filter),
    getLoyaltySettings(),
  ]);

  // customers page only appears in the owner/manager nav (staff have no More
  // sheet, see lib/nav.ts), but this mirrors the RLS boundary explicitly
  // rather than assuming the route is unreachable for staff.
  const canManage = profile?.role === "owner" || profile?.role === "manager";
  const isOwner = profile?.role === "owner";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 p-4 pb-0 sm:p-6 sm:pb-0">
        <PageHeader title="Customers" actions={canManage ? <AddCustomerDrawer /> : undefined} />
      </div>
      <CustomerFilters />
      {/* Keyed by the filter so a filter change remounts with fresh rows instead of syncing new props into local state via an effect. */}
      <CustomerList key={JSON.stringify(filter)} customers={customers} />
      {isOwner && (
        <div className="px-4 pb-6 sm:px-6">
          <LoyaltySettingsCard initial={loyaltySettings} />
        </div>
      )}
    </div>
  );
}
