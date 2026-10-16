"use client";

import { Overview } from "@/components/dashboard/overview";
import { SuperOverview } from "@/components/dashboard/super-overview";
import { useRoleStore } from "@/store/useRoleStore";

export default function DashboardHomePage() {
  const role = useRoleStore((state) => state.role);
  if (role === "super") return <SuperOverview />;
  return <Overview role={role} />;
}
