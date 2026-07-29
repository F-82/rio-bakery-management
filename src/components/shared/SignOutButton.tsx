"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
};

/**
 * Drop-in replacement for the bare `onClick={() => signOut()}` icon button
 * duplicated across every rowner shell (AppShell, DashboardShell, MenuShell,
 * OrdersShell, InventoryShell, FinanceShell, CustomersShell) — a stray tap
 * used to sign out immediately with no way back, losing whatever the screen
 * had in progress (an open drawer, an unsaved form).
 */
export function SignOutButton({ className }: SignOutButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-neutral-300 transition-colors",
            className,
          )}
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5 text-neutral-600" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-white p-5 shadow-elevation data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <DialogPrimitive.Title className="text-lg font-medium text-neutral-900">
            {t("Sign out?")}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1.5 text-sm text-neutral-500">
            {t("You'll need to sign back in to keep working.")}</DialogPrimitive.Description>
          <div className="mt-5 flex gap-2">
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                {t("Cancel")}</button>
            </DialogPrimitive.Close>
            <button
              type="button"
              disabled={signingOut}
              onClick={() => {
                setSigningOut(true);
                signOut();
              }}
              className="flex-1 rounded-full bg-black px-4 py-2.5 text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {signingOut ? t("Signing out…") : t("Sign out")}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
