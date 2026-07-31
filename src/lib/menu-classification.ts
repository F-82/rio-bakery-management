export const MENU_MAIN_CATEGORIES = ["hot_plate", "bakery", "drinks"] as const;
export type MenuMainCategory = (typeof MENU_MAIN_CATEGORIES)[number];

export const MENU_SCHEDULES = ["all_days", "monday_saturday", "sunday"] as const;
export type MenuSchedule = (typeof MENU_SCHEDULES)[number];

export const MENU_MAIN_CATEGORY_LABELS: Record<MenuMainCategory, string> = {
  hot_plate: "Hot plate",
  bakery: "Bakery",
  drinks: "Drinks",
};

export const MENU_SCHEDULE_LABELS: Record<MenuSchedule, string> = {
  all_days: "Every day",
  monday_saturday: "Monday to Saturday",
  sunday: "Sunday only",
};

export function currentMenuSchedule(date = new Date()): "monday_saturday" | "sunday" {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    weekday: "short",
  }).format(date);

  return weekday === "Sun" ? "sunday" : "monday_saturday";
}
