"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function PortalHome() {
  const router = useRouter();

  useEffect(() => {
    const signedIn = window.localStorage.getItem("blueid-session");
    router.replace(signedIn ? "/dashboard" : "/login");
  }, [router]);

  return <div className="h-screen bg-stone" />;
}
