"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { AdvertisementAdminRow } from "@/lib/types";
import { extractApiError } from "@/lib/api/apiError";
import { normalizeBunnyUrl } from "@/lib/bunnyUrl";
import FormDialog from "./FormDialog";

const PLACEMENTS: AdvertisementAdminRow["placement"][] = [
  // "HOME_TOP",
  "HOME_MIDDLE",
  "HOME_SIDEBAR",
  "HOME_BOTTOM",
  "ARTICLE_TOP",
  "ARTICLE_MIDDLE",
  "ARTICLE_BOTTOM",
];

const PLACEMENT_LABEL: Record<AdvertisementAdminRow["placement"], string> = {
  HOME_TOP: "Home - Top",
  HOME_MIDDLE: "Home - Middle",
  HOME_SIDEBAR: "Home - Sidebar",
  HOME_BOTTOM: "Home - Bottom",
  ARTICLE_TOP: "Article - Top",
  ARTICLE_MIDDLE: "Article - Middle",
  ARTICLE_BOTTOM: "Article - Bottom",
};

// Matches config/settings.py's TIME_ZONE = env("DJANGO_TIME_ZONE", default=
// "Asia/Kolkata") - the backend's own configured timezone, and the one
// Advertisement.start_at/end_at are conceptually authored in. Deliberately
// NOT the browser's local timezone: an admin in any other timezone must
// still see and pick dates/times as the project's own timezone, per the
// explicit requirement not to silently default to UTC/browser time.
const PROJECT_TZ = "Asia/Kolkata";

/**
 * The UTC offset (in minutes, tzTime - utcTime) that `timeZone` was
 * observing at the instant `date`. IANA zones with DST would need this
 * recomputed per-instant - Asia/Kolkata has none, but the calculation
 * itself stays correct even if PROJECT_TZ is ever changed to a
 * DST-observing zone.
 */
function getTzOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  // formatToParts renders "24" for midnight in some locales/engines instead
  // of "00" - normalize before feeding it to Date.UTC.
  const hour = map.hour === "24" ? "00" : map.hour;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(hour),
    Number(map.minute),
    Number(map.second)
  );
  return (asUTC - date.getTime()) / 60000;
}

/** A UTC ISO instant -> the {date, time} it displays as in PROJECT_TZ. */
function isoToTzParts(iso: string): { date: string; time: string } {
  const instant = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PROJECT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const hour = map.hour === "24" ? "00" : map.hour;
  return { date: `${map.year}-${map.month}-${map.day}`, time: `${hour}:${map.minute}` };
}

/** A {date, time} pair, entered as wall-clock in PROJECT_TZ -> the UTC ISO instant to send to the backend. */
function tzPartsToIso(date: string, time: string): string {
  // First guess the instant as if the entered wall-clock were already
  // UTC, find PROJECT_TZ's offset at (approximately) that instant, then
  // shift by that offset to get the real UTC instant. Since PROJECT_TZ
  // has no DST this is exact; for a DST zone it is correct to within the
  // rare spring-forward/fall-back hour, same tradeoff every browser-only
  // (no timezone library) implementation makes.
  const guess = new Date(`${date}T${time}:00Z`);
  const offsetMinutes = getTzOffsetMinutes(guess, PROJECT_TZ);
  return new Date(guess.getTime() - offsetMinutes * 60000).toISOString();
}

/** "Now", as wall-clock date/time in PROJECT_TZ - the default for a brand-new campaign's Start fields. */
function nowInTz(): { date: string; time: string } {
  return isoToTzParts(new Date().toISOString());
}

/** `daysFromNow` days from now, as wall-clock date/time in PROJECT_TZ - the default for a brand-new campaign's End fields. */
function daysFromNowInTz(days: number): { date: string; time: string } {
  return isoToTzParts(new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString());
}

/**
 * Create/edit form for one Advertisement campaign.
 *
 * Advertisement form update: the creative is uploaded as a file ONLY -
 * there is no "or paste an image URL instead" field or fallback any
 * more, on this form or in the payload it sends. AdvertisementSerializer.
 * creative_upload runs the file through the exact same Bunny.net
 * validate -> process -> upload pipeline apps.advertisements.admin.
 * AdvertisementAdminForm already used; image_url itself is read-only on
 * that serializer now (server-computed only from a real upload). A new
 * campaign requires a file; editing an existing one only needs a new
 * file when actually replacing the creative - otherwise the existing
 * stored image (shown as a preview below, when editing) is left as is.
 *
 * End-to-end Advertisement fix (this pass):
 * - Target URL is now optional - the Create/Save button no longer
 *   requires it, matching Advertisement.target_url's `blank=True` on
 *   the backend. Leaving it blank makes AdSlot render this campaign as
 *   a non-clickable container on the public site.
 * - Start/End are now four distinct, always-visible fields (Start Date,
 *   Start Time, End Date, End Time) instead of one native
 *   `datetime-local` input each, satisfying the explicit requirement
 *   that an admin see date AND time separately before saving. All four
 *   are interpreted/defaulted in the project's configured timezone
 *   (Asia/Kolkata - see PROJECT_TZ above), never the browser's local
 *   timezone, via the isoToTzParts/tzPartsToIso helpers. The backend
 *   has no model-level default for start_at/end_at (confirmed by
 *   inspection), so a brand-new campaign defaults Start to right now
 *   and End to 7 days from now, both in PROJECT_TZ - both remain fully
 *   editable before saving.
 * - Placement list gained HOME_BOTTOM and renamed SIDEBAR to
 *   HOME_SIDEBAR (see apps.advertisements.models.Advertisement.
 *   Placement's own comment for why this is a rename, not a new
 *   addition).
 */
export default function AdvertisementFormDialog({
  open,
  editing,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: AdvertisementAdminRow | null;
  onClose: () => void;
  onSaved: (ad: AdvertisementAdminRow) => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [placement, setPlacement] = useState<AdvertisementAdminRow["placement"]>(editing?.placement ?? "HOME_TOP");
  const [targetUrl, setTargetUrl] = useState(editing?.target_url ?? "");

  const initialStart = editing ? isoToTzParts(editing.start_at) : nowInTz();
  const initialEnd = editing ? isoToTzParts(editing.end_at) : daysFromNowInTz(7);
  const [startDate, setStartDate] = useState(initialStart.date);
  const [startTime, setStartTime] = useState(initialStart.time);
  const [endDate, setEndDate] = useState(initialEnd.date);
  const [endTime, setEndTime] = useState(initialEnd.time);

  const [priority, setPriority] = useState(String(editing?.priority ?? 0));
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A freshly-picked local file gets its own object URL for preview,
  // created/revoked in lockstep with `file` so it never leaks; it takes
  // priority over the existing stored creative while set.
  useEffect(() => {
    if (!file) {
      setFilePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const previewUrl = filePreviewUrl ?? (editing?.image_url ? normalizeBunnyUrl(editing.image_url) : null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("placement", placement);
    // Blank is valid and intentional (Target URL is optional) - never
    // substitute a fake URL just because the field is empty.
    formData.set("target_url", targetUrl.trim());
    formData.set("start_at", tzPartsToIso(startDate, startTime));
    formData.set("end_at", tzPartsToIso(endDate, endTime));
    formData.set("priority", priority || "0");
    formData.set("is_active", isActive ? "true" : "false");
    if (file) {
      formData.set("creative_upload", file);
    }

    try {
      const res = await fetch(editing ? `/api/admin/advertisements/${editing.id}` : "/api/admin/advertisements", {
        method: editing ? "PATCH" : "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(extractApiError(data, "Could not save this campaign."));
        return;
      }
      onSaved(data as AdvertisementAdminRow);
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog open={open} title={editing ? "Edit Campaign" : "New Campaign"} onClose={onClose}>
      {error && <p className="field-error">{error}</p>}
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Campaign name</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="field-input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Placement</span>
        <select value={placement} onChange={(e) => setPlacement(e.target.value as AdvertisementAdminRow["placement"])} className="field-input">
          {PLACEMENTS.map((p) => (
            <option key={p} value={p}>
              {PLACEMENT_LABEL[p]}
            </option>
          ))}
        </select>
      </label>
      {previewUrl && (
        <div className="relative h-32 w-full overflow-hidden rounded-md border border-border-200 bg-surface-50">
          <Image src={previewUrl} alt="Creative preview" fill className="object-contain" sizes="480px" unoptimized={Boolean(filePreviewUrl)} />
        </div>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="field-label">
          {editing ? "Replace creative image" : "Creative image upload"}
        </span>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="field-input" />
        {editing && <span className="text-xs text-text-400">Leave blank to keep the current image shown above.</span>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Target URL (optional)</span>
        <input type="text" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://... (leave blank for a non-clickable ad)" className="field-input" />
      </label>
      <div>
        <p className="field-label mb-1.5">Schedule (times are in the site's timezone, {PROJECT_TZ})</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-text-400">Start date</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field-input" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-text-400">Start time</span>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="field-input" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-text-400">End date</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="field-input" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-text-400">End time</span>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="field-input" />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Priority</span>
          <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className="field-input" />
        </label>
        <label className="flex items-center gap-2 pt-6 text-sm text-text-900">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-border-200" />
          Enabled
        </label>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={saving || !name || !startDate || !startTime || !endDate || !endTime || (!editing && !file)}
        >
          {saving ? "Saving..." : editing ? "Save Changes" : "Create Campaign"}
        </button>
      </div>
    </FormDialog>
  );
}
