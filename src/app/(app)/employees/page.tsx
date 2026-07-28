import { getEmployees } from "@/lib/queries/employees";
import { getActiveCounters } from "@/lib/queries/counters";
import { getCurrentProfile } from "@/lib/queries/profile";
import { PageHeader } from "@/components/patterns/PageHeader";
import { EmployeesList } from "@/components/employees/EmployeesList";
import { InviteDrawer } from "@/components/employees/InviteDrawer";

export default async function EmployeesPage() {
  const profile = await getCurrentProfile();
  
  const [employees, counters] = await Promise.all([
    getEmployees(),
    getActiveCounters()
  ]);

  const isOwner = profile?.role === "owner";

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Employees"
        description="Manage your team members and their roles."
        action={isOwner ? <InviteDrawer counters={counters} /> : undefined}
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
