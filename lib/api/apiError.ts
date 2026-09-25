/**
 * DRF's error responses are never one consistent shape - a plain
 * {"detail": "..."} for a PermissionDenied/AuthenticationFailed, a
 * {"field": ["msg"]} or {"field": "msg"} dict for a ValidationError (one
 * entry per invalid field, e.g. {"reason": ["This field is required."]}
 * from request-changes/reject, or {"subcategory_slug": ["..."]} from the
 * reporter-category-assignment check), or {"non_field_errors": [...]}
 * for a validate()-level error. This flattens any of those into one
 * human-readable string for a form's error banner, instead of every
 * caller re-deriving its own guess at the shape.
 */
export function extractApiError(data: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!data || typeof data !== "object") return fallback;
  const obj = data as Record<string, unknown>;

  if (typeof obj.detail === "string") return obj.detail;

  const messages: string[] = [];
  for (const [field, value] of Object.entries(obj)) {
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      if (typeof v !== "string") continue;
      messages.push(field === "non_field_errors" || field === "detail" ? v : `${field}: ${v}`);
    }
  }
  return messages.length > 0 ? messages.join(" ") : fallback;
}
