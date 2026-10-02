import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getAdvertisements } from "@/lib/api/adminClient";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AdvertisementsTable from "@/components/dashboard/AdvertisementsTable";

export const metadata: Metadata = { title: "Admin: Advertisements" };

/**
 * Admin-facing management of the apps.advertisements backend - campaign
 * name, placement, creative image upload, target URL, start/end dates,
 * priority, enabled/disabled and delete. Phase H (Admin CMS
 * continuation): create/edit now happen directly here
 * (AdvertisementFormDialog, via AdvertisementSerializer.creative_upload's
 * Bunny.net pipeline) - no Django Admin dependency for normal campaign
 * management any more.
 *
 * Advertisement form update: the creative is a file upload only - there
 * is no "paste an image URL instead" fallback on this form or in the
 * API payload it sends (image_url is read-only on
 * AdvertisementSerializer, server-computed from the upload).
 */
export default async function AdminAdvertisementsPage() {
  await requireAdmin("/admin/advertisements");
  const ads = await getAdvertisements();

  return (
    <div className="section-stack">
      <DashboardHeader eyebrow="Admin" title="Advertisements" />
      <p className="text-sm text-text-600">
        {ads.length} campaign{ads.length === 1 ? "" : "s"} total. A campaign is publicly shown only while it is
        enabled and the current time falls within its start/end dates (see the "Live" status below).
      </p>
      <AdvertisementsTable initialAds={ads} />
    </div>
  );
}
