import test from "node:test";
import assert from "node:assert/strict";
import { normalizeIndianMobile, validateCheckoutContact } from "../lib/checkoutContact.js";

test("normalizes bare, +91, 91, 0-prefixed and spaced numbers", () => {
  assert.equal(normalizeIndianMobile("9876543210"), "919876543210");
  assert.equal(normalizeIndianMobile("+91 98765 43210"), "919876543210");
  assert.equal(normalizeIndianMobile("919876543210"), "919876543210");
  assert.equal(normalizeIndianMobile("09876543210"), "919876543210");
  assert.equal(normalizeIndianMobile(""), "");
});

test("valid checkout contact passes", () => {
  const r = validateCheckoutContact({ email: "reader@example.com", phone: "9876543210" });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, {});
});

test("email is required and must look like an email", () => {
  assert.equal(validateCheckoutContact({ email: "", phone: "9876543210" }).errors.email, "Enter your email address.");
  assert.match(validateCheckoutContact({ email: "not-an-email", phone: "9876543210" }).errors.email, /valid email/);
});

test("phone is required and must be a plausible number", () => {
  assert.equal(validateCheckoutContact({ email: "a@b.co", phone: "" }).errors.phone, "Enter your mobile number.");
  assert.match(validateCheckoutContact({ email: "a@b.co", phone: "12345" }).errors.phone, /valid mobile/);
  assert.match(validateCheckoutContact({ email: "a@b.co", phone: "abc" }).errors.phone, /valid mobile/);
});
