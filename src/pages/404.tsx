import Head from "next/head";

import { Container } from "@/components/ui/container";
import { webUrl } from "@/lib/site";

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Page not found · Blue ID</title>
      </Head>
      <section className="flex min-h-[70vh] items-center bg-ivory pt-24">
        <Container>
          <p className="text-[11px] tracking-[0.22em] text-navy uppercase">
            404
          </p>
          <h1 className="mt-4 max-w-lg font-serif text-5xl tracking-[-0.03em] text-navy">
            This page is not part of the register.
          </h1>
          <a
            href={webUrl()}
            className="mt-8 inline-flex text-sm text-navy underline decoration-navy underline-offset-4"
          >
            Return to Blue ID
          </a>
        </Container>
      </section>
    </>
  );
}
