"use client";

import Image from "next/image";
import { normalizeBunnyUrl } from "@/lib/bunnyUrl";
import { useEffect, useRef, useState } from "react";
import type { ArticleImage } from "@/lib/types";
import { deleteArticleImage, updateArticleImage, uploadArticleImage } from "@/lib/api/reporterMutations";

/**
 * Featured image / alt text / caption management for one article -
 * always goes through the existing Django image pipeline
 * (POST /api/articles/{slug}/images/, apps.media.services.
 * ArticleImageService: validate -> optimize -> Bunny.net upload ->
 * MediaMetadata row). Never uploads to Bunny.net directly from the
 * browser.
 *
 * Admin CMS audit fix: added per-image "Replace" (upload a new file then
 * delete the old one - the backend deliberately does not support
 * replacing the file itself via PATCH, see apps.media.serializers.
 * ArticleImageSerializer.update's own comment) and inline Alt Text/
 * Caption editing on an already-uploaded image (previously only settable
 * at upload time). Both reuse the exact same mutations as the rest of
 * this component - no new endpoints.
 */
export default function ImageManager({
  slug,
  basePath = "/api/reporter/articles",
  showHeading = true,
  forceFeatured = false,
}: {
  slug: string;
  basePath?: string;
  /** Admin CMS editor supplies its own "2. Image" section heading/border - set false there to avoid a redundant nested label. Reporter surface keeps the default (true) so its existing look is unchanged. */
  showHeading?: boolean;
  /**
   * Admin CMS requirement: the Admin UI must never show a "Set as
   * featured image" control - every image an admin uploads or replaces
   * is automatically the featured/hero image. When true: the checkbox is
   * not rendered (every upload/replace always sends is_featured: true),
   * and the "Make featured" button is hidden (nothing to choose - the
   * backend, apps.media.services.ArticleImageService.upload_for_article,
   * already demotes any previously-featured image whenever is_featured:
   * true comes in, so this is still the one, same is_featured mechanism -
   * not a second featured-image system). Reporter surface keeps the
   * default (false) so its existing manual control is unchanged.
   */
  forceFeatured?: boolean;
}) {
  const [images, setImages] = useState<ArticleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [setAsFeatured, setSetAsFeatured] = useState(forceFeatured || images.length === 0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAlt, setEditAlt] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [replacingId, setReplacingId] = useState<number | null>(null);
  const [replaceBusy, setReplaceBusy] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${basePath}/${encodeURIComponent(slug)}/images`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ArticleImage[]) => {
        setImages(data);
        setSetAsFeatured(forceFeatured || data.length === 0);
      })
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [slug, basePath]);

  async function handleUpload(e?: React.FormEvent) {
    e?.preventDefault();
    if (uploading) return;
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image file first.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const result = await uploadArticleImage(
        slug,
        file,
        { alt_text: altText, caption, is_featured: forceFeatured || setAsFeatured },
        basePath
      );
      setUploading(false);
      if (!result.ok || !result.data) {
        setError(result.error || "Failed to upload image. Please try again.");
        return;
      }
      setImages((prev) => {
        const next = result.data!.is_featured ? prev.map((img) => ({ ...img, is_featured: false })) : prev;
        return [...next, result.data!];
      });
      setAltText("");
      setCaption("");
      setSetAsFeatured(forceFeatured);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploading(false);
      setError("An unexpected error occurred while uploading the image.");
      console.error("Image upload error:", err);
    }
  }

  async function handleMakeFeatured(imageId: number) {
    const result = await updateArticleImage(slug, imageId, { is_featured: true }, basePath);
    if (result.ok) {
      setImages((prev) => prev.map((img) => ({ ...img, is_featured: img.id === imageId })));
    } else {
      setError(result.error);
    }
  }

  async function handleDelete(imageId: number) {
    const result = await deleteArticleImage(slug, imageId, basePath);
    if (result.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } else {
      setError(result.error);
    }
  }

  function startEdit(image: ArticleImage) {
    setEditingId(image.id);
    setEditAlt(image.alt_text);
    setEditCaption(image.caption);
    setReplacingId(null);
  }

  async function saveEdit(imageId: number) {
    setEditSaving(true);
    setError(null);
    const result = await updateArticleImage(slug, imageId, { alt_text: editAlt, caption: editCaption }, basePath);
    setEditSaving(false);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    setImages((prev) => prev.map((img) => (img.id === imageId ? result.data! : img)));
    setEditingId(null);
  }

  function startReplace(imageId: number) {
    setReplacingId(imageId);
    setEditingId(null);
  }

  async function handleReplace(oldImage: ArticleImage) {
    const file = replaceInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a replacement image file first.");
      return;
    }
    setError(null);
    setReplaceBusy(true);
    const uploadResult = await uploadArticleImage(
      slug,
      file,
      { alt_text: oldImage.alt_text, caption: oldImage.caption, is_featured: forceFeatured || oldImage.is_featured },
      basePath
    );
    if (!uploadResult.ok || !uploadResult.data) {
      setReplaceBusy(false);
      setError(uploadResult.error);
      return;
    }
    const deleteResult = await deleteArticleImage(slug, oldImage.id, basePath);
    setReplaceBusy(false);
    if (!deleteResult.ok) {
      // The new image is already attached; surface the old-image cleanup
      // failure but keep both in the list rather than losing the new one.
      setError(deleteResult.error);
    }
    setImages((prev) => {
      const withoutOld = deleteResult.ok ? prev.filter((img) => img.id !== oldImage.id) : prev;
      return [...withoutOld, uploadResult.data!];
    });
    setReplacingId(null);
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  }

  return (
    <div className={showHeading ? "flex flex-col gap-4 border-t border-border-200 pt-5" : "flex flex-col gap-4"}>
      {showHeading && <span className="field-label">Images</span>}
      {error && <p className="field-error">{error}</p>}

      {loading ? (
        <div className="skeleton h-24 w-full" />
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {images.map((image) => (
            <div key={image.id} className="card overflow-hidden">
              <div className="relative aspect-video w-full bg-surface-50">
                <Image src={normalizeBunnyUrl(image.bunny_url)} alt={image.alt_text || ""} fill className="object-cover" sizes="320px" />
                {image.is_featured && (
                  <span className="badge absolute left-2 top-2 bg-accent-600 text-white">Featured</span>
                )}
              </div>

              <div className="flex flex-col gap-2 p-3">
                {editingId === image.id ? (
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="field-label text-xs">Alt text</span>
                      <input type="text" value={editAlt} onChange={(e) => setEditAlt(e.target.value)} className="field-input" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="field-label text-xs">Caption</span>
                      <input type="text" value={editCaption} onChange={(e) => setEditCaption(e.target.value)} className="field-input" />
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditingId(null)} disabled={editSaving} className="btn-secondary px-2.5 py-1 text-xs">
                        Cancel
                      </button>
                      <button type="button" onClick={() => saveEdit(image.id)} disabled={editSaving} className="btn-primary px-2.5 py-1 text-xs">
                        {editSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : replacingId === image.id ? (
                  <div className="flex flex-col gap-2">
                    <input ref={replaceInputRef} type="file" accept="image/*" className="field-input text-xs" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setReplacingId(null)} disabled={replaceBusy} className="btn-secondary px-2.5 py-1 text-xs">
                        Cancel
                      </button>
                      <button type="button" onClick={() => handleReplace(image)} disabled={replaceBusy} className="btn-primary px-2.5 py-1 text-xs">
                        {replaceBusy ? "Replacing..." : "Upload replacement"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-text-600">
                      <span className="font-semibold text-text-900">Alt text:</span> {image.alt_text || <span className="text-text-400">(none)</span>}
                    </p>
                    <p className="text-xs text-text-600">
                      <span className="font-semibold text-text-900">Caption:</span> {image.caption || <span className="text-text-400">(none)</span>}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {!forceFeatured && !image.is_featured && (
                        <button type="button" onClick={() => handleMakeFeatured(image.id)} className="text-xs font-semibold text-accent-600 hover:underline">
                          Make featured
                        </button>
                      )}
                      <button type="button" onClick={() => startEdit(image)} className="text-xs font-semibold text-accent-600 hover:underline">
                        Edit alt/caption
                      </button>
                      <button type="button" onClick={() => startReplace(image.id)} className="text-xs font-semibold text-accent-600 hover:underline">
                        Replace
                      </button>
                      <button type="button" onClick={() => handleDelete(image.id)} className="ml-auto text-xs font-semibold text-error-600 hover:underline">
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-400">No images uploaded yet.</p>
      )}

      <form onSubmit={handleUpload} className="flex flex-col gap-3 rounded-md border border-border-200 p-4">
        <label className="flex flex-col gap-1.5">
          <span className="field-label text-sm">Upload an image</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="field-input"
            disabled={uploading}
            // No separate submit button anywhere: choosing a file uploads it right away (same as the
            // Add Article image field). Alt text / caption / "featured" typed beforehand are attached.
            onChange={() => void handleUpload()}
          />
          <span className="text-xs text-text-400">
            {uploading
              ? "Uploading..."
              : forceFeatured
                ? "The image uploads as soon as you choose it. Type Alt text / Caption first to attach them, or use \"Edit alt/caption\" afterwards."
                : "The image uploads as soon as you choose it. Fill in Alt text / Caption (and tick \"Set as featured image\" if needed) first."}
          </span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label text-sm">Alt text</span>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describes the image for screen readers"
            className="field-input"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="field-label text-sm">Caption</span>
          <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} className="field-input" />
        </label>
        {!forceFeatured && (
          <label className="flex items-center gap-2 text-sm text-text-900">
            <input
              type="checkbox"
              checked={setAsFeatured}
              onChange={(e) => setSetAsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-border-200"
            />
            Set as featured image
          </label>
        )}

      </form>
    </div>
  );
}
