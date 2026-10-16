"use client";

import { Overview } from "@/components/dashboard/overview";
import { useRoleStore } from "@/store/useRoleStore";

export default function DashboardHomePage() {
  const role = useRoleStore((state) => state.role);
  return <Overview role={role} />;
}
