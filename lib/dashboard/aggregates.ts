import type { Article, ArticleStatus } from "@/lib/types";

/**
 * Shared, purely-client-side tallying over an already-fetched Article[]
 * list - the same "walk the real API response and count" approach the
 * Reporter dashboard originated (see lib/api/reporterClient.ts's
 * getDashboardData doc comment), extracted here so the Admin dashboard
 * can reuse it instead of re-deriving the same counts differently. These
 * never invent a number: every count is real data from Article rows the
 * caller's own role was actually allowed to fetch.
 */

export const ALL_STATUSES: ArticleStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "REJECTED",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
];

export function countByStatus(articles: Article[]): Record<ArticleStatus, number> {
  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<ArticleStatus, number>;
  for (const article of articles) counts[article.status] += 1;
  return counts;
}

export interface NamedCount {
  label: string;
  value: number;
}

/** Groups by category name (falls back to "Uncategorized" for a legacy article with no category at all), sorted descending. */
export function countByCategory(articles: Article[]): NamedCount[] {
  const map = new Map<string, number>();
  for (const article of articles) {
    const label = article.category?.name ?? "Uncategorized";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

/** Groups by industry name - uses the article's derived `industry` (Article.effective_industry on the backend), which already covers the "subcategory pending" fallback correctly. */
export function countByIndustry(articles: Article[]): NamedCount[] {
  const map = new Map<string, number>();
  for (const article of articles) {
    const label = article.industry?.name ?? "Unassigned";
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export interface ReporterPerformanceRow {
  reporterId: number;
  reporterName: string;
  authored: number;
  published: number;
  pendingReview: number;
  currentlyAssigned: number;
}

/**
 * One row per person who has authored at least one article, plus
 * "currently assigned" tallied separately from `assigned_reporter` (a
 * reporter can be assigned to review someone else's article without
 * having authored anything themselves, so that count is folded in by id
 * even for a reporter with zero authored rows).
 */
export function summarizeReporterPerformance(articles: Article[]): ReporterPerformanceRow[] {
  const rows = new Map<number, ReporterPerformanceRow>();

  function rowFor(id: number, name: string): ReporterPerformanceRow {
    let row = rows.get(id);
    if (!row) {
      row = { reporterId: id, reporterName: name, authored: 0, published: 0, pendingReview: 0, currentlyAssigned: 0 };
      rows.set(id, row);
    }
    return row;
  }

  for (const article of articles) {
    const author = rowFor(article.author.id, article.author.full_name || article.author.email);
    author.authored += 1;
    if (article.status === "PUBLISHED") author.published += 1;
    if (article.status === "SUBMITTED" || article.status === "UNDER_REVIEW") author.pendingReview += 1;

    if (article.assigned_reporter) {
      const assignee = rowFor(
        article.assigned_reporter.id,
        article.assigned_reporter.full_name || article.assigned_reporter.email
      );
      if (article.status === "UNDER_REVIEW") assignee.currentlyAssigned += 1;
    }
  }

  return [...rows.values()].sort((a, b) => b.authored - a.authored);
}
