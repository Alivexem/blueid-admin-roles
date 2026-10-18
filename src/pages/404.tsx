"use client";

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import { Container } from "@/components/ui/container";

export default function NotFoundPage() {
  const router = useRouter();
  const inDesk = router.asPath.startsWith("/dashboard");

  return (
    <>
      <Head>
        <title>Page not found · Blue ID</title>
      </Head>
      <section
        className={
          inDesk
            ? "flex min-h-[60vh] items-center"
            : "flex min-h-[70vh] items-center bg-ivory pt-24"
        }
      >
        <Container>
          <p className="text-[11px] tracking-[0.22em] text-navy uppercase">
            404
          </p>
          <h1 className="mt-4 max-w-lg font-serif text-4xl tracking-[-0.03em] text-navy sm:text-5xl">
            This page is not part of the register.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {inDesk
              ? "The desk does not have a screen at this address."
              : "The address does not match a page on this site."}
          </p>
          <Link
            href={inDesk ? "/dashboard" : "/login"}
            className="mt-8 inline-flex text-sm text-navy underline decoration-navy underline-offset-4"
          >
            {inDesk ? "Return to the overview" : "Return to sign-in"}
          </Link>
        </Container>
      </section>
    </>
  );
}
