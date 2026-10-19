"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { toast } from "sonner";

import {
  EmptyState,
  Field,
  Modal,
  PageHeading,
  Panel,
  TableSkeleton,
  fieldClass,
  submitClass,
} from "@/components/dashboard/ui";
import {
  ROLE_RANK,
  assignableRoles,
  roleMeta,
  type RoleId,
} from "@/lib/dashboard";
import {
  LGAS,
  activateUser,
  createUser,
  describeError,
  lgaName,
  listCooperatives,
  listUsers,
  resetUserPassword,
  setUserStatus,
  toApiRole,
  toRoleId,
  updateUser,
  type AccountStatus,
  type CooperativeRow,
  type Operator,
} from "@/lib/api";
import { stripSpace, tidyText } from "@/lib/validation";
import { useSessionStore } from "@/store/useSessionStore";

const USER_ID = /^[a-z0-9._-]{3,40}$/;

function scopeLabel(account: Operator, cooperatives: CooperativeRow[]) {
  const lgas = account.scope?.lgas?.map(lgaName).filter(Boolean) ?? [];
  if (lgas.length) return lgas.join(", ");
  const cooperative = cooperatives.find(
    (item) => item.id === account.cooperative,
  );
  if (cooperative) return cooperative.name;
  if (account.role === "COOPERATIVE_OFFICER") return "Cooperative";
  return "Statewide";
}

function statusLabel(status: AccountStatus) {
  if (status === "ACTIVE") return "Active";
  if (status === "SUSPENDED") return "Suspended";
  if (status === "PENDING") return "Pending";
  return "Disabled";
}

export default function OperatorsPage() {
  const profile = useSessionStore((state) => state.profile);
  const roles = assignableRoles(profile?.roleId ?? "super");
  const [accounts, setAccounts] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [cooperatives, setCooperatives] = useState<CooperativeRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<RoleId>(roles[0]?.id ?? "state");
  const [lga, setLga] = useState(LGAS[3].code);
  const [cooperative, setCooperative] = useState("");
  const [issued, setIssued] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Operator | null>(null);
  const [statusFor, setStatusFor] = useState<Operator | null>(null);
  const [reason, setReason] = useState("");

  async function reload() {
    const { data } = await listUsers();
    setAccounts(data);
  }

  useEffect(() => {
    let live = true;
    void Promise.all([listUsers(), listCooperatives()])
      .then(([users, societies]) => {
        if (!live) return;
        setAccounts(users.data);
        setCooperatives(societies);
        setCooperative(societies[0]?.id ?? "");
      })
      .catch((error) => {
        if (live) setLoadError(describeError(error));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!menuId && !editing && !statusFor) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuId(null);
      setEditing(null);
      setStatusFor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuId, editing, statusFor]);

  const myRank = ROLE_RANK[profile?.roleId ?? "enumerator"];
  const mine = [profile?.id, profile?.staffId, profile?.email]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
  const listed = accounts.filter((account) => {
    if (ROLE_RANK[toRoleId(account.role)] >= myRank) return false;
    const keys = [account.id, account.staffId, account.email]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());
    return !keys.some((key) => mine.includes(key));
  });
  const menuAccount = listed.find((item) => item.id === menuId) ?? null;
  const canCreate =
    tidyText(firstName).length >= 2 &&
    tidyText(lastName).length >= 2 &&
    email.includes("@") &&
    USER_ID.test(userId) &&
    (role !== "lga" || Boolean(lga)) &&
    (role !== "cooperative" || Boolean(cooperative)) &&
    !busy;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Accounts"
          title="Operators"
          text="Create and suspend the people who work the register. This desk cannot create another Super Administrator, and it cannot change its own role or status."
        />
        <button
          type="button"
          className={submitClass}
          onClick={() => {
            setFormError("");
            setCreating(true);
          }}
        >
          New operator
        </button>
      </div>

      {issued ? (
        <Panel title="Temporary password">
          <div className="space-y-3 p-5 text-sm">
            <p className="text-navy">
              Show this password once, then pass it to the officer. It will not
              be shown again, and it is not emailed. They must replace it at the
              next sign-in.
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

      {creating ? (
        <Modal title="New operator" onClose={() => setCreating(false)}>
          <form
            className="grid gap-4 p-5 md:grid-cols-2"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (!canCreate || busy) return;
              const payload = {
                email: email.trim().toLowerCase(),
                firstName: tidyText(firstName),
                lastName: tidyText(lastName),
                role: toApiRole(role),
                staffId: userId,
                scope:
                  role === "lga" || role === "enumerator"
                    ? { lgas: [lga] }
                    : undefined,
                cooperative: role === "cooperative" ? cooperative : undefined,
              };
              setFormError("");
              setBusy(true);
              void (async () => {
                try {
                  const created = await createUser(payload);
                  setFirstName("");
                  setLastName("");
                  setEmail("");
                  setUserId("");
                  setIssued(created.temporaryPassword ?? "");
                  setCreating(false);
                  await reload();
                  toast.success("Operator account created.");
                } catch (error) {
                  const message = describeError(error);
                  setFormError(message);
                  toast.error(message);
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            {formError ? (
              <p
                role="alert"
                className="rounded-[8px] border border-[#E7C7C7] bg-[#FDF6F6] px-3 py-2 text-sm text-[#8C2F2F] md:col-span-2"
              >
                {formError}
              </p>
            ) : null}
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
            <Field label="Email">
              <input
                value={email}
                onChange={(event) => setEmail(stripSpace(event.target.value))}
                autoComplete="off"
                className={fieldClass}
              />
            </Field>
            <Field label="User ID">
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
            {role === "lga" || role === "enumerator" ? (
              <Field label="Local government">
                <select
                  value={lga}
                  onChange={(event) => setLga(event.target.value)}
                  className={fieldClass}
                >
                  {LGAS.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
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
                  {cooperatives.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={!canCreate}
                className={submitClass}
              >
                Create account
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      <Panel>
        {loadError ? (
          <p className="px-5 py-4 text-sm text-[#8C2F2F]">{loadError}</p>
        ) : null}
        {loading ? <TableSkeleton rows={6} columns={5} /> : null}
        <div className={loading ? "hidden" : "overflow-x-auto"}>
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
              {!loading && listed.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title={
                        accounts.length
                          ? "No accounts below your rank"
                          : "No operators yet"
                      }
                      text={
                        accounts.length
                          ? "Your own account and accounts at the same rank are left off this list."
                          : "Accounts created for this desk will appear here."
                      }
                    />
                  </td>
                </tr>
              ) : null}
              {listed.map((account) => {
                const self = account.id === profile?.id;
                return (
                  <tr key={account.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <p className="text-navy">
                        {account.fullName ||
                          `${account.firstName} ${account.lastName}`}
                        {self ? " · you" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {account.email}
                        {account.staffId ? ` · ${account.staffId}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-navy">
                      {roleMeta(toRoleId(account.role)).label}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {scopeLabel(account, cooperatives)}
                    </td>
                    <td className="px-4 py-3 text-navy">
                      {statusLabel(account.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-[8px] text-navy hover:bg-stone"
                        aria-label={`Actions for ${account.fullName}`}
                        aria-expanded={menuId === account.id}
                        onClick={(event) => {
                          if (menuId === account.id) {
                            setMenuId(null);
                            return;
                          }
                          const rect =
                            event.currentTarget.getBoundingClientRect();
                          setMenuPos({
                            top: rect.bottom + 6,
                            right: window.innerWidth - rect.right,
                          });
                          setMenuId(account.id);
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
                setEditing(menuAccount);
                setMenuId(null);
              }}
            >
              Edit
            </button>
            {menuAccount.id === profile?.id ? null : (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-4 py-2.5 text-left text-sm text-navy hover:bg-stone"
                  onClick={() => {
                    if (menuAccount.status === "PENDING") {
                      const account = menuAccount;
                      setMenuId(null);
                      void activateUser(account.id)
                        .then(async () => {
                          await reload();
                          toast.success("Account approved.");
                        })
                        .catch((error) => toast.error(describeError(error)));
                      return;
                    }
                    setStatusFor(menuAccount);
                    setReason("");
                    setMenuId(null);
                  }}
                >
                  {menuAccount.status === "ACTIVE" ? "Suspend" : "Activate"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-4 py-2.5 text-left text-sm text-navy hover:bg-stone"
                  onClick={() => {
                    const account = menuAccount;
                    setMenuId(null);
                    void resetUserPassword(account.id)
                      .then((result) => {
                        setIssued(result.temporaryPassword ?? "");
                        toast.success("Temporary password issued.");
                      })
                      .catch((error) => toast.error(describeError(error)));
                  }}
                >
                  Reset password
                </button>
              </>
            )}
          </div>
        </>
      ) : null}

      {editing ? (
        <EditOperatorModal
          account={editing}
          self={editing.id === profile?.id}
          cooperatives={cooperatives}
          actorRole={profile?.roleId ?? "super"}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      ) : null}

      {statusFor ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-[8px] border border-line bg-white p-5"
          >
            <h2 className="text-base font-medium text-navy">
              {statusFor.status === "ACTIVE"
                ? "Suspend account"
                : "Activate account"}
            </h2>
            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (tidyText(reason).length < 3) return;
                const next: AccountStatus =
                  statusFor.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
                void setUserStatus(statusFor.id, next, tidyText(reason))
                  .then(async () => {
                    setStatusFor(null);
                    await reload();
                    toast.success(
                      next === "ACTIVE"
                        ? "Account activated."
                        : "Account suspended.",
                    );
                  })
                  .catch((error) => toast.error(describeError(error)));
              }}
            >
              <Field label="Reason">
                <input
                  value={reason}
                  onChange={(event) => setReason(tidyText(event.target.value))}
                  className={fieldClass}
                />
              </Field>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="h-11 border border-navy px-4 text-sm text-navy"
                  onClick={() => setStatusFor(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tidyText(reason).length < 3}
                  className={submitClass}
                >
                  {statusFor.status === "ACTIVE" ? "Suspend" : "Activate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EditOperatorModal({
  account,
  self,
  cooperatives,
  actorRole,
  onClose,
  onSaved,
}: {
  account: Operator;
  self: boolean;
  cooperatives: CooperativeRow[];
  actorRole: RoleId;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(account.firstName);
  const [lastName, setLastName] = useState(account.lastName);
  const [role, setRole] = useState<RoleId>(toRoleId(account.role));
  const [lga, setLga] = useState(account.scope?.lgas?.[0] ?? LGAS[3].code);
  const [cooperative, setCooperative] = useState(
    account.cooperative ?? cooperatives[0]?.id ?? "",
  );
  const [busy, setBusy] = useState(false);
  const lockedRole = self || account.role === "SUPER_ADMIN";

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
            if (busy) return;
            setBusy(true);
            void updateUser(account.id, {
              firstName: tidyText(firstName),
              lastName: tidyText(lastName),
              ...(lockedRole
                ? {}
                : {
                    role: toApiRole(role),
                    scope:
                      role === "lga" || role === "enumerator"
                        ? { lgas: [lga] }
                        : { lgas: [] },
                    cooperative:
                      role === "cooperative" ? cooperative : undefined,
                  }),
            })
              .then(() => onSaved())
              .then(() => toast.success("Account updated."))
              .catch((error) => toast.error(describeError(error)))
              .finally(() => setBusy(false));
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
          <Field label="Email">
            <input
              value={account.email}
              readOnly
              className={`${fieldClass} bg-stone text-muted-foreground`}
            />
          </Field>
          <Field label="User ID">
            <input
              value={account.staffId || "—"}
              readOnly
              className={`${fieldClass} bg-stone text-muted-foreground`}
            />
          </Field>
          <Field label="Role">
            {lockedRole ? (
              <>
                <input
                  value={roleMeta(toRoleId(account.role)).label}
                  readOnly
                  className={`${fieldClass} bg-stone text-muted-foreground`}
                />
                {self ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your own role stays as it is.
                  </p>
                ) : null}
              </>
            ) : (
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as RoleId)}
                className={fieldClass}
              >
                {assignableRoles(actorRole).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {!lockedRole && (role === "lga" || role === "enumerator") ? (
            <Field label="Local government">
              <select
                value={lga}
                onChange={(event) => setLga(event.target.value)}
                className={fieldClass}
              >
                {LGAS.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {!lockedRole && role === "cooperative" ? (
            <Field label="Cooperative">
              <select
                value={cooperative}
                onChange={(event) => setCooperative(event.target.value)}
                className={fieldClass}
              >
                {cooperatives.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
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
            <button type="submit" disabled={busy} className={submitClass}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
