import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY, SECURITY_HEADERS } from "@/security-headers";

describe("security headers", () => {
  it("forbids framing and plugins", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'");
  });

  it("never loosens script-src", () => {
    const scriptSrc = CONTENT_SECURITY_POLICY.split("; ").find((directive) => directive.startsWith("script-src"));
    expect(scriptSrc).toBe("script-src 'self'");
  });

  it("includes the public-static-site baseline", () => {
    expect(Object.keys(SECURITY_HEADERS).sort()).toEqual([
      "Content-Security-Policy",
      "Permissions-Policy",
      "Referrer-Policy",
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "X-Frame-Options",
    ]);
  });
});
