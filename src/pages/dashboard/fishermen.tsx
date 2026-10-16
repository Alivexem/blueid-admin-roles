"use client";

import { FishermenTable } from "@/components/dashboard/fishermen-table";
import { useRoleStore } from "@/store/useRoleStore";

export default function FishermenPage() {
  const role = useRoleStore((state) => state.role);
  return <FishermenTable role={role} />;
}
