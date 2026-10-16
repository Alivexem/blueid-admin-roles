import { Html, Head, Main, NextScript } from "next/document";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="description" content={APP_DESCRIPTION} />
        <meta name="theme-color" content="#0A4C9A" />
        <meta property="og:title" content={`${APP_NAME} · Cross River State`} />
        <meta property="og:description" content={APP_DESCRIPTION} />
        <meta property="og:type" content="website" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
