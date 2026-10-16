"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "sonner";

import { PasswordInput, submitClass } from "@/components/dashboard/ui";
import { Logo } from "@/components/layout/logo";
import { findOfficerById, saveAccountOverride } from "@/lib/officers";
import { stripSpace } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-2 h-12 w-full rounded-[8px] border border-transparent bg-[#E8F2FC] px-4 text-base text-navy outline-none focus:border-navy";

export default function ChangePasswordPage() {
  const router = useRouter();
  const ready = useSessionStore((state) => state.ready);
  const signedIn = useSessionStore((state) => state.signedIn);
  const mustChangePassword = useSessionStore(
    (state) => state.mustChangePassword,
  );
  const userId = useSessionStore((state) => state.userId);
  const hydrate = useSessionStore((state) => state.hydrate);
  const signOut = useSessionStore((state) => state.signOut);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) router.replace("/login");
    else if (!mustChangePassword) router.replace("/dashboard");
  }, [ready, signedIn, mustChangePassword, router]);

  const readyToSave =
    current.length > 0 &&
    next.length >= 8 &&
    next === confirm &&
    next !== current;

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
      <Head>
        <title>Choose a password · Blue ID</title>
      </Head>
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center">
          <Logo href="/change-password" />
        </div>
        <h1 className="mt-8 text-center text-[1.65rem] font-medium tracking-[-0.02em] text-navy">
          Choose your own password
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          This account is still using the password it was issued. The desk stays
          closed until that password is replaced. Signing in again will be
          required.
        </p>
        <form
          className="mt-8 space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!readyToSave || !userId) return;
            const officer = findOfficerById(userId);
            if (!officer || officer.password !== current) {
              const message = "The issued password is not correct.";
              setError(message);
              toast.error(message);
              return;
            }
            officer.password = next;
            officer.mustChangePassword = false;
            saveAccountOverride(userId, {
              password: next,
              mustChangePassword: false,
            });
            signOut();
            toast.success("Password saved. Sign in with the new one.");
            router.push("/login");
          }}
        >
          <label className="block text-sm text-navy">
            Issued password
            <PasswordInput
              value={current}
              onChange={(event) => {
                setCurrent(stripSpace(event.target.value));
                setError("");
              }}
              autoComplete="current-password"
              className={cn(inputClass, "pr-11")}
            />
          </label>
          <label className="block text-sm text-navy">
            New password
            <PasswordInput
              value={next}
              onChange={(event) => {
                setNext(stripSpace(event.target.value));
                setError("");
              }}
              autoComplete="new-password"
              className={cn(inputClass, "pr-11")}
            />
          </label>
          <label className="block text-sm text-navy">
            Confirm new password
            <PasswordInput
              value={confirm}
              onChange={(event) => {
                setConfirm(stripSpace(event.target.value));
                setError("");
              }}
              autoComplete="new-password"
              className={cn(inputClass, "pr-11")}
            />
          </label>
          {next.length > 0 && next.length < 8 ? (
            <p className="text-sm text-[#8C2F2F]">Use at least 8 characters.</p>
          ) : null}
          {confirm.length > 0 && next !== confirm ? (
            <p className="text-sm text-[#8C2F2F]">
              The new passwords do not match.
            </p>
          ) : null}
          {next.length >= 8 && next === current ? (
            <p className="text-sm text-[#8C2F2F]">
              Choose a password different from the one you were issued.
            </p>
          ) : null}
          {error ? <p className="text-sm text-[#8C2F2F]">{error}</p> : null}
          <button
            type="submit"
            disabled={!readyToSave}
            className={cn(submitClass, "h-12 w-full text-base")}
          >
            Save password and sign out
          </button>
        </form>
      </div>
    </main>
  );
}
