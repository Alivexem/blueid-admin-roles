"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

import { useSessionStore } from "@/store/useSessionStore";

export default function PortalHome() {
  const router = useRouter();
  const hydrate = useSessionStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate().then(() => {
      const session = useSessionStore.getState();
      if (!session.signedIn) {
        router.replace("/login");
        return;
      }
      router.replace(
        session.mustChangePassword ? "/change-password" : "/dashboard",
      );
    });
  }, [hydrate, router]);

  return <div className="h-screen bg-stone" />;
}
