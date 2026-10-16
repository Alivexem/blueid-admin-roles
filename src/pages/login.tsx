"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "sonner";

import { PasswordInput, submitClass } from "@/components/dashboard/ui";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { isFilledText, requiredText } from "@/lib/validation";
import { Logo } from "@/components/layout/logo";
import { useSessionStore } from "@/store/useSessionStore";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-2 h-12 w-full rounded-[8px] border border-transparent bg-[#E8F2FC] px-4 text-sm text-navy outline-none focus:border-navy aria-invalid:border-[#8C2F2F]";

export default function LoginPage() {
  const router = useRouter();
  const signedIn = useSessionStore((state) => state.signedIn);
  const ready = useSessionStore((state) => state.ready);
  const hydrate = useSessionStore((state) => state.hydrate);
  const signIn = useSessionStore((state) => state.signIn);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (ready && signedIn) router.replace("/dashboard");
  }, [ready, signedIn, router]);

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <Head>
        <title>Officer sign-in · Blue ID</title>
      </Head>

      <section className="flex min-h-screen flex-col bg-white px-6 py-6 sm:px-10">
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">
            <div className="flex justify-center">
              <Logo href="/login" />
            </div>
            <h1 className="mt-8 text-center text-[1.65rem] font-medium tracking-[-0.02em] text-navy">
              Sign in to your desk
            </h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Enter the user ID and password issued for your office.
            </p>

            <form
              className="mt-8 space-y-5"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (!isFilledText(userId, 3) || password.length < 8) return;
                const ok = signIn(userId, password);
                if (!ok) {
                  const message = "That user ID or password is not recognised.";
                  setError(message);
                  toast.error(message);
                  return;
                }
                toast.success("Signed in.");
                router.push("/dashboard");
              }}
            >
              <label className="block text-sm text-navy">
                User ID
                <input
                  value={userId}
                  onChange={(event) => {
                    setUserId(event.target.value);
                    setError("");
                  }}
                  autoComplete="username"
                  aria-invalid={Boolean(
                    requiredText(userId, "Enter the user ID.", 3),
                  )}
                  className={inputClass}
                />
                {requiredText(userId, "Enter the user ID.", 3) ? (
                  <span className="mt-1.5 block text-xs text-[#8C2F2F]">
                    {requiredText(userId, "Enter the user ID.", 3)}
                  </span>
                ) : null}
              </label>

              <div>
                <p className="text-sm text-navy">Password</p>
                <PasswordInput
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  autoComplete="current-password"
                  aria-invalid={password.length > 0 && password.length < 8}
                  aria-label="Password"
                  className={cn(inputClass, "mt-2 pr-11")}
                />
                {password.length > 0 && password.length < 8 ? (
                  <p className="mt-1.5 text-xs text-[#8C2F2F]">
                    Enter at least 8 characters.
                  </p>
                ) : null}
              </div>

              {error ? <p className="text-sm text-[#8C2F2F]">{error}</p> : null}

              <button
                type="submit"
                disabled={!isFilledText(userId, 3) || password.length < 8}
                className={cn(submitClass, "h-12 w-full text-base")}
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </section>

      <aside className="relative hidden min-h-screen overflow-hidden bg-[#06357A] lg:block">
        <OptimizedImage
          src="/landing/hero.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-[30%_55%]"
        />
        <div className="absolute inset-0 bg-[#06357A]/72" />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-24 size-[28rem] rounded-full border border-white/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 -right-8 size-[18rem] rounded-full border border-white/15"
        />
        <div className="relative flex h-full items-center px-12 xl:px-16">
          <div className="max-w-md">
            <p className="text-[11px] tracking-[0.2em] text-white/80 uppercase">
              Department of Blue Economy
            </p>
            <h2 className="mt-4 font-serif text-5xl leading-[1.05] tracking-[-0.03em] text-white">
              One register for every fisherman in Cross River.
            </h2>
          </div>
        </div>
      </aside>
    </main>
  );
}
