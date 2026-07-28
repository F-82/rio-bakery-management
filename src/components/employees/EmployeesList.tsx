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
        rows={employees}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (e) => <div className="flex items-center gap-2 font-medium">{e.name}</div>,
          },
          {
            key: "role",
            header: "Role",
            render: (e) => (
              <Badge variant={e.role === "owner" ? "default" : "secondary"} className="capitalize">
                {e.role}
              </Badge>
            ),
          },

          {
            key: "counter",
            header: "Counter",
            render: (e) => (
              <Badge variant="secondary" className="font-normal text-ink-2">
                {e.counters?.name || "None"}
              </Badge>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (e) => (
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
