"use client";

import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "sonner";

import { PasswordInput, submitClass } from "@/components/dashboard/ui";
import { Logo } from "@/components/layout/logo";
import { describeError, detailMessages, resetPassword } from "@/lib/api";
import { stripSpace } from "@/lib/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const token =
    typeof router.query.token === "string" ? router.query.token : "";
  const [password, setPassword] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <Head>
        <title>Reset password · Blue ID</title>
      </Head>
      <div className="w-full max-w-md">
        <Logo href="/login" />
        <h1 className="mt-8 font-serif text-4xl text-navy">
          Choose a new password
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Use the token from the reset link. This deployment is not sending
          those emails yet.
        </p>
        <form
          className="mt-8 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!token || password.length < 12 || busy) return;
            setBusy(true);
            void resetPassword(token, password)
              .then(() => {
                toast.success("Password saved. Sign in with it.");
                router.push("/login");
              })
              .catch((reason) => {
                setReasons(detailMessages(reason));
                toast.error(describeError(reason));
              })
              .finally(() => setBusy(false));
          }}
        >
          <PasswordInput
            value={password}
            onChange={(event) => setPassword(stripSpace(event.target.value))}
            aria-label="New password"
            autoComplete="new-password"
          />
          {reasons.map((reason) => (
            <p key={reason} className="text-sm text-[#8C2F2F]">
              {reason}
            </p>
          ))}
          <button
            type="submit"
            disabled={!token || password.length < 12 || busy}
            className={submitClass}
          >
            Save password
          </button>
        </form>
      </div>
    </main>
  );
}
