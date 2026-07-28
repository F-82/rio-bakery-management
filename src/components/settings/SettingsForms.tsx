"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { 
  updateBusinessProfile, 
  updateBusinessLogo, 
  updateOtherSettings, 
  updateLanguage 
} from "@/lib/actions/settings";
import type { Business } from "@/lib/queries/settings";

type SettingsFormsProps = {
  business: Business;
  settings: Record<string, string>;
  profileId: string;
  languagePref: string;
};

export function SettingsForms({ business, settings, profileId, languagePref }: SettingsFormsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "general" | "notifications">("profile");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex border-b border-line">
        {(["profile", "general", "notifications"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-body-sm font-medium capitalize ${
              activeTab === tab
                ? "border-b-2 border-accent text-accent"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === "profile" && <BusinessProfileForm business={business} />}
        {activeTab === "general" && <GeneralSettingsForm businessId={business.id} settings={settings} profileId={profileId} languagePref={languagePref} />}
        {activeTab === "notifications" && <NotificationsForm businessId={business.id} settings={settings} />}
      </div>
    </div>
  );
}

function BusinessProfileForm({ business }: { business: Business }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(business.name);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      let res = await updateBusinessProfile(business.id, name);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (file) {
        const formData = new FormData();
        formData.append("logo", file);
        res = await updateBusinessLogo(business.id, formData);
        if (!res.ok) {
          setError(res.error);
          return;
        }
      }
      setError(null);
      setFile(null); // Clear selected file after upload
    });
  };

  return (
    <form onSubmit={handleSave} className="flex max-w-md flex-col gap-6">
      <h2 className="text-h3">Business Profile</h2>
      
      <label className="flex flex-col gap-2">
        <span className="text-label text-ink-2">Business Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-tile border border-line bg-surface p-3 text-body"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink-2">Logo</span>
        <div className="flex items-center gap-4">
          {business.logo_url && !file && (
            <img src={business.logo_url} alt="Logo" className="size-16 rounded border border-line object-contain" />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-body-sm"
          />
        </div>
      </label>

      {error && <p className="text-alert-strong text-body-sm">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}

function GeneralSettingsForm({ businessId, settings, profileId, languagePref }: { businessId: string; settings: Record<string, string>; profileId: string; languagePref: string }) {
  const [isPending, startTransition] = useTransition();
  const [currency, setCurrency] = useState(settings["currency"] || "LKR");
  const [taxRate, setTaxRate] = useState(settings["tax.rate"] || "0");
  const [printerIp, setPrinterIp] = useState(settings["printer.ip"] || "");
  const [lang, setLang] = useState(languagePref);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateOtherSettings(businessId, {
        "currency": currency,
        "tax.rate": taxRate,
        "printer.ip": printerIp,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      
      const langRes = await updateLanguage(profileId, lang);
      if (!langRes.ok) {
        setError(langRes.error);
        return;
      }
      setError(null);
    });
  };

  return (
    <form onSubmit={handleSave} className="flex max-w-md flex-col gap-6">
      <h2 className="text-h3">General Settings</h2>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink-2">Language</span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="rounded-tile border border-line bg-surface p-3 text-body"
        >
          <option value="en">English</option>
          <option value="si">Sinhala</option>
          <option value="ta">Tamil</option>
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink-2">Currency</span>
        <input
          type="text"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded-tile border border-line bg-surface p-3 text-body"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink-2">Default Tax Rate (%)</span>
        <input
          type="number"
          step="0.01"
          value={taxRate}
          onChange={(e) => setTaxRate(e.target.value)}
          className="rounded-tile border border-line bg-surface p-3 text-body"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink-2">Printer IP Address</span>
        <input
          type="text"
          value={printerIp}
          onChange={(e) => setPrinterIp(e.target.value)}
          className="rounded-tile border border-line bg-surface p-3 text-body"
          placeholder="e.g. 192.168.1.100"
        />
      </label>

      {error && <p className="text-alert-strong text-body-sm">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}

function NotificationsForm({ businessId, settings }: { businessId: string; settings: Record<string, string> }) {
  const [isPending, startTransition] = useTransition();
  const [emailAlerts, setEmailAlerts] = useState(settings["notifications.email"] === "true");
  const [smsAlerts, setSmsAlerts] = useState(settings["notifications.sms"] === "true");
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateOtherSettings(businessId, {
        "notifications.email": emailAlerts ? "true" : "false",
        "notifications.sms": smsAlerts ? "true" : "false",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
    });
  };

  return (
    <form onSubmit={handleSave} className="flex max-w-md flex-col gap-6">
      <h2 className="text-h3">Notifications</h2>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={emailAlerts}
          onChange={(e) => setEmailAlerts(e.target.checked)}
          className="size-5 rounded border-line text-accent"
        />
        <span className="text-body">Email Alerts</span>
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={smsAlerts}
          onChange={(e) => setSmsAlerts(e.target.checked)}
          className="size-5 rounded border-line text-accent"
        />
        <span className="text-body">SMS Alerts</span>
      </label>

      {error && <p className="text-alert-strong text-body-sm">{error}</p>}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving..." : "Save Notifications"}
      </Button>
    </form>
  );
}
