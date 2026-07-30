import { getCustomers, getPriorityCustomers, getLoyaltySettings, type CustomerFilter } from "@/lib/queries/customers";
import { getCurrentProfile } from "@/lib/queries/profile";
import { CustomersShell } from "@/components/customers/CustomersShell";

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

  const canManage = profile?.role === "owner" || profile?.role === "manager";
  const isOwner = profile?.role === "owner" || profile?.role === "manager";

  return (
    <CustomersShell
      customers={customers}
      loyaltySettings={loyaltySettings}
      canManage={canManage}
      isOwner={isOwner}
    />
  );
}
