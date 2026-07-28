"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type SignInState } from "@/lib/actions/auth";

const initialState: SignInState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  const deactivated = searchParams.get("error") === "inactive";

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold">Rio Bakers Hut</h1>

      {/* text-alert-strong, not text-alert, on both messages below — this page has no
          surface of its own, so the text sits on plain --bg where red-600 is ~4.3:1,
          under the 4.5:1 floor */}
      {deactivated && (
        <p role="alert" className="text-sm text-alert-strong">
          Your account has been deactivated. Contact your manager.
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-alert-strong">
          {state.error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="rounded border px-3 py-2"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-on-black disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
