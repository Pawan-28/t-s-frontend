import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  AUTH_COOKIE_OPTIONS,
  REFRESH_COOKIE,
  fetchWithAuthRefresh,
} from "./session";

/**
 * Reporter Frontend: a more general counterpart to authedProxy() (used by
 * app/api/subscriptions/*), needed because the Reporter surface has to
 * proxy more than GET/POST-with-a-JSON-body:
 *
 * - PATCH (editing a draft, updating an image's alt text/caption/featured
 *   flag)
 * - DELETE (removing an uploaded image)
 * - multipart/form-data passthrough (uploading the image file itself -
 *   apps.media.serializers.ArticleImageSerializer's `image` field)
 * - forwarding the caller's own query string (status/taxonomy/search/page
 *   filters on the list endpoints)
 *
 * Same core contract as authedProxy() otherwise: the browser only ever
 * holds this app's own httpOnly cookies, never the raw Django JWT: this
 * reads the access token from the cookie, forwards it to Django as a
 * Bearer header, transparently refreshes it via the refresh cookie on a
 * 401, and writes any refreshed access token back out as an updated
 * cookie on the response.
 */
export async function reporterProxy(
  request: NextRequest,
  djangoPath: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  options: { forwardQuery?: boolean; multipart?: boolean } = {}
): Promise<NextResponse> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ detail: "You must be logged in." }, { status: 401 });
  }

  let path = djangoPath;
  if (options.forwardQuery) {
    const qs = request.nextUrl.search;
    if (qs) path += qs;
  }

  const init: RequestInit = { method };
  if (method === "POST" || method === "PATCH") {
    if (options.multipart) {
      // Read the browser's multipart body and hand it straight to fetch
      // as FormData - fetch derives its own Content-Type/boundary header
      // from it, so one must NOT be set by hand here (an explicit
      // "multipart/form-data" header with no boundary would corrupt the
      // request). Safe to reuse across fetchWithAuthRefresh's retry-
      // after-refresh: FormData is re-serialized fresh on every fetch
      // call, it is not a single-use stream.
      init.body = await request.formData();
    } else {
      const body = await request.json().catch(() => ({}));
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }
  }

  const { response: djangoResponse, refreshedAccessToken } = await fetchWithAuthRefresh(
    path,
    init,
    accessToken,
    refreshToken
  );

  // DELETE (and some 204s) come back with no body at all - NextResponse.json
  // on an empty/absent body would either throw or emit an invalid "204
  // with a JSON body" response, so those are relayed as a bare status.
  if (djangoResponse.status === 204) {
    const response = new NextResponse(null, { status: 204 });
    if (refreshedAccessToken) {
      response.cookies.set(ACCESS_COOKIE, refreshedAccessToken, {
        ...AUTH_COOKIE_OPTIONS,
        maxAge: ACCESS_COOKIE_MAX_AGE,
      });
    }
    return response;
  }

  const data = await djangoResponse.json().catch(() => null);
  const response = NextResponse.json(data, { status: djangoResponse.status });
  if (refreshedAccessToken) {
    response.cookies.set(ACCESS_COOKIE, refreshedAccessToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: ACCESS_COOKIE_MAX_AGE,
    });
  }
  return response;
}
