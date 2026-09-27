// Response headers for the hosted site. `vite preview` applies them locally so a CSP that
// breaks the app is caught before deploy; the SST config applies the same values through a
// CloudFront response headers policy.

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // Radix Dialog's scroll lock (react-remove-scroll) injects a <style> tag whose content depends on the
  // scrollbar width, so a hash cannot cover it. Inline styles only; script-src stays strict.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

export const STRICT_TRANSPORT_SECURITY_MAX_AGE = 31536000;

export const PERMISSIONS_POLICY =
  "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()";

export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "Strict-Transport-Security": `max-age=${STRICT_TRANSPORT_SECURITY_MAX_AGE}; includeSubDomains`,
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": PERMISSIONS_POLICY,
});
