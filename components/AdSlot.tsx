import Image from "next/image";
import { getActiveAdvertisements } from "@/lib/api/client";
import type { Advertisement } from "@/lib/types";
import { normalizeBunnyUrl } from "@/lib/bunnyUrl";

/**
 * Public advertisement renderer.
 *
 * Sidebar advertisement:
 *   HOME_SIDEBAR -> 280x600
 *
 * Horizontal advertisements:
 *   HOME_TOP       -> 900x180
 *   HOME_MIDDLE    -> 900x180
 *   HOME_BOTTOM    -> 900x180
 *   ARTICLE_TOP    -> 900x180
 *   ARTICLE_MIDDLE -> 900x180
 *   ARTICLE_BOTTOM -> 900x180
 *
 * The same component is reused for all advertisement placements.
 */

function isRenderableTargetUrl(
  value: string | null | undefined
): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function AdSlot({
  placement,
  className,
}: {
  placement: Advertisement["placement"];
  className?: string;
}) {
  const ads = await getActiveAdvertisements(placement);
  const ad = ads[0];

  if (!ad) return null;

  // Sidebar uses a vertical advertisement.
  const isSidebar = placement === "HOME_SIDEBAR";

  const creative = (
  <Image
    src={normalizeBunnyUrl(ad.image_url)}
    alt={ad.name}
    width={isSidebar ? 280 : 800}
    height={isSidebar ? 600 : 220}
    className={
      isSidebar
        ? "h-[600px] w-full object-cover"
        : "h-auto w-full object-cover"
    }
    sizes={
      isSidebar
        ? "280px"
        : "(max-width: 768px) 100vw, 800px"
    }
    unoptimized
  />
);
  return (
    <div
      className={
        className ??
        "flex w-full justify-center py-2"
      }
      data-ad-placement={placement}
    >
      {isRenderableTargetUrl(ad.target_url) ? (
        <a
          href={ad.target_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label={ad.name}
          className="block max-w-full overflow-hidden rounded-md"
        >
          {creative}
        </a>
      ) : (
        <div
          aria-label={ad.name}
          className="block max-w-full overflow-hidden rounded-md"
        >
          {creative}
        </div>
      )}
    </div>
  );
}