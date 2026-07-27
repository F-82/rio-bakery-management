import { formatLKR } from "@/lib/format";
import { cn } from "@/lib/utils";

type MoneyTextProps = {
  amount: Parameters<typeof formatLKR>[0];
  size?: "num" | "num-lg";
  className?: string;
};

/** The only place a money value should be rendered outside of formatLKR itself. */
export function MoneyText({ amount, size = "num", className }: MoneyTextProps) {
  return (
    <span className={cn(size === "num-lg" ? "text-num-lg" : "text-num", "text-ink", className)}>
      {formatLKR(amount)}
    </span>
  );
}
