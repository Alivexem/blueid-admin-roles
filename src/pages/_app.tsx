import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Fraunces, Nata_Sans } from "next/font/google";
import { useRouter } from "next/router";
import { Toaster } from "sonner";

import { DashboardLayout } from "@/components/layout/dashboard-layout";

const nataSans = Nata_Sans({
  subsets: ["latin"],
  variable: "--font-nata-sans",
  display: "swap",
  adjustFontFallback: false,
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDashboard =
    router.pathname.startsWith("/dashboard") ||
    (router.pathname === "/404" && router.asPath.startsWith("/dashboard"));

  return (
    <div className={`${nataSans.variable} ${fraunces.variable} font-sans`}>
      <Toaster
        position="bottom-right"
        offset={16}
        closeButton
        duration={8000}
        toastOptions={{
          className: "blueid-toast",
        }}
      />
      {isDashboard ? (
        <DashboardLayout>
          <Component {...pageProps} />
        </DashboardLayout>
      ) : (
        <Component {...pageProps} />
      )}
    </div>
  );
}
