"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";

import {
  Field,
  PageHeading,
  Panel,
  PasswordInput,
  fieldClass,
  submitClass,
} from "@/components/dashboard/ui";
import { assignableRoles, roleMeta, type RoleId } from "@/lib/dashboard";
import {
  OFFICERS,
  saveAccountOverride,
  type AccountStatus,
} from "@/lib/officers";
import { stripSpace, tidyText } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";

const LGAS = [
  "Abi",
  "Akamkpa",
  "Akpabuyo",
  "Bakassi",
  "Bekwarra",
  "Biase",
  "Boki",
  "Calabar Municipal",
  "Calabar South",
  "Etung",
  "Ikom",
  "Obanliku",
  "Obubra",
  "Obudu",
  "Odukpani",
  "Ogoja",
  "Yakurr",
  "Yala",
];

const COOPERATIVES = [
  "Ikang Fishers Cooperative",
  "Esuk Mba Boat Owners",
  "Creek Town Fishers",
];

function temporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let body = "";
  for (let index = 0; index < 8; index += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${body}#1`;
}

export default function OperatorsPage() {
  const sessionId = useSessionStore((state) => state.userId);
  const roles = assignableRoles("super");
  const [tick, setTick] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<RoleId>(roles[0]?.id ?? "state");
  const [lga, setLga] = useState(LGAS[3]);
  const [cooperative, setCooperative] = useState(COOPERATIVES[0]);
  const [password, setPassword] = useState("");
  const [issued, setIssued] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const [editing, setEditing] = useState<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: RoleId;
    lga: string;
    cooperative: string;
  } | null>(null);
  const accounts = useMemo(() => OFFICERS.slice(), [tick]);
  const menuAccount = accounts.find((item) => item.userId === menuId) ?? null;

  useEffect(() => {
    if (!menuId && !editing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuId(null);
      setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuId, editing]);

  const emailTaken = OFFICERS.some(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
  );
  const idTaken = OFFICERS.some((item) => item.userId === userId);
  const canCreate =
    tidyText(firstName).length >= 2 &&
    tidyText(lastName).length >= 2 &&
    email.includes("@") &&
    !emailTaken &&
    userId.length >= 3 &&
    !idTaken &&
    (role !== "lga" || Boolean(lga)) &&
    (role !== "cooperative" || Boolean(cooperative)) &&
    (password.length === 0 || password.length >= 8);

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Accounts"
        title="Operators"
        text="Create and suspend the people who work the register. This desk cannot create another Super Administrator, and it cannot change its own role or status."
      />

      {issued ? (
        <Panel title="Temporary password">
          <div className="space-y-3 p-5 text-sm">
            <p className="text-navy">
              Show this password once, then pass it to the officer. It will not
              be shown again. They must replace it at the next sign-in.
            </p>
            <p className="font-serif text-2xl tracking-[-0.03em] text-navy">
              {issued}
            </p>
            <button
              type="button"
              className="h-10 border border-navy px-4 text-sm text-navy"
              onClick={() => setIssued("")}
            >
              I have passed it on
            </button>
          </div>
        </Panel>
      ) : null}

      <Panel title="New operator">
        <form
          className="grid gap-4 p-5 md:grid-cols-2"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!canCreate) return;
            const secret = password || temporaryPassword();
            OFFICERS.push({
              userId,
              password: secret,
              role,
              firstName: tidyText(firstName),
              lastName: tidyText(lastName),
              email: email.trim().toLowerCase(),
              status: "Active",
              mustChangePassword: true,
              lga: role === "lga" ? lga : undefined,
              cooperative: role === "cooperative" ? cooperative : undefined,
            });
            setTick((value) => value + 1);
            setFirstName("");
            setLastName("");
            setEmail("");
            setUserId("");
            setPassword("");
            setIssued(secret);
            toast.success("Operator account created.");
          }}
        >
          <Field label="First name">
            <input
              value={firstName}
              onChange={(event) => setFirstName(tidyText(event.target.value))}
              className={fieldClass}
            />
          </Field>
          <Field label="Last name">
            <input
              value={lastName}
              onChange={(event) => setLastName(tidyText(event.target.value))}
              className={fieldClass}
            />
          </Field>
          <Field
            label="Email"
            error={emailTaken ? "That email is already used." : ""}
          >
            <input
              value={email}
              onChange={(event) => setEmail(stripSpace(event.target.value))}
              autoComplete="off"
              className={fieldClass}
            />
          </Field>
          <Field
            label="User ID"
            error={idTaken ? "That user ID is already used." : ""}
          >
            <input
              value={userId}
              onChange={(event) =>
                setUserId(stripSpace(event.target.value).toLowerCase())
              }
              autoComplete="off"
              className={fieldClass}
            />
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as RoleId)}
              className={fieldClass}
            >
              {roles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          {role === "lga" ? (
            <Field label="Local government">
              <select
                value={lga}
                onChange={(event) => setLga(event.target.value)}
                className={fieldClass}
              >
                {LGAS.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </Field>
          ) : null}
          {role === "cooperative" ? (
            <Field label="Cooperative">
              <select
                value={cooperative}
                onChange={(event) => setCooperative(event.target.value)}
                className={fieldClass}
              >
                {COOPERATIVES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="Password">
            <PasswordInput
              value={password}
              onChange={(event) => setPassword(stripSpace(event.target.value))}
              autoComplete="new-password"
              placeholder="Leave blank to issue one"
            />
          </Field>
          <div className="md:col-span-2">
            <button type="submit" disabled={!canCreate} className={submitClass}>
              Create account
            </button>
          </div>
        </form>
      </Panel>

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-stone text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Officer</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const self = account.userId === sessionId;
                return (
                  <tr key={account.userId} className="border-t border-line">
                    <td className="px-4 py-3">
                      <p className="text-navy">
                        {account.firstName} {account.lastName}
                        {self ? " · you" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {account.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-navy">
                      {roleMeta(account.role).label}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {account.lga ?? account.cooperative ?? "Statewide"}
                    </td>
                    <td className="px-4 py-3 text-navy">{account.status}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-[8px] text-navy hover:bg-stone"
                        aria-label={`Actions for ${account.firstName} ${account.lastName}`}
                        aria-expanded={menuId === account.userId}
                        onClick={(event) => {
                          if (menuId === account.userId) {
                            setMenuId(null);
                            return;
                          }
                          const rect =
                            event.currentTarget.getBoundingClientRect();
                          setMenuPos({
                            top: rect.bottom + 6,
                            right: window.innerWidth - rect.right,
                          });
                          setMenuId(account.userId);
                        }}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {menuAccount && menuPos ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close actions"
            onClick={() => setMenuId(null)}
          />
          <div
            role="menu"
            className="fixed z-50 w-40 overflow-hidden rounded-[8px] border border-line bg-white shadow-[0_8px_24px_rgba(10,76,154,0.08)]"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-navy hover:bg-stone"
              onClick={() => {
                setEditing({
                  userId: menuAccount.userId,
                  firstName: menuAccount.firstName,
                  lastName: menuAccount.lastName,
                  email: menuAccount.email,
                  role: menuAccount.role,
                  lga: menuAccount.lga ?? LGAS[3],
                  cooperative: menuAccount.cooperative ?? COOPERATIVES[0],
                });
                setMenuId(null);
              }}
            >
              Edit
            </button>
            {menuAccount.userId === sessionId ||
            menuAccount.role === "super" ? null : (
              <button
                type="button"
                role="menuitem"
                className="block w-full px-4 py-2.5 text-left text-sm text-navy hover:bg-stone"
                onClick={() => {
                  const next: AccountStatus =
                    menuAccount.status === "Active" ? "Suspended" : "Active";
                  menuAccount.status = next;
                  saveAccountOverride(menuAccount.userId, { status: next });
                  setTick((value) => value + 1);
                  setMenuId(null);
                  toast.success(
                    next === "Active"
                      ? "Account activated."
                      : "Account suspended.",
                  );
                }}
              >
                {menuAccount.status === "Active" ? "Suspend" : "Activate"}
              </button>
            )}
          </div>
        </>
      ) : null}

      {editing ? (
        <EditOperatorModal
          draft={editing}
          self={editing.userId === sessionId}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={() => {
            const account = OFFICERS.find(
              (item) => item.userId === editing.userId,
            );
            if (!account) return;
            const emailTakenByOther = OFFICERS.some(
              (item) =>
                item.userId !== account.userId &&
                item.email.toLowerCase() === editing.email.trim().toLowerCase(),
            );
            if (
              tidyText(editing.firstName).length < 2 ||
              tidyText(editing.lastName).length < 2 ||
              !editing.email.includes("@") ||
              emailTakenByOther
            ) {
              toast.error("Check the name and email before saving.");
              return;
            }
            account.firstName = tidyText(editing.firstName);
            account.lastName = tidyText(editing.lastName);
            account.email = editing.email.trim().toLowerCase();
            if (account.userId !== sessionId && account.role !== "super") {
              account.role = editing.role;
              account.lga = editing.role === "lga" ? editing.lga : undefined;
              account.cooperative =
                editing.role === "cooperative"
                  ? editing.cooperative
                  : undefined;
            }
            saveAccountOverride(account.userId, {
              firstName: account.firstName,
              lastName: account.lastName,
              email: account.email,
              role: account.role,
              lga: account.lga,
              cooperative: account.cooperative,
            });
            setTick((value) => value + 1);
            setEditing(null);
            toast.success("Account updated.");
          }}
        />
      ) : null}
    </div>
  );
}

type EditDraft = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: RoleId;
  lga: string;
  cooperative: string;
};

function EditOperatorModal({
  draft,
  self,
  onChange,
  onClose,
  onSave,
}: {
  draft: EditDraft;
  self: boolean;
  onChange: (draft: EditDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const lockedRole = self;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close edit"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-operator-title"
        className="relative z-10 w-full max-w-lg rounded-[8px] border border-line bg-white"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2
            id="edit-operator-title"
            className="text-base font-medium text-navy"
          >
            Edit account
          </h2>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-[8px] text-navy hover:bg-stone"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        <form
          className="grid gap-4 p-5 sm:grid-cols-2"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <Field label="First name">
            <input
              value={draft.firstName}
              onChange={(event) =>
                onChange({ ...draft, firstName: tidyText(event.target.value) })
              }
              className={fieldClass}
            />
          </Field>
          <Field label="Last name">
            <input
              value={draft.lastName}
              onChange={(event) =>
                onChange({ ...draft, lastName: tidyText(event.target.value) })
              }
              className={fieldClass}
            />
          </Field>
          <Field label="Email">
            <input
              value={draft.email}
              onChange={(event) =>
                onChange({ ...draft, email: stripSpace(event.target.value) })
              }
              className={fieldClass}
            />
          </Field>
          <Field label="User ID">
            <input value={draft.userId} readOnly className={cnField} />
          </Field>
          <Field label="Role">
            {lockedRole ? (
              <>
                <input
                  value={roleMeta(draft.role).label}
                  readOnly
                  className={cnField}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Your own role stays as it is.
                </p>
              </>
            ) : (
              <select
                value={draft.role}
                onChange={(event) =>
                  onChange({ ...draft, role: event.target.value as RoleId })
                }
                className={fieldClass}
              >
                {assignableRoles("super").map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {draft.role === "lga" && !lockedRole ? (
            <Field label="Local government">
              <select
                value={draft.lga}
                onChange={(event) =>
                  onChange({ ...draft, lga: event.target.value })
                }
                className={fieldClass}
              >
                {LGAS.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </Field>
          ) : null}
          {draft.role === "cooperative" && !lockedRole ? (
            <Field label="Cooperative">
              <select
                value={draft.cooperative}
                onChange={(event) =>
                  onChange({ ...draft, cooperative: event.target.value })
                }
                className={fieldClass}
              >
                {COOPERATIVES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </Field>
          ) : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button
              type="button"
              className="h-11 border border-navy px-4 text-sm text-navy"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className={submitClass}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const cnField = `${fieldClass} bg-stone text-muted-foreground`;
