import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getTodaysExpenseTotal, getTodaysOrders, getTodaysPrintJobs } from "@/lib/queries/dashboard";
import { getStockLevels } from "@/lib/queries/inventory";

export default async function DashboardPage() {
  const [orders, expensesToday, stockLevels] = await Promise.all([
    getTodaysOrders(),
    getTodaysExpenseTotal(),
    getStockLevels(),
  ]);

  // Depends on today's order ids, so it can't join the Promise.all above.
  const printJobs = await getTodaysPrintJobs(orders.map((order) => order.id));

  return (
    <DashboardClient
      initialOrders={orders}
      initialPrintJobs={printJobs}
      initialStockLevels={stockLevels}
      expensesToday={expensesToday}
    />
  );
}
