import { create } from "zustand";

import type { Benefit, Fisherman } from "@/lib/dashboard";

type DraftBenefit = Benefit & { name: string; id: string; lga: string };

type DraftState = {
  people: Fisherman[];
  benefits: DraftBenefit[];
  cooperatives: string[];
  addPerson: (person: Fisherman) => void;
  addBenefit: (benefit: DraftBenefit) => void;
  addCooperative: (name: string) => void;
};

export const useDraftStore = create<DraftState>((set) => ({
  people: [],
  benefits: [],
  cooperatives: [],
  addPerson: (person) =>
    set((state) => ({ people: [person, ...state.people] })),
  addBenefit: (benefit) =>
    set((state) => ({ benefits: [benefit, ...state.benefits] })),
  addCooperative: (name) =>
    set((state) => ({ cooperatives: [name, ...state.cooperatives] })),
}));
