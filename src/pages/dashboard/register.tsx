"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Field,
  Modal,
  PageHeading,
  Panel,
  fieldClass,
  submitClass,
} from "@/components/dashboard/ui";
import {
  LGAS,
  createBoat,
  createEngine,
  createEquipment,
  checkDuplicates,
  createFisherman,
  describeError,
  listCooperatives,
  uploadFishermanPhoto,
  type CooperativeRow,
} from "@/lib/api";
import {
  commitText,
  isFilledText,
  isPhone,
  isYear,
  isYears,
  ninMessage,
  phoneMessage,
  requiredText,
  stripSpace,
  tidyText,
  yearMessage,
  yearsMessage,
} from "@/lib/validation";

const WORK = [
  ["ARTISANAL", "Artisanal fisherman"],
  ["COMMERCIAL", "Commercial fisherman"],
  ["FISH_FARMER", "Fish farmer"],
  ["BOAT_OWNER", "Boat owner"],
  ["CREW_MEMBER", "Crew member"],
  ["FISH_PROCESSOR", "Fish processor"],
  ["FISH_TRADER", "Fish trader"],
] as const;

const WATERS = [
  ["MARINE", "Marine"],
  ["RIVER", "River"],
  ["CREEK", "Creek"],
  ["ESTUARY", "Estuary"],
  ["INLAND", "Inland"],
  ["AQUACULTURE", "Aquaculture"],
] as const;

const BOATS = [
  ["", "No boat"],
  ["DUGOUT_CANOE", "Dugout canoe"],
  ["PLANK_CANOE", "Plank canoe"],
  ["WOODEN_BOAT", "Wooden boat"],
  ["FIBREGLASS_BOAT", "Fibreglass boat"],
  ["ALUMINIUM_BOAT", "Aluminium boat"],
  ["TRAWLER", "Trawler"],
  ["OTHER", "Other"],
] as const;

const EMPTY = {
  name: "",
  sex: "MALE",
  year: "",
  phone: "",
  nin: "",
  kin: "",
  kinPhone: "",
  lga: "BAK",
  community: "",
  landing: "",
  type: "ARTISANAL",
  water: "CREEK",
  yearsFishing: "",
  cooperative: "",
  boatType: "",
  boatLength: "",
  engine: "",
  horsepower: "",
  serial: "",
  gear: "",
  safety: "",
};

type Issued = {
  name: string;
  reference: string;
  status: string;
};

export default function RegisterPage() {
  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [warned, setWarned] = useState(false);
  const [cooperatives, setCooperatives] = useState<CooperativeRow[]>([]);

  useEffect(() => {
    void listCooperatives()
      .then(setCooperatives)
      .catch(() => setCooperatives([]));
  }, []);

  const set = (key: keyof typeof EMPTY, value: string) => {
    const spaceless = new Set<keyof typeof EMPTY>([
      "year",
      "phone",
      "nin",
      "kinPhone",
      "yearsFishing",
      "horsepower",
      "serial",
      "boatLength",
    ]);
    setForm((current) => ({
      ...current,
      [key]: spaceless.has(key) ? stripSpace(value) : tidyText(value),
    }));
  };

  const canSave =
    isFilledText(form.name) &&
    form.name.trim().includes(" ") &&
    isYear(form.year) &&
    isPhone(form.phone) &&
    isFilledText(form.community) &&
    isYears(form.yearsFishing) &&
    !ninMessage(form.nin) &&
    !phoneMessage(form.kinPhone) &&
    !busy;

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Field book"
        title="Register a fisherman"
        text="The record is saved as pending. A Blue ID is issued only after an officer verifies it."
      />
      <button
        type="button"
        className={submitClass}
        onClick={() => setFormOpen(true)}
      >
        Register a fisherman
      </button>

      {issued ? (
        <Panel title="Registration saved">
          <div className="px-5 py-5">
            <p className="font-serif text-3xl text-navy">{issued.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {issued.reference}
            </p>
            <p className="mt-3 text-sm text-navy">{issued.status}</p>
            <button
              type="button"
              className="mt-4 h-10 border border-navy px-4 text-sm text-navy"
              onClick={() => {
                setIssued(null);
                setForm(EMPTY);
                setPhoto(null);
                setPreview(null);
              }}
            >
              Register another
            </button>
          </div>
        </Panel>
      ) : null}
      {formOpen ? (
        <Modal
          title="Register a fisherman"
          wide
          onClose={() => setFormOpen(false)}
        >
          <form
            className="space-y-3"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (!canSave) return;
              const parts = commitText(form.name).split(" ");
              const firstName = parts[0];
              const lastName = parts.slice(1).join(" ");
              setBusy(true);
              void checkDuplicates({
                firstName,
                lastName,
                lga: form.lga,
                phone: stripSpace(form.phone) || undefined,
                estimatedYearOfBirth: Number(form.year),
              })
                .catch(() => [])
                .then((probe) => {
                  const matches = Array.isArray(probe) ? probe : [];
                  if (matches.length && !warned) {
                    setWarned(true);
                    toast.error(
                      "A similar person is already on the register. Submit again to save this record.",
                    );
                    return null;
                  }
                  return createFisherman({
                    firstName,
                    lastName,
                    gender: form.sex,
                    estimatedYearOfBirth: Number(form.year),
                    phone: stripSpace(form.phone),
                    nin: stripSpace(form.nin) || undefined,
                    nextOfKin: commitText(form.kin)
                      ? {
                          name: commitText(form.kin),
                          phone: stripSpace(form.kinPhone) || undefined,
                        }
                      : undefined,
                    lga: form.lga,
                    communityName: commitText(form.community),
                    landingSite: commitText(form.landing) || undefined,
                    fishermanTypes: [form.type],
                    fishingTypes: [form.water],
                    yearsFishing: Number(stripSpace(form.yearsFishing)),
                    cooperative: form.cooperative
                      ? { id: form.cooperative }
                      : undefined,
                  });
                })
                .then(async (person) => {
                  if (!person) return;
                  if (photo) await uploadFishermanPhoto(person.id, photo);
                  if (form.boatType) {
                    await createBoat({
                      owner: person.id,
                      boatType: form.boatType,
                      name: BOATS.find(
                        (item) => item[0] === form.boatType,
                      )?.[1],
                      lengthMeters: form.boatLength
                        ? Number(form.boatLength)
                        : undefined,
                      propulsion: form.engine ? "OUTBOARD_ENGINE" : "PADDLE",
                    });
                  }
                  if (commitText(form.engine)) {
                    await createEngine({
                      owner: person.id,
                      manufacturer: commitText(form.engine),
                      horsepower: form.horsepower
                        ? Number(form.horsepower)
                        : undefined,
                      serialNumber: stripSpace(form.serial) || undefined,
                      engineType: "OUTBOARD",
                    });
                  }
                  if (commitText(form.gear)) {
                    await createEquipment({
                      owner: person.id,
                      type: "FISHING_GEAR",
                      description: commitText(form.gear),
                    });
                  }
                  if (commitText(form.safety)) {
                    await createEquipment({
                      owner: person.id,
                      type: "SAFETY_EQUIPMENT",
                      description: commitText(form.safety),
                    });
                  }
                  setFormOpen(false);
                  setIssued({
                    name: person.fullName || `${firstName} ${lastName}`,
                    reference: person.tempReference || person.id,
                    status: "Pending verification",
                  });
                  toast.success(
                    "Registration saved. It is waiting for verification.",
                  );
                })
                .catch((reason) => toast.error(describeError(reason)))
                .finally(() => setBusy(false));
            }}
          >
            <Panel title="Identity">
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field
                  label="Full name"
                  error={requiredText(
                    form.name,
                    "Enter the first and last name.",
                  )}
                >
                  <input
                    value={form.name}
                    onChange={(event) => set("name", event.target.value)}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Gender">
                  <select
                    value={form.sex}
                    onChange={(event) => set("sex", event.target.value)}
                    className={fieldClass}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
                <Field label="Year of birth" error={yearMessage(form.year)}>
                  <input
                    inputMode="numeric"
                    value={form.year}
                    onChange={(event) => set("year", event.target.value)}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Phone" error={phoneMessage(form.phone)}>
                  <input
                    value={form.phone}
                    onChange={(event) => set("phone", event.target.value)}
                    className={fieldClass}
                  />
                </Field>
                <Field label="NIN, if available" error={ninMessage(form.nin)}>
                  <input
                    value={form.nin}
                    onChange={(event) => set("nin", event.target.value)}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Passport photograph">
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-base text-navy file:mr-3 file:h-11 file:border-0 file:bg-stone file:px-3 file:text-base file:text-navy"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setPhoto(file);
                      setPreview(file ? URL.createObjectURL(file) : null);
                    }}
                  />
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
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
                    {LGAS.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
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
                    {WORK.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Water">
                  <select
                    value={form.water}
                    onChange={(event) => set("water", event.target.value)}
                    className={fieldClass}
                  >
                    {WATERS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
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
                    onChange={(event) =>
                      set("yearsFishing", event.target.value)
                    }
                    className={fieldClass}
                  />
                </Field>
                <Field label="Cooperative">
                  <select
                    value={form.cooperative}
                    onChange={(event) => set("cooperative", event.target.value)}
                    className={fieldClass}
                  >
                    <option value="">None</option>
                    {cooperatives.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Panel>
            <Panel title="Boat and gear, if any">
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label="Boat">
                  <select
                    value={form.boatType}
                    onChange={(event) => set("boatType", event.target.value)}
                    className={fieldClass}
                  >
                    {BOATS.map(([value, label]) => (
                      <option key={value || "none"} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Length in metres">
                  <input
                    inputMode="decimal"
                    value={form.boatLength}
                    onChange={(event) => set("boatLength", event.target.value)}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Engine make">
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
            <button type="submit" disabled={!canSave} className={submitClass}>
              {busy ? "Saving" : "Save registration"}
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
