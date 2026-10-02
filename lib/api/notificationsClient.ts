import { cookies } from "next/headers";
import { SITE_URL } from "@/lib/seo";
import type { Notification, PaginatedResponse } from "@/lib/types";

/**
 * Role-agnostic notification fetcher/mutator, calling this app's own
 * generic /api/notifications Route Handlers (see those files for why a
 * second, non-"/reporter/"-prefixed pair exists). Same
 * degrade-instead-of-throw contract as lib/api/reporterClient.ts.
 */

const EMPTY_PAGE: PaginatedResponse<Notification> = { count: 0, next: null, previous: null, results: [] };

export async function listNotifications(page = 1): Promise<PaginatedResponse<Notification>> {
  const header = cookies().toString();
  if (!header) return EMPTY_PAGE;
  try {
    const res = await fetch(`${SITE_URL}/api/notifications?page=${page}`, {
      headers: { cookie: header },
      cache: "no-store",
    });
    if (!res.ok) return EMPTY_PAGE;
    return (await res.json()) as PaginatedResponse<Notification>;
  } catch {
    return EMPTY_PAGE;
  }
}
