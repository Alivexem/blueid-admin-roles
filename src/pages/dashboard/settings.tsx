"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Field,
  PageHeading,
  Panel,
  PasswordInput,
  submitClass,
} from "@/components/dashboard/ui";
import { roleMeta } from "@/lib/dashboard";
import { OFFICERS } from "@/lib/officers";
import { useRoleStore } from "@/store/useRoleStore";
import { useSessionStore } from "@/store/useSessionStore";

export default function SettingsPage() {
  const role = useRoleStore((state) => state.role);
  const userId = useSessionStore((state) => state.userId);
  const meta = roleMeta(role);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const passwordReady =
    current.length > 0 && next.length >= 8 && next === confirm;
  const nextError =
    next.length > 0 && next.length < 8 ? "Use at least 8 characters." : "";
  const confirmError =
    confirm.length > 0 && next !== confirm
      ? "The new passwords do not match."
      : "";

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Account"
        title="Settings"
        text="Your desk details and the password used to sign in."
      />
      <Panel title="Profile">
        <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
          {[
            ["Name", meta.officer],
            ["User ID", userId ?? "—"],
            ["Role", meta.label],
            ["Office", meta.office],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                {label}
              </dt>
              <dd className="mt-1 text-navy">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel title="Password">
        <form
          className="grid max-w-md gap-4 p-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!passwordReady) return;
            const officer = OFFICERS.find((item) => item.userId === userId);
            if (!officer || officer.password !== current) {
              const message = "The current password is not correct.";
              setMessage(message);
              toast.error(message);
              return;
            }
            officer.password = next;
            setCurrent("");
            setNext("");
            setConfirm("");
            setMessage("");
            toast.success("Password updated.");
          }}
        >
          <Field label="Current password">
            <PasswordInput
              value={current}
              onChange={(event) => {
                setCurrent(event.target.value);
                setMessage("");
              }}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New password" error={nextError}>
            <PasswordInput
              value={next}
              onChange={(event) => {
                setNext(event.target.value);
                setMessage("");
              }}
              autoComplete="new-password"
              aria-invalid={Boolean(nextError)}
            />
          </Field>
          <Field label="Confirm new password" error={confirmError}>
            <PasswordInput
              value={confirm}
              onChange={(event) => {
                setConfirm(event.target.value);
                setMessage("");
              }}
              autoComplete="new-password"
              aria-invalid={Boolean(confirmError)}
            />
          </Field>
          {message ? <p className="text-sm text-navy">{message}</p> : null}
          <button
            type="submit"
            disabled={!passwordReady}
            className={submitClass}
          >
            Update password
          </button>
        </form>
      </Panel>
      {role === "super" ? (
        <Panel title="Sessions">
          <ul>
            {[
              ["This browser", "Calabar", "Current"],
              ["Field office desktop", "Calabar", "13 Oct 2026"],
            ].map(([device, place, when]) => (
              <li
                key={device}
                className="flex items-center justify-between border-t border-line px-5 py-3 text-sm first:border-t-0"
              >
                <span className="text-navy">
                  {device}
                  <span className="text-muted-foreground"> · {place}</span>
                </span>
                <span className="text-muted-foreground">{when}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="m-5 h-10 border border-navy px-4 text-sm text-navy"
            onClick={() => toast.success("Other sessions signed out.")}
          >
            Sign out everywhere else
          </button>
        </Panel>
      ) : null}
    </div>
  );
}
