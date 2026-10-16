"use client";

import { useEffect, useState, type ReactNode } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { navFor } from "@/lib/dashboard";
import { findOfficerById, hydrateAccountOverrides } from "@/lib/officers";
import { useRoleStore } from "@/store/useRoleStore";
import { useSessionStore } from "@/store/useSessionStore";

const SESSION_KEY = "blueid-session";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const role = useRoleStore((state) => state.role);
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    hydrateAccountOverrides();
    const saved = window.localStorage.getItem(SESSION_KEY);
    const officer = saved ? findOfficerById(saved) : undefined;
    if (officer && officer.status === "Active") {
      useRoleStore.setState({ role: officer.role });
      useSessionStore.setState({
        signedIn: true,
        userId: officer.userId,
        mustChangePassword: officer.mustChangePassword,
      });
      if (officer.mustChangePassword) {
        router.replace("/change-password");
        return;
      }
      setAuthed(true);
    }
    setCollapsed(window.localStorage.getItem("blueid-sidebar") === "collapsed");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !router.isReady) return;
    if (!authed) {
      router.replace("/login");
      return;
    }
    const allowed = navFor(role).some((item) =>
      item.href === "/dashboard"
        ? router.pathname === "/dashboard"
        : router.pathname.startsWith(item.href),
    );
    if (!allowed) router.replace("/dashboard");
  }, [ready, authed, role, router]);

  if (!ready || !authed) {
    return <div className="h-screen bg-stone" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone">
      <Head>
        <title>Officer desk · Blue ID</title>
      </Head>
      <div className="hidden h-full md:block">
        <DashboardSidebar
          role={role}
          collapsed={collapsed}
          onToggle={() =>
            setCollapsed((value) => {
              const next = !value;
              window.localStorage.setItem(
                "blueid-sidebar",
                next ? "collapsed" : "open",
              );
              return next;
            })
          }
        />
      </div>
      {menu ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/40"
            aria-label="Close menu"
            onClick={() => setMenu(false)}
          />
          <div className="relative h-full">
            <DashboardSidebar
              role={role}
              onNavigate={() => setMenu(false)}
              onClose={() => setMenu(false)}
            />
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader role={role} onMenu={() => setMenu(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
