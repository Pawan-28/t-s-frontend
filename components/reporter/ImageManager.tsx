"use client";

import Image from "next/image";
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
 */
export default function ImageManager({ slug }: { slug: string }) {
  const [images, setImages] = useState<ArticleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [setAsFeatured, setSetAsFeatured] = useState(images.length === 0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/reporter/articles/${encodeURIComponent(slug)}/images`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ArticleImage[]) => {
        setImages(data);
        setSetAsFeatured(data.length === 0);
      })
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image file first.");
      return;
    }
    setError(null);
    setUploading(true);
    const result = await uploadArticleImage(slug, file, {
      alt_text: altText,
      caption,
      is_featured: setAsFeatured,
    });
    setUploading(false);
    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }
    setImages((prev) => {
      const next = result.data!.is_featured ? prev.map((img) => ({ ...img, is_featured: false })) : prev;
      return [...next, result.data!];
    });
    setAltText("");
    setCaption("");
    setSetAsFeatured(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleMakeFeatured(imageId: number) {
    const result = await updateArticleImage(slug, imageId, { is_featured: true });
    if (result.ok) {
      setImages((prev) => prev.map((img) => ({ ...img, is_featured: img.id === imageId })));
    } else {
      setError(result.error);
    }
  }

  async function handleDelete(imageId: number) {
    const result = await deleteArticleImage(slug, imageId);
    if (result.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border-200 pt-5">
      <span className="field-label">Images</span>
      {error && <p className="field-error">{error}</p>}

      {loading ? (
        <div className="skeleton h-24 w-full" />
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="card overflow-hidden">
              <div className="relative aspect-video w-full bg-surface-50">
                <Image src={image.bunny_url} alt={image.alt_text || ""} fill className="object-cover" sizes="200px" />
                {image.is_featured && (
                  <span className="badge absolute left-2 top-2 bg-accent-600 text-white">Featured</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                {!image.is_featured && (
                  <button
                    type="button"
                    onClick={() => handleMakeFeatured(image.id)}
                    className="text-xs font-semibold text-accent-600 hover:underline"
                  >
                    Make featured
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(image.id)}
                  className="ml-auto text-xs font-semibold text-error-600 hover:underline"
                >
                  Remove
                </button>
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
          <input ref={fileInputRef} type="file" accept="image/*" className="field-input" />
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
        <label className="flex items-center gap-2 text-sm text-text-900">
          <input
            type="checkbox"
            checked={setAsFeatured}
            onChange={(e) => setSetAsFeatured(e.target.checked)}
            className="h-4 w-4 rounded border-border-200"
          />
          Set as featured image
        </label>
        <button type="submit" disabled={uploading} className="btn-secondary self-start">
          {uploading ? "Uploading..." : "Upload image"}
        </button>
      </form>
    </div>
  );
}
