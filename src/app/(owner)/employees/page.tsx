import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployees } from "@/lib/queries/employees";
import { getActiveCounters } from "@/lib/queries/counters";
import { getCurrentProfile } from "@/lib/queries/profile";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmployeesList } from "@/components/employees/EmployeesList";
import { InviteDrawer } from "@/components/employees/InviteDrawer";
import { getTranslation } from "@/lib/i18n-server";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { t } = await getTranslation();
  const profile = await getCurrentProfile();

  const [employees, counters] = await Promise.all([
    getEmployees(),
    getActiveCounters(),
  ]);

  const isOwner = profile?.role === "owner";

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t("Employees")}
        actions={isOwner ? <InviteDrawer counters={counters} /> : undefined}
      />

      <div className="p-6">
        <EmployeesList
          employees={employees}
          counters={counters}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
