"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateLoyaltyRates } from "@/lib/actions/settings";
import type { LoyaltySettings } from "@/lib/queries/customers";
import { useTranslation } from "react-i18next";

const inputClass = "h-11 rounded-tile border border-line bg-surface px-3 text-body-sm text-ink";
const labelClass = "text-label text-ink-2";

/**
 * Owner-only (settings_write RLS is owner-only; this component is only
 * mounted for an owner profile). ARCHITECTURE.md flags the redeem rate as
 * needing sign-off — at earn 1/LKR, redeem 1 LKR/point is a 100% discount.
 */
export function LoyaltySettingsCard({ initial }: { initial: LoyaltySettings }) {
    const { t } = useTranslation();
  const formId = useId();
  const [earnRate, setEarnRate] = useState(String(initial.earnPointsPerLkr));
  const [redeemRate, setRedeemRate] = useState(String(initial.redeemLkrPerPoint));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const earnValue = Number(earnRate);
  const redeemValue = Number(redeemRate);
  const impliedDiscount = Number.isFinite(earnValue) && Number.isFinite(redeemValue) ? earnValue * redeemValue : NaN;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const result = await updateLoyaltyRates({ earnPointsPerLkr: earnValue, redeemLkrPerPoint: redeemValue });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-card bg-surface p-6">
      <div>
        <h3 className="text-h3 text-ink">{t("Loyalty rates")}</h3>
        <p className="text-body-sm text-ink-2">{t("How fast customers earn points, and what a point is worth back.")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`${formId}-earn`}>
            {t("Points earned per LKR")}</label>
          <input
            id={`${formId}-earn`}
            type="number"
            step="0.01"
            min="0"
            value={earnRate}
            onChange={(event) => setEarnRate(event.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor={`${formId}-redeem`}>
            {t("LKR per point redeemed")}</label>
          <input
            id={`${formId}-redeem`}
            type="number"
            step="0.001"
            min="0"
            value={redeemRate}
            onChange={(event) => setRedeemRate(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {Number.isFinite(impliedDiscount) && (
        <p className={impliedDiscount >= 1 ? "text-body-sm text-alert" : "text-body-sm text-ink-2"}>
          {impliedDiscount >= 1
            ? `Warning: this is a ${(impliedDiscount * 100).toFixed(0)}% effective discount on every LKR spent and redeemed straight back.`
            : `A customer redeeming every point they earn effectively gets ${(impliedDiscount * 100).toFixed(1)}% back.`}
        </p>
      )}

      {error && (
        <p role="alert" className="text-body-sm text-alert">
          {error}
        </p>
      )}
      {saved && <p className="text-body-sm text-pos">{t("Saved.")}</p>}

      <Button type="submit" disabled={submitting} className="self-start">
        {submitting ? "Saving…" : "Save rates"}
      </Button>
    </form>
  );
}
