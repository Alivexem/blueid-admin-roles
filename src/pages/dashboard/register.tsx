"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Field,
  PageHeading,
  Panel,
  fieldClass,
  submitClass,
} from "@/components/dashboard/ui";
import {
  FISHER_TYPES,
  LGA_CODES,
  WATERS,
  nextBlueId,
  roleMeta,
  type Fisherman,
} from "@/lib/dashboard";
import {
  isFilledText,
  isPhone,
  isYear,
  isYears,
  ninMessage,
  phoneMessage,
  requiredText,
  yearMessage,
  yearsMessage,
} from "@/lib/validation";
import { useDraftStore } from "@/store/useDraftStore";
import { useRoleStore } from "@/store/useRoleStore";

const EMPTY = {
  name: "",
  sex: "Male" as "Male" | "Female",
  year: "",
  phone: "",
  nin: "",
  kin: "",
  kinPhone: "",
  lga: "Bakassi",
  community: "",
  landing: "",
  type: FISHER_TYPES[0],
  water: WATERS[2],
  yearsFishing: "",
  cooperative: "",
  boatName: "",
  boatLength: "",
  engine: "",
  horsepower: "",
  serial: "",
  gear: "",
  safety: "",
  offline: false,
};

export default function RegisterPage() {
  const role = useRoleStore((state) => state.role);
  const people = useDraftStore((state) => state.people);
  const addPerson = useDraftStore((state) => state.addPerson);
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState<string | null>(null);
  const [issued, setIssued] = useState<Fisherman | null>(null);

  const set = (key: keyof typeof EMPTY, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  const canIssue =
    isFilledText(form.name) &&
    isYear(form.year) &&
    isPhone(form.phone) &&
    isFilledText(form.community) &&
    isYears(form.yearsFishing) &&
    !ninMessage(form.nin) &&
    !phoneMessage(form.kinPhone);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeading
          kicker="Field book"
          title="Register a fisherman"
          text="The number is issued on this desk. A day without signal keeps the record on the device until it can synchronise."
        />
      </div>

      {issued ? (
        <Panel title="Blue ID issued">
          <div className="grid gap-6 px-5 py-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="grid size-24 place-items-center bg-stone font-serif text-2xl text-navy">
              {issued.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </div>
            <div>
              <p className="font-serif text-3xl text-navy">{issued.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{issued.id}</p>
              <p className="mt-3 text-sm text-navy">
                {issued.status}
                {issued.synced ? "" : " · waiting on this device"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {issued.community}, {issued.lga} · issued 14 Oct 2026 ·{" "}
                {roleMeta(role).officer}
              </p>
              <button
                type="button"
                className="mt-4 h-10 border border-navy px-4 text-sm text-navy"
                onClick={() => {
                  setIssued(null);
                  setForm(EMPTY);
                  setPhoto(null);
                }}
              >
                Register another
              </button>
            </div>
          </div>
        </Panel>
      ) : (
        <form
          className="space-y-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!canIssue) return;
            const id = form.offline
              ? `TMP-${LGA_CODES[form.lga] ?? "CRS"}-${String(people.length + 1).padStart(4, "0")}`
              : nextBlueId(form.lga, people);
            const person: Fisherman = {
              id,
              name: form.name.trim(),
              sex: form.sex,
              year: Number(form.year),
              phone: form.phone.trim(),
              lga: form.lga,
              community: form.community.trim(),
              landing: form.landing.trim() || form.community.trim(),
              type: form.type,
              water: form.water,
              yearsFishing: Number(form.yearsFishing),
              cooperative: form.cooperative.trim() || null,
              status: "Pending Verification",
              enumerator: roleMeta(role).officer,
              synced: !form.offline,
              nin: form.nin.trim() || undefined,
              kin: form.kin.trim() || undefined,
              kinPhone: form.kinPhone.trim() || undefined,
              gear: form.gear.trim() || undefined,
              safety: form.safety.trim() || undefined,
              eligible: "Pending review",
              boats: form.boatName.trim()
                ? [
                    {
                      name: form.boatName.trim(),
                      registration: form.offline
                        ? "Temporary"
                        : `CRS-BT-${LGA_CODES[form.lga] ?? "CRS"}-NEW`,
                      length: form.boatLength.trim() || "Not recorded",
                      engine: form.engine.trim() || null,
                      horsepower: form.horsepower.trim() || null,
                      serial: form.serial.trim() || null,
                      gear: form.gear.trim() || null,
                      safety: form.safety.trim() || null,
                    },
                  ]
                : [],
              benefits: [],
            };
            addPerson(person);
            setIssued(person);
            toast.success(`${id} issued for ${person.name}.`);
          }}
        >
          <Panel title="Identity">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field
                label="Full name"
                error={requiredText(form.name, "Enter the full name.")}
              >
                <input
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  aria-invalid={Boolean(
                    requiredText(form.name, "Enter the full name."),
                  )}
                  className={fieldClass}
                />
              </Field>
              <Field label="Sex">
                <select
                  value={form.sex}
                  onChange={(event) => set("sex", event.target.value)}
                  className={fieldClass}
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </Field>
              <Field label="Year of birth" error={yearMessage(form.year)}>
                <input
                  inputMode="numeric"
                  value={form.year}
                  onChange={(event) => set("year", event.target.value)}
                  aria-invalid={Boolean(yearMessage(form.year))}
                  className={fieldClass}
                />
              </Field>
              <Field label="Phone" error={phoneMessage(form.phone)}>
                <input
                  value={form.phone}
                  onChange={(event) => set("phone", event.target.value)}
                  aria-invalid={Boolean(phoneMessage(form.phone))}
                  className={fieldClass}
                />
              </Field>
              <Field label="NIN, if available" error={ninMessage(form.nin)}>
                <input
                  value={form.nin}
                  onChange={(event) => set("nin", event.target.value)}
                  aria-invalid={Boolean(ninMessage(form.nin))}
                  className={fieldClass}
                />
              </Field>
              <Field label="Passport photograph">
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-navy file:mr-3 file:h-11 file:border-0 file:bg-stone file:px-3 file:text-sm file:text-navy"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setPhoto(String(reader.result));
                    reader.readAsDataURL(file);
                  }}
                />
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt=""
                    className="mt-3 size-20 object-cover"
                  />
                ) : null}
              </Field>
            </div>
          </Panel>
          <Panel title="Next of kin">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Name">
                <input
                  value={form.kin}
                  onChange={(event) => set("kin", event.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Phone" error={phoneMessage(form.kinPhone)}>
                <input
                  value={form.kinPhone}
                  onChange={(event) => set("kinPhone", event.target.value)}
                  aria-invalid={Boolean(phoneMessage(form.kinPhone))}
                  className={fieldClass}
                />
              </Field>
            </div>
          </Panel>
          <Panel title="Where they fish">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Local government">
                <select
                  value={form.lga}
                  onChange={(event) => set("lga", event.target.value)}
                  className={fieldClass}
                >
                  {Object.keys(LGA_CODES).map((lga) => (
                    <option key={lga}>{lga}</option>
                  ))}
                </select>
              </Field>
              <Field
                label="Community"
                error={requiredText(form.community, "Enter the community.")}
              >
                <input
                  value={form.community}
                  onChange={(event) => set("community", event.target.value)}
                  aria-invalid={Boolean(
                    requiredText(form.community, "Enter the community."),
                  )}
                  className={fieldClass}
                />
              </Field>
              <Field label="Landing site">
                <input
                  value={form.landing}
                  onChange={(event) => set("landing", event.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Type of work">
                <select
                  value={form.type}
                  onChange={(event) => set("type", event.target.value)}
                  className={fieldClass}
                >
                  {FISHER_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </Field>
              <Field label="Water">
                <select
                  value={form.water}
                  onChange={(event) => set("water", event.target.value)}
                  className={fieldClass}
                >
                  {WATERS.map((water) => (
                    <option key={water}>{water}</option>
                  ))}
                </select>
              </Field>
              <Field
                label="Years fishing"
                error={yearsMessage(form.yearsFishing)}
              >
                <input
                  inputMode="numeric"
                  value={form.yearsFishing}
                  onChange={(event) => set("yearsFishing", event.target.value)}
                  aria-invalid={Boolean(yearsMessage(form.yearsFishing))}
                  className={fieldClass}
                />
              </Field>
              <Field label="Cooperative">
                <input
                  value={form.cooperative}
                  onChange={(event) => set("cooperative", event.target.value)}
                  className={fieldClass}
                />
              </Field>
            </div>
          </Panel>
          <Panel title="Boat and gear, if any">
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Boat type">
                <input
                  value={form.boatName}
                  onChange={(event) => set("boatName", event.target.value)}
                  placeholder="Wooden canoe"
                  className={fieldClass}
                />
              </Field>
              <Field label="Length">
                <input
                  value={form.boatLength}
                  onChange={(event) => set("boatLength", event.target.value)}
                  placeholder="7.2 m"
                  className={fieldClass}
                />
              </Field>
              <Field label="Engine">
                <input
                  value={form.engine}
                  onChange={(event) => set("engine", event.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Horsepower">
                <input
                  value={form.horsepower}
                  onChange={(event) => set("horsepower", event.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Engine serial">
                <input
                  value={form.serial}
                  onChange={(event) => set("serial", event.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Nets and gear">
                <input
                  value={form.gear}
                  onChange={(event) => set("gear", event.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Safety equipment">
                <input
                  value={form.safety}
                  onChange={(event) => set("safety", event.target.value)}
                  className={fieldClass}
                />
              </Field>
            </div>
          </Panel>
          <label className="flex items-center gap-3 text-sm text-navy">
            <input
              type="checkbox"
              checked={form.offline}
              onChange={(event) => set("offline", event.target.checked)}
            />
            No signal. Keep this record on the device and issue a temporary
            number.
          </label>
          <button type="submit" disabled={!canIssue} className={submitClass}>
            Issue Blue ID
          </button>
        </form>
      )}
    </div>
  );
}
