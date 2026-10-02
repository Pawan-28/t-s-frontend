// The Next.js proxy forwards the visitor IP to Django's per-IP rate limits.
// Header values are client-controllable, so only the entry appended by the
// trusted proxy (counted from the right) may ever be used.
import test from "node:test";
import assert from "node:assert/strict";
import { clientIpFromHeaders } from "../lib/auth/clientIpCore.js";

const headers = (h) => (name) => h[name] ?? null;

test("a single trusted proxy: the LAST X-Forwarded-For entry is the client", () => {
  assert.equal(clientIpFromHeaders(headers({ "x-forwarded-for": "203.0.113.7" }), {}), "203.0.113.7");
});

test("client-forged leading entries are ignored (spoofing resistance)", () => {
  const h = headers({ "x-forwarded-for": "1.2.3.4, 9.9.9.9, 203.0.113.7" });
  assert.equal(clientIpFromHeaders(h, {}), "203.0.113.7");
});

test("two trusted hops (e.g. Cloudflare -> nginx -> Next.js) take the second from the right", () => {
  const h = headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7, 172.16.0.1" });
  assert.equal(clientIpFromHeaders(h, { CLIENT_IP_TRUSTED_PROXY_HOPS: "2" }), "203.0.113.7");
});

test("more hops than entries falls back to the leftmost entry, never throws", () => {
  assert.equal(clientIpFromHeaders(headers({ "x-forwarded-for": "203.0.113.7" }), { CLIENT_IP_TRUSTED_PROXY_HOPS: "5" }), "203.0.113.7");
});

test("no forwarding header -> no IP (Django then uses the connection address)", () => {
  assert.equal(clientIpFromHeaders(headers({}), {}), "");
});

test("x-real-ip / cf-connecting-ip are NOT trusted by default", () => {
  const h = headers({ "cf-connecting-ip": "8.8.8.8", "x-real-ip": "7.7.7.7" });
  assert.equal(clientIpFromHeaders(h, {}), "");
});

test("cf-connecting-ip is honoured only when explicitly trusted", () => {
  const h = headers({ "cf-connecting-ip": "8.8.8.8", "x-forwarded-for": "203.0.113.7" });
  assert.equal(clientIpFromHeaders(h, { TRUST_CF_CONNECTING_IP: "true" }), "8.8.8.8");
  assert.equal(clientIpFromHeaders(h, { TRUST_CF_CONNECTING_IP: "false" }), "203.0.113.7");
});

test("garbage hop config defaults to 1", () => {
  const h = headers({ "x-forwarded-for": "1.1.1.1, 203.0.113.7" });
  assert.equal(clientIpFromHeaders(h, { CLIENT_IP_TRUSTED_PROXY_HOPS: "abc" }), "203.0.113.7");
});
