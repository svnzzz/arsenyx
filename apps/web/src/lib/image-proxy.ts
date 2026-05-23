import { API_URL } from "./constants"

// Wraps a user-supplied image URL so the browser fetches it from our own API
// origin rather than the third-party host. Without the proxy, an org/profile
// admin could point `image` at a server they control and silently log every
// visitor's IP and Referer when the avatar loads.
//
// We originally targeted Cloudflare's /cdn-cgi/image/... endpoint, but the
// free plan only supports it for assets stored in Cloudflare Images — for
// arbitrary external URLs CF returns 403. We now route through a tiny Hono
// handler at `${API_URL}/img?u=<encoded>` (see apps/api/src/routes/img.ts)
// that fetches server-side, enforces a size cap, and refuses non-image
// content types. The width/height/fit params are accepted for API stability
// but currently unused — the proxy returns the source bytes verbatim.

type ProxyOptions = {
  width?: number
  height?: number
  fit?: "cover" | "contain" | "scale-down" | "crop"
}

function isProxyable(src: string): boolean {
  // Only proxy absolute http(s) URLs. data:, blob:, and relative paths
  // (e.g. local placeholders) pass through unchanged.
  return /^https?:\/\//i.test(src)
}

export function proxyImage(
  src: string | null | undefined,
  _opts: ProxyOptions = {},
): string | null {
  if (!src) return null
  if (!isProxyable(src)) return src
  return `${API_URL}/img?u=${encodeURIComponent(src)}`
}
