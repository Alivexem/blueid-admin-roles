"use client";

import { useEffect, useState, type ReactNode } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { deskNav } from "@/lib/access";
import { useSessionStore } from "@/store/useSessionStore";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const profile = useSessionStore((state) => state.profile);
  const signedIn = useSessionStore((state) => state.signedIn);
  const ready = useSessionStore((state) => state.ready);
  const mustChangePassword = useSessionStore(
    (state) => state.mustChangePassword,
  );
  const hydrate = useSessionStore((state) => state.hydrate);
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    void hydrate();
    setCollapsed(window.localStorage.getItem("blueid-sidebar") === "collapsed");
  }, [hydrate]);

  useEffect(() => {
    if (!ready || !router.isReady) return;
    if (!signedIn || !profile) {
      router.replace("/login");
      return;
    }
    if (mustChangePassword) {
      router.replace("/change-password");
      return;
    }
    if (router.pathname === "/404") return;
    const allowed =
      router.pathname.startsWith("/dashboard/settings") ||
      deskNav(profile.roleId, profile.permissions?.granted).some((item) =>
        item.href === "/dashboard"
          ? router.pathname === "/dashboard"
          : router.pathname.startsWith(item.href),
      );
    if (!allowed) router.replace("/dashboard");
  }, [ready, signedIn, profile, mustChangePassword, router]);

  if (!ready || !signedIn || !profile || mustChangePassword) {
    return (
      <div
        className="flex h-screen bg-stone"
        aria-busy="true"
        aria-label="Loading desk"
      >
        <div className="hidden w-[248px] border-r border-line bg-white p-5 md:block">
          <div className="h-8 w-28 animate-pulse rounded-[8px] bg-stone" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="h-9 animate-pulse rounded-[8px] bg-stone"
              />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="h-4 w-24 animate-pulse rounded-[8px] bg-white" />
          <div className="mt-3 h-10 w-64 animate-pulse rounded-[8px] bg-white" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-[8px] bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-stone">
      <Head>
        <title>Officer desk · Blue ID</title>
      </Head>
      <div className="hidden h-full md:block">
        <DashboardSidebar
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
            className="absolute inset-0 animate-in bg-navy/40 duration-200 fade-in"
            aria-label="Close menu"
            onClick={() => setMenu(false)}
          />
          <div className="absolute inset-y-0 right-0 animate-in pt-[env(safe-area-inset-top)] shadow-[-8px_0_24px_rgba(10,76,154,0.12)] duration-200 slide-in-from-right bg-white">
            <DashboardSidebar
              className="border-r-0 border-l"
              onNavigate={() => setMenu(false)}
              onClose={() => setMenu(false)}
            />
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMenu={() => setMenu(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
