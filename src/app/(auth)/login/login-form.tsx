"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type SignInState } from "@/lib/actions/auth";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Eye, EyeOff, Check, ArrowRight, ChefHat } from "lucide-react";

const initialState: SignInState = { error: null };

// ---------------------------------------------------------------------------
// Inner card helper (mirrors lovable's Card primitive)
// ---------------------------------------------------------------------------
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[24px] bg-white ${className}`}>{children}</div>;
}

export function LoginForm() {
  const { t } = useTranslation();
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  const deactivated = searchParams.get("error") === "inactive";

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <div
      className="min-h-screen w-full"
      style={{ fontFamily: "var(--font-outfit, var(--font-sans))" }}
    >
      <div className="mx-auto flex min-h-screen max-w-[1200px] overflow-hidden bg-white lg:rounded-none">

        {/* ── Left panel — desktop only ─────────────────────────────────── */}
        <div
          className="relative hidden flex-col justify-between p-8 lg:flex lg:w-[45%]"
          style={{
            background:
              "linear-gradient(160deg, #fff5f5 0%, #fbbf24 30%, #faff7f 62%, #93c5fd 100%)",
          }}
        >
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full overflow-hidden bg-white/80 backdrop-blur">
              <Image
                src="/brand/logo.webp"
                alt="Rio Bakers Hut logo"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <span className="text-sm font-semibold tracking-tight">Rio Bakers Hut</span>
          </div>

          {/* Hero copy */}
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium backdrop-blur">
              <ChefHat className="h-3 w-3" /> Bakery &amp; Restaurant POS
            </div>
            <h2 className="max-w-sm text-4xl font-light leading-[1.1] tracking-tight">
              Everything you need to{" "}
              <span className="font-semibold">run your kitchen</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm text-neutral-700">
              Orders, inventory, finance and your full menu — all in one place.
              Built for the pace of a real bakery.
            </p>
          </div>

          {/* Testimonial / quote card */}
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black">
                <ChefHat className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-neutral-700">
                  Real-time orders, live inventory tracking, daily finance
                  summaries — all updating the moment something changes in
                  your kitchen.
                </p>
                <p className="mt-2 text-xs font-medium text-neutral-900">
                  Built for bakeries. Runs in the browser.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right panel — form ────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-10 bg-white">
          <div className="w-full max-w-[400px]">

            {/* Mobile-only brand mark */}
            <div className="mb-8 mt-4 flex lg:hidden">
              <div className="grid h-16 w-16 place-items-center">
                <Image
                  src="/brand/logo.webp"
                  alt="Rio Bakers Hut logo"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-3xl font-light tracking-tight md:text-4xl">Sign in</h1>
              <p className="mt-2 text-sm text-neutral-500">
                Enter your details to access the dashboard.
              </p>
            </div>

            {/* Error alerts */}
            {deactivated && (
              <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {t("Your account has been deactivated. Contact your manager.")}
              </p>
            )}
            {state.error && (
              <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </p>
            )}

            {/* Form */}
            <form action={formAction} className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-neutral-700">
                  {t("Email")}
                </label>
                <div className="flex items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3 transition focus-within:border-black focus-within:bg-white">
                  <Mail className="h-4 w-4 shrink-0 text-neutral-500" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="name@riobakershut.com"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-neutral-700">
                  {t("Password")}
                </label>
                <div className="flex items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3 transition focus-within:border-black focus-within:bg-white">
                  <Lock className="h-4 w-4 shrink-0 text-neutral-500" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="shrink-0 text-neutral-500 hover:text-neutral-800 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember + forgot */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setRemember((r) => !r)}
                  className="group flex items-center gap-2 text-sm text-neutral-600"
                >
                  <span
                    className={`grid h-4 w-4 place-items-center rounded border transition ${
                      remember
                        ? "border-black bg-black text-white"
                        : "border-neutral-300 bg-white group-hover:border-neutral-400"
                    }`}
                  >
                    {remember && <Check className="h-3 w-3" />}
                  </span>
                  Remember me
                </button>
                <button type="button" className="text-sm font-medium text-neutral-900 hover:underline">
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={pending}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Signing in…" : (
                  <>Sign in <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
