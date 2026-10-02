/**
 * Checkout step "Enter Email + Mobile" (PDF flow: Choose Plan -> Enter
 * Email + Mobile -> Razorpay Payment -> Verification -> Subscription
 * Active). Pure, dependency-free helpers so the same rules run in the
 * browser (before Razorpay is ever opened) and in `npm test`.
 *
 * These mirror - and never replace - the backend's authoritative
 * validation (apps.subscriptions.serializers.CheckoutInputSerializer +
 * apps.subscriptions.phone_utils): a bare 10-digit Indian mobile number is
 * accepted, "+91"/"91"/"0"-prefixed/spaced variants are normalized, and
 * anything outside 10-15 digits is rejected.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Digits-only, country-code-included form, e.g. "9876543210" -> "919876543210". */
export function normalizeIndianMobile(input) {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (!digits) return digits;
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 11 && digits.startsWith("0")) return "91" + digits.slice(1);
  return digits;
}

/**
 * @param {{ email?: string, phone?: string }} contact
 * @returns {{ ok: boolean, errors: { email?: string, phone?: string }, email: string, phone: string }}
 */
export function validateCheckoutContact(contact) {
  const email = String(contact?.email ?? "").trim();
  const rawPhone = String(contact?.phone ?? "").trim();
  const errors = {};

  if (!email) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(email) || email.length > 254) errors.email = "Enter a valid email address.";

  const phone = normalizeIndianMobile(rawPhone);
  if (!rawPhone) errors.phone = "Enter your mobile number.";
  else if (phone.length < 10 || phone.length > 15) {
    errors.phone = "Enter a valid mobile number, e.g. 9876543210 (no country code needed).";
  }

  return { ok: Object.keys(errors).length === 0, errors, email, phone: rawPhone };
}
