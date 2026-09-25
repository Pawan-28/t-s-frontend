"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Article, Category, Industry, Subcategory, Tag } from "@/lib/types";
import { fetchActiveIndustries, fetchCategoriesByIndustry, fetchSubcategoriesByCategory, fetchTags } from "@/lib/api/taxonomyClient";
import { createArticle, updateArticle, createTag, type ArticlePayload } from "@/lib/api/reporterMutations";
import { useArticleEditor } from "./RichTextEditor";
import RichTextEditor from "./RichTextEditor";
import ImageManager from "./ImageManager";

const ACCESS_LEVELS: { value: ArticlePayload["access_level"]; label: string }[] = [
  { value: "PUBLIC", label: "Public" },
  { value: "SUBSCRIBER_ONLY", label: "Subscriber Only" },
  { value: "RESTRICTED", label: "Restricted" },
];

export default function ArticleForm({
  mode,
  article,
}: {
  mode: "create" | "edit";
  article?: Article;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [accessLevel, setAccessLevel] = useState<ArticlePayload["access_level"]>(article?.access_level ?? "PUBLIC");

  const [industrySlug, setIndustrySlug] = useState(article?.industry?.slug ?? "");
  const [categorySlug, setCategorySlug] = useState(article?.category?.slug ?? "");
  const [subcategorySlug, setSubcategorySlug] = useState(article?.subcategory?.slug ?? "");

  const [selectedTags, setSelectedTags] = useState<Tag[]>(article?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const editor = useArticleEditor(content, setContent);

  useEffect(() => {
    fetchActiveIndustries().then(setIndustries).catch(() => setIndustries([]));
  }, []);

  useEffect(() => {
    if (!industrySlug) {
      setCategories([]);
      return;
    }
    fetchCategoriesByIndustry(industrySlug).then(setCategories).catch(() => setCategories([]));
  }, [industrySlug]);

  useEffect(() => {
    if (!categorySlug) {
      setSubcategories([]);
      return;
    }
    fetchSubcategoriesByCategory(categorySlug).then(setSubcategories).catch(() => setSubcategories([]));
  }, [categorySlug]);

  // Editing an existing article: once its taxonomy lists have loaded,
  // resolve which Industry a pre-set Category/Subcategory belongs to, so
  // the cascading selects start populated instead of empty.
  useEffect(() => {
    if (mode === "edit" && article?.industry && !industrySlug) {
      setIndustrySlug(article.industry.slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, article]);

  useEffect(() => {
    if (tagInput.trim().length < 2) {
      setTagOptions([]);
      return;
    }
    const handle = setTimeout(() => {
      fetchTags(tagInput.trim()).then(setTagOptions).catch(() => setTagOptions([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [tagInput]);

  const canPickSubcategory = Boolean(categorySlug);

  async function addExistingTag(tag: Tag) {
    if (selectedTags.some((t) => t.id === tag.id)) return;
    setSelectedTags((prev) => [...prev, tag]);
    setTagInput("");
    setTagOptions([]);
  }

  async function addNewTag() {
    const name = tagInput.trim();
    if (!name) return;
    const existing = tagOptions.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      addExistingTag(existing);
      return;
    }
    const result = await createTag(name);
    if (result.ok && result.data) {
      addExistingTag(result.data);
    } else {
      setError(result.error);
    }
  }

  function removeTag(id: number) {
    setSelectedTags((prev) => prev.filter((t) => t.id !== id));
  }

  function buildPayload(): ArticlePayload {
    return {
      title,
      content,
      excerpt,
      slug: slug || undefined,
      subcategory_slug: subcategorySlug,
      tag_slugs: selectedTags.map((t) => t.slug),
      access_level: accessLevel,
    };
  }

  async function handleSaveDraft() {
    setError(null);
    setSavedMessage(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!subcategorySlug) {
      setError("Choose an industry, category and subcategory before saving.");
      return;
    }
    if (!content || content === "<p></p>") {
      setError("Content cannot be blank.");
      return;
    }

    setSaving(true);
    const payload = buildPayload();
    const result =
      mode === "create" ? await createArticle(payload) : await updateArticle(article!.slug, payload);
    setSaving(false);

    if (!result.ok || !result.data) {
      setError(result.error);
      return;
    }

    if (mode === "create") {
      router.push(`/reporter/articles/${result.data.slug}/edit`);
      return;
    }
    setSavedMessage(article?.status === "DRAFT" ? "Draft saved." : "Changes saved.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="field-error">{error}</p>}
      {savedMessage && (
        <p className="rounded-md border border-success-600/20 bg-success-600/5 px-3 py-2 text-sm text-success-600">
          {savedMessage}
        </p>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="field-input"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">
          Slug <span className="font-normal text-text-400">(optional - auto-generated from the title if left blank)</span>
        </span>
        <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="field-input" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Excerpt</span>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className="field-input resize-y"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="field-label">Content</span>
        <RichTextEditor editor={editor} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Industry</span>
          <select
            value={industrySlug}
            onChange={(e) => {
              setIndustrySlug(e.target.value);
              setCategorySlug("");
              setSubcategorySlug("");
            }}
            className="field-input"
          >
            <option value="">Select an industry</option>
            {industries.map((i) => (
              <option key={i.slug} value={i.slug}>
                {i.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="field-label">Category</span>
          <select
            value={categorySlug}
            onChange={(e) => {
              setCategorySlug(e.target.value);
              setSubcategorySlug("");
            }}
            className="field-input"
            disabled={!industrySlug}
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="field-label">Subcategory</span>
          <select
            value={subcategorySlug}
            onChange={(e) => setSubcategorySlug(e.target.value)}
            className="field-input"
            disabled={!canPickSubcategory}
            required
          >
            <option value="">Select a subcategory</option>
            {subcategories.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="field-label">Tags</span>
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span key={tag.id} className="badge bg-surface-50 text-text-600">
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                aria-label={`Remove tag ${tag.name}`}
                className="ml-1 text-text-400 hover:text-error-600"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <div className="relative flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addNewTag();
              }
            }}
            placeholder="Type to search or create a tag, then press Enter"
            className="field-input"
          />
          {tagOptions.length > 0 && (
            <ul className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border-200 bg-surface-0 shadow-sm">
              {tagOptions.map((tag) => (
                <li key={tag.id}>
                  <button
                    type="button"
                    onClick={() => addExistingTag(tag)}
                    className="block w-full px-3 py-2 text-left text-sm text-text-900 hover:bg-surface-50"
                  >
                    {tag.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <label className="flex flex-col gap-1.5 sm:w-64">
        <span className="field-label">Access level</span>
        <select
          value={accessLevel}
          onChange={(e) => setAccessLevel(e.target.value as ArticlePayload["access_level"])}
          className="field-input"
        >
          {ACCESS_LEVELS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {mode === "edit" && article ? (
        <ImageManager slug={article.slug} />
      ) : (
        <p className="rounded-md border border-border-200 bg-surface-50 px-3 py-2.5 text-sm text-text-400">
          Save this draft first to add a featured image, alt text and caption.
        </p>
      )}

      <div className="flex gap-3 border-t border-border-200 pt-5">
        <button type="button" onClick={handleSaveDraft} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : mode === "create" || article?.status === "DRAFT" ? "Save Draft" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
