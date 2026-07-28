import { getBusinessSettings } from "@/lib/queries/settings";
import { getCurrentProfile } from "@/lib/queries/profile";
import { PageHeader } from "@/components/patterns/PageHeader";
import { SettingsForms } from "@/components/settings/SettingsForms";
import { redirect } from "next/navigation";
import { getTranslation } from "@/lib/i18n-server";

export default async function SettingsPage() {
    const { t } = await getTranslation();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "owner") {
    // Only owner should access full settings (some manager access maybe, but spec implies owner configuration)
    redirect("/");
  }

  const { business, settings } = await getBusinessSettings();

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t("Settings")}
      />

      <SettingsForms 
        business={business} 
        settings={settings} 
        profileId={profile.id}
        languagePref={profile.language_pref}
      />
    </div>
  );
}
