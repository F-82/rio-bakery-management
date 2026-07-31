import { ChefHat, Croissant, CupSoda } from "lucide-react";
import { cn } from "@/lib/utils";
import { MENU_MAIN_CATEGORY_LABELS, type MenuMainCategory } from "@/lib/menu-classification";

type MainCategoryIconProps = {
  category: MenuMainCategory;
  className?: string;
  showLabel?: boolean;
};

const ICONS = {
  hot_plate: ChefHat,
  bakery: Croissant,
  drinks: CupSoda,
} satisfies Record<MenuMainCategory, typeof ChefHat>;

export function MainCategoryIcon({
  category,
  className,
  showLabel = false,
}: MainCategoryIconProps) {
  const Icon = ICONS[category];
  const label = MENU_MAIN_CATEGORY_LABELS[category];

  return (
    <span
      className={cn("text-ink-2 inline-flex shrink-0 items-center gap-1.5", className)}
      title={label}
      aria-label={showLabel ? undefined : label}
    >
      <Icon className="size-4" aria-hidden />
      {showLabel && <span>{label}</span>}
    </span>
  );
}
