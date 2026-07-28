import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  getTodaysExpenseTotal,
  getTodaysOrders,
  getTodaysPrintJobs,
} from "@/lib/queries/dashboard";
import { getStockLevels } from "@/lib/queries/inventory";

export default async function DashboardPage() {
  const [orders, expensesToday, stockLevels] = await Promise.all([
    getTodaysOrders(),
    getTodaysExpenseTotal(),
    getStockLevels(),
  ]);

  const printJobs = await getTodaysPrintJobs(orders.map((o) => o.id));

  return (
    <DashboardShell
      initialOrders={orders}
      initialPrintJobs={printJobs}
      initialStockLevels={stockLevels}
      expensesToday={expensesToday}
    />
  );
}
