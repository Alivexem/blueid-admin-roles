const webOrigin = (
  process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export function webUrl(path = "/") {
  return `${webOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}
