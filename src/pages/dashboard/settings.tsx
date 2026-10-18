"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";

import {
  EmptyState,
  Field,
  Modal,
  PageHeading,
  Panel,
  PasswordInput,
  TableSkeleton,
  submitClass,
} from "@/components/dashboard/ui";
import {
  changePassword,
  describeError,
  detailMessages,
  listSessions,
  logoutAll,
  type SessionRow,
} from "@/lib/api";
import { roleMeta } from "@/lib/dashboard";
import { stripSpace } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";

function when(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SettingsPage() {
  const router = useRouter();
  const profile = useSessionStore((state) => state.profile);
  const userId = useSessionStore((state) => state.userId);
  const meta = roleMeta(profile?.roleId ?? "state");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const passwordReady =
    current.length > 0 && next.length >= 12 && next === confirm && !busy;
  const nextError =
    next.length > 0 && next.length < 12 ? "Use at least 12 characters." : "";
  const confirmError =
    confirm.length > 0 && next !== confirm
      ? "The new passwords do not match."
      : "";

  useEffect(() => {
    let live = true;
    void listSessions()
      .then((rows) => {
        if (live) setSessions(rows);
      })
      .catch(() => {
        if (live) setSessions([]);
      })
      .finally(() => {
        if (live) setSessionsLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

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
            ["Name", profile?.fullName || "—"],
            ["User ID", profile?.staffId || userId || "—"],
            ["Email", profile?.email || "—"],
            ["Role", meta.label],
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
      <div>
        <button
          type="button"
          className={submitClass}
          onClick={() => setPasswordOpen(true)}
        >
          Change password
        </button>
      </div>
      {passwordOpen ? (
        <Modal title="Change password" onClose={() => setPasswordOpen(false)}>
          <form
            className="grid max-w-md gap-4 p-5"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (!passwordReady) return;
              setBusy(true);
              void changePassword(current, next)
                .then(() => {
                  useSessionStore.setState({
                    signedIn: false,
                    userId: null,
                    profile: null,
                    mustChangePassword: false,
                  });
                  toast.success("Password saved. Sign in with the new one.");
                  router.push("/login");
                })
                .catch((reason) => {
                  setReasons(detailMessages(reason));
                  toast.error(describeError(reason));
                })
                .finally(() => setBusy(false));
            }}
          >
            <Field label="Current password">
              <PasswordInput
                value={current}
                onChange={(event) => {
                  setCurrent(stripSpace(event.target.value));
                  setReasons([]);
                }}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password" error={nextError}>
              <PasswordInput
                value={next}
                onChange={(event) => {
                  setNext(stripSpace(event.target.value));
                  setReasons([]);
                }}
                autoComplete="new-password"
                aria-invalid={Boolean(nextError)}
              />
            </Field>
            <Field label="Confirm new password" error={confirmError}>
              <PasswordInput
                value={confirm}
                onChange={(event) => {
                  setConfirm(stripSpace(event.target.value));
                  setReasons([]);
                }}
                autoComplete="new-password"
                aria-invalid={Boolean(confirmError)}
              />
            </Field>
            {reasons.length ? (
              <ul className="space-y-1 text-sm text-[#8C2F2F]">
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Saving a password signs this account out everywhere, including
              this browser.
            </p>
            <button
              type="submit"
              disabled={!passwordReady}
              className={submitClass}
            >
              Update password
            </button>
          </form>
        </Modal>
      ) : null}
      <Panel title="Sessions">
        {sessionsLoading ? <TableSkeleton rows={3} columns={2} /> : null}
        <ul className={sessionsLoading ? "hidden" : undefined}>
          {sessions.length === 0 ? (
            <li>
              <EmptyState
                title="No sessions listed"
                text="Active sign-ins for this account will appear here."
              />
            </li>
          ) : (
            sessions.map((session, index) => (
              <li
                key={`${session.createdAt}-${index}`}
                className="flex items-center justify-between gap-4 border-t border-line px-5 py-3 text-sm first:border-t-0"
              >
                <span className="text-navy">
                  {session.deviceCode || session.userAgent || "Browser"}
                  <span className="text-muted-foreground">
                    {" "}
                    · {session.ipAddress || "Unknown address"}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {when(session.lastUsedAt || session.createdAt)}
                </span>
              </li>
            ))
          )}
        </ul>
        <button
          type="button"
          className="m-5 h-10 border border-navy px-4 text-sm text-navy"
          onClick={() => {
            void logoutAll()
              .then(() => {
                useSessionStore.setState({
                  signedIn: false,
                  userId: null,
                  profile: null,
                  mustChangePassword: false,
                });
                toast.success("Signed out everywhere.");
                router.push("/login");
              })
              .catch((reason) => toast.error(describeError(reason)));
          }}
        >
          Sign out everywhere
        </button>
      </Panel>
    </div>
  );
}
