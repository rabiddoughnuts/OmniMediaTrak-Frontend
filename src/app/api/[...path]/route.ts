import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const REQUEST_HEADERS_TO_DROP = new Set([
  "connection",
  "content-length",
  "host",
  "transfer-encoding",
]);

const RESPONSE_HEADERS_TO_DROP = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
]);

function isTrustedPublicHost(host: string): boolean {
  const trustedHosts = process.env.TRUSTED_PUBLIC_HOSTS
    ?.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return !trustedHosts?.length || trustedHosts.includes(host.toLowerCase());
}

async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
  const apiBaseUrl = process.env.INTERNAL_API_BASE_URL;
  if (!apiBaseUrl) {
    return Response.json({ error: "Internal API is not configured" }, { status: 503 });
  }
  if (!isTrustedPublicHost(request.nextUrl.host)) {
    return Response.json({ error: "Unrecognized public host" }, { status: 421 });
  }

  const { path } = await context.params;
  const upstreamUrl = new URL(
    path.map(encodeURIComponent).join("/"),
    `${apiBaseUrl.replace(/\/$/, "")}/`
  );
  upstreamUrl.search = request.nextUrl.search;

  const requestHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!REQUEST_HEADERS_TO_DROP.has(key.toLowerCase())) requestHeaders.set(key, value);
  });
  requestHeaders.set("x-forwarded-host", request.nextUrl.host);
  requestHeaders.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: requestHeaders,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      const normalized = key.toLowerCase();
      if (!RESPONSE_HEADERS_TO_DROP.has(normalized) && normalized !== "set-cookie") {
        responseHeaders.set(key, value);
      }
    });
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append("set-cookie", cookie);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json({ error: "Internal API is unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
