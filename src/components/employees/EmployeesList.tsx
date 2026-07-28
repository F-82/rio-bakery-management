"use client";

import { useState } from "react";
import { DataTable } from "@/components/patterns/DataTable";
import { Badge } from "@/components/ui/badge";
import type { EmployeeProfile } from "@/lib/queries/employees";
import { EmployeeDrawer } from "./EmployeeDrawer";

type EmployeesListProps = {
  employees: EmployeeProfile[];
  counters: { id: string; name: string }[];
  isOwner: boolean;
};

export function EmployeesList({ employees, counters, isOwner }: EmployeesListProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  return (
    <>
      <DataTable
        data={employees}
        columns={[
          {
            header: "Name",
            accessor: (e) => e.name ?? "—",
          },
          {
            header: "Role",
            accessor: (e) => (
              <Badge variant={e.role === "owner" ? "default" : "secondary"} className="capitalize">
                {e.role}
              </Badge>
            ),
          },
          {
            header: "Counter",
            accessor: (e) => e.counters?.name ?? "—",
          },
          {
            header: "Status",
            accessor: (e) => (
              <Badge variant={e.active ? "secondary" : "outline"} className={!e.active ? "text-ink-3" : ""}>
                {e.active ? "Active" : "Inactive"}
              </Badge>
            ),
          },
        ]}
        getRowKey={(e) => e.id}
        onRowClick={isOwner ? (e) => setSelectedProfileId(e.id) : undefined}
      />

      {isOwner && (
        <EmployeeDrawer
          profileId={selectedProfileId}
          employee={employees.find((e) => e.id === selectedProfileId)}
          counters={counters}
          onClose={() => setSelectedProfileId(null)}
        />
      )}
    </>
  );
}
