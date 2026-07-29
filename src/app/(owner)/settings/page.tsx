import { redirect } from "next/navigation";
import { getBusinessSettings } from "@/lib/queries/settings";
import { getCurrentProfile } from "@/lib/queries/profile";
import { SettingsForms } from "@/components/settings/SettingsForms";
import { Settings } from "lucide-react";
import { AppShell } from "@/components/shared/AppShell";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "owner") redirect("/");

  const { business, settings } = await getBusinessSettings();

  return (
    <AppShell pageLabel="Settings">
      <div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>Rio Bakers Hut</span>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-neutral-800 font-medium">Settings</span>
        </div>
        <h1 className="mt-1 text-3xl font-light tracking-tight text-neutral-900">Settings</h1>
      </div>

      <div className="rounded-[24px] border border-black/5 overflow-hidden">
        <SettingsForms
          business={business}
          settings={settings}
          profileId={profile.id}
          languagePref={profile.language_pref}
        />
      </div>
    </AppShell>
  );
}
