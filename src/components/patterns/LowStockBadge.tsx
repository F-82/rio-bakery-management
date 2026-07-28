"use client";

import { Decimal } from "decimal.js";
import { Badge } from "@/components/ui/badge";
import { formatQty } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type LowStockBadgeProps = {
  qty: Decimal | number | string;
  threshold: Decimal | number | string;
  unit?: string;
  className?: string;
};

/**
 * --warn below the threshold. Negative stock shows the negative number in
 * --alert, not zero. Renders nothing when stock isn't low.
 */
export function LowStockBadge({ qty, threshold, unit, className }: LowStockBadgeProps) {
    const { t } = useTranslation();
  const qtyValue = qty instanceof Decimal ? qty : new Decimal(qty);
  const thresholdValue = threshold instanceof Decimal ? threshold : new Decimal(threshold);

  if (qtyValue.isNegative()) {
    return (
      <Badge variant="destructive" className={cn(className)}>
        {formatQty(qtyValue, unit)}
      </Badge>
    );
  }

  if (qtyValue.lessThanOrEqualTo(thresholdValue)) {
    return (
      <Badge variant="warn" className={cn(className)}>
        {t("Low stock")}</Badge>
    );
  }

  return null;
}
