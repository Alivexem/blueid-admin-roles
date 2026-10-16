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
  const isDashboard = router.pathname.startsWith("/dashboard");

  return (
    <div className={`${nataSans.variable} ${fraunces.variable} font-sans`}>
      <Toaster
        position="bottom-right"
        offset={16}
        toastOptions={{
          className: "blueid-toast",
          style: {
            borderRadius: "8px",
            border: "1px solid #D4E3F5",
            borderLeft: "4px solid #0A4C9A",
            color: "#0E2F66",
          },
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
