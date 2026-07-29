import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Receipt } from "lucide-react";
import { AppShell } from "@/components/shared/AppShell";

export default async function TaxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell pageLabel="Tax">
      <div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>Rio Bakers Hut</span>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-neutral-800 font-medium">Tax</span>
        </div>
        <h1 className="mt-1 text-3xl font-light tracking-tight text-neutral-900">Tax</h1>
      </div>

      <div className="flex flex-col items-center justify-center rounded-[24px] border border-black/5 py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <Receipt className="h-7 w-7 text-neutral-400" />
        </div>
        <h2 className="text-xl font-light text-neutral-800">Tax management coming soon</h2>
        <p className="mt-2 text-sm text-neutral-500 max-w-xs">
          VAT tracking, tax reports, and filing summaries are planned for a future release. Tax categories are already applied at the menu level.
        </p>
      </div>
    </AppShell>
  );
}
