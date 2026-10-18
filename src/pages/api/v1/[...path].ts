import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

function apiOrigin() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured) return "https://api.blueid.com.ng";
  const bare = configured.replace(/\/$/, "");
  return bare.startsWith("http") ? bare : `https://${bare}`;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const segments = request.query.path;
  const path = Array.isArray(segments) ? segments.join("/") : segments || "";
  const incoming = new URL(request.url || "/", "http://localhost");
  const target = new URL(`/api/v1/${path}`, apiOrigin());
  incoming.searchParams.forEach((value, key) => {
    if (key !== "path") target.searchParams.append(key, value);
  });

  const headers = new Headers();
  const contentType = request.headers["content-type"];
  const authorization = request.headers.authorization;
  const accept = request.headers.accept;
  if (typeof contentType === "string") headers.set("content-type", contentType);
  if (typeof authorization === "string")
    headers.set("authorization", authorization);
  if (typeof accept === "string") headers.set("accept", accept);

  const chunks: Buffer[] = [];
  if (request.method !== "GET" && request.method !== "HEAD") {
    for await (const chunk of request) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
  }

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });

  response.status(upstream.status);
  const type = upstream.headers.get("content-type");
  if (type) response.setHeader("content-type", type);
  response.send(Buffer.from(await upstream.arrayBuffer()));
}
