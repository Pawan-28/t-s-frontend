import { NextRequest } from "next/server";
import { reporterProxy } from "@/lib/auth/reporterProxy";

interface Params {
  params: { slug: string; imageId: string };
}

/**
 * PATCH  /api/reporter/articles/{slug}/images/{imageId} - metadata-only
 *        edit (alt_text/caption/is_featured/display_order). Replacing the
 *        image file itself is not supported here, matching Django's own
 *        ArticleImageSerializer.update(), which silently drops an `image`
 *        field on PATCH by design - upload a new image and delete the old
 *        one instead.
 * DELETE /api/reporter/articles/{slug}/images/{imageId} - remove an
 *        uploaded image (e.g. the reporter picked the wrong file).
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  return reporterProxy(
    request,
    `/articles/${encodeURIComponent(params.slug)}/images/${encodeURIComponent(params.imageId)}/`,
    "PATCH"
  );
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return reporterProxy(
    request,
    `/articles/${encodeURIComponent(params.slug)}/images/${encodeURIComponent(params.imageId)}/`,
    "DELETE"
  );
}
