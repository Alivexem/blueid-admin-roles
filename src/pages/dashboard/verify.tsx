"use client";

import { VerifyPanel } from "@/components/dashboard/verify-panel";
import { useRoleStore } from "@/store/useRoleStore";

export default function VerifyPage() {
  const role = useRoleStore((state) => state.role);
  return <VerifyPanel role={role} />;
}
