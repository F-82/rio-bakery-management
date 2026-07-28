"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { getPageTitle } from "@/lib/nav";
import { CounterBadge } from "@/components/patterns/CounterBadge";
import { signOut } from "@/lib/actions/auth";
import type { Database } from "@/types/database";

type HeaderProps = {
  name: string | null;
  role: Database["public"]["Enums"]["user_role"];
  counter: { name: string; kind: Database["public"]["Enums"]["counter_kind"] } | null;
  /** Unread notification count. No notifications feature exists yet, so this stays unset. */
  unreadCount?: number;
};

export function Header({ name, role, counter, unreadCount }: HeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="app-header sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-surface px-4 print:hidden">
      <div className="flex items-center gap-3">
        <Image src="/brand/logo.webp" alt="Rio Bakers Hut Logo" width={32} height={32} className="rounded-full" />
        <h1 className="text-h1 text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {counter && <CounterBadge kind={counter.kind} />}

        <button
          type="button"
          className="relative flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-muted"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell className="size-5" aria-hidden />
          {!!unreadCount && (
            <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-alert text-[10px] text-alert-ink">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 hover:bg-muted"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-ink text-body-sm text-on-black">
            {(name ?? "?").charAt(0).toUpperCase()}
          </span>
          <span className="hidden text-label text-ink-2 capitalize sm:inline">{role}</span>
        </button>
      </div>
    </header>
  );
}
