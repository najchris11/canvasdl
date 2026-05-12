import type { CanvasEnv } from "../types/canvas";
import type {
  AssignmentData,
  Discussion,
  DiscussionPost,
  GradeEntry,
  Module,
  ModuleItem,
} from "../types/archive";

// ---------------------------------------------------------------------------
// Grades page  (/courses/{id}/grades)
// ENV has assignment_groups (metadata) + submissions (scores + comments).
// DOM fills in assignment names and submission links.
// ---------------------------------------------------------------------------
export function scrapeGrades(doc: Document, env: CanvasEnv): GradeEntry[] {
  const subMap = new Map(
    (env.submissions ?? []).map((s) => [s.assignment_id, s])
  );

  // Build assignment name + link map from DOM rows
  const nameMap = new Map<string, { name: string; submissionUrl: string; due: string | null; submitted: string | null }>();
  doc.querySelectorAll<HTMLElement>("tr.student_assignment").forEach((row) => {
    const link = row.querySelector<HTMLAnchorElement>("th.title a[href]");
    if (!link) return;
    const urlMatch = link.href.match(/\/assignments\/(\d+)/);
    if (!urlMatch) return;
    const id = urlMatch[1];
    const due = row.querySelector("td.due")?.textContent?.trim() ?? null;
    const submitted = row.querySelector("td.submitted")?.textContent?.trim() ?? null;
    nameMap.set(id, {
      name: link.textContent?.trim() ?? "",
      submissionUrl: link.href,
      due: due || null,
      submitted: submitted || null,
    });
  });

  const entries: GradeEntry[] = [];
  for (const group of env.assignment_groups ?? []) {
    for (const a of group.assignments ?? []) {
      const sub = subMap.get(a.id);
      const domData = nameMap.get(a.id);
      const comments = (sub?.submission_comments ?? []).map((c) => ({
        id: c.id,
        authorName: c.author_name,
        comment: c.comment,
        createdAt: c.created_at,
      }));
      entries.push({
        assignmentId: a.id,
        name: domData?.name ?? `Assignment ${a.id}`,
        submissionUrl: domData?.submissionUrl ?? "",
        due: domData?.due ?? (a.due_at ? new Date(a.due_at).toLocaleString() : null),
        submitted: domData?.submitted ?? sub?.submitted_at ?? null,
        score: sub?.score ?? null,
        pointsPossible: a.points_possible,
        workflowState: sub?.workflow_state ?? "unsubmitted",
        submissionType: sub?.submission_type ?? a.submission_types[0] ?? null,
        groupName: group.name ?? "",
        comments,
      });
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Modules page  (/courses/{id}/modules)
// ---------------------------------------------------------------------------
export function scrapeModules(doc: Document): Module[] {
  const modules: Module[] = [];

  doc.querySelectorAll<HTMLElement>("[id^='context_module_']").forEach((el) => {
    // Skip module item containers — only top-level modules
    if (el.id.startsWith("context_module_item_")) return;

    const idMatch = el.id.match(/context_module_(\d+)$/);
    if (!idMatch) return;
    const moduleId = idMatch[1];

    const titleEl = el.querySelector(".ig-header-title");
    const title = titleEl?.textContent?.trim() ?? `Module ${moduleId}`;

    const items: ModuleItem[] = [];
    el.querySelectorAll<HTMLElement>("[id^='context_module_item_']").forEach((itemEl) => {
      const itemIdMatch = itemEl.id.match(/context_module_item_(\d+)$/);
      if (!itemIdMatch) return;

      const link = itemEl.querySelector<HTMLAnchorElement>(".ig-title, .title a, a.ig-title");
      const itemTitle = link?.textContent?.trim() ?? itemEl.querySelector(".item_name")?.textContent?.trim() ?? "";
      const url = link?.href ?? "";

      // Determine type from class list
      const classList = Array.from(itemEl.classList);
      const typeClass = classList.find((c) =>
        ["wiki_page", "attachment", "assignment", "quiz", "discussion_topic", "external_url"].some((t) => c.includes(t))
      );
      const type = typeClass?.split(/\s+/).find((c) =>
        ["wiki_page", "attachment", "assignment", "quiz", "discussion_topic", "external_url"].includes(c)
      ) ?? "item";

      const dueDate = itemEl.querySelector(`#module-item-${itemIdMatch[1]}-due-date`)?.textContent?.trim() ?? null;

      items.push({ id: itemIdMatch[1], title: itemTitle, type, url, dueDate: dueDate || null });
    });

    modules.push({ id: moduleId, title, items });
  });

  return modules;
}

// ---------------------------------------------------------------------------
// Assignment list  (/courses/{id}/assignments)
// Returns stubs; each will be visited individually for full data.
// ---------------------------------------------------------------------------
export function scrapeAssignmentList(doc: Document): { id: string; name: string; url: string }[] {
  const results: { id: string; name: string; url: string }[] = [];
  const seen = new Set<string>();

  doc.querySelectorAll<HTMLAnchorElement>("a[href*='/assignments/']").forEach((a) => {
    const match = a.href.match(/\/assignments\/(\d+)(?:\/|$)/);
    if (!match || seen.has(match[1])) return;
    // Exclude submission links
    if (a.href.includes("/submissions/")) return;
    seen.add(match[1]);
    results.push({
      id: match[1],
      name: a.textContent?.trim() ?? `Assignment ${match[1]}`,
      url: a.href,
    });
  });

  return results;
}

// ---------------------------------------------------------------------------
// Assignment detail  (/courses/{id}/assignments/{id})
// ---------------------------------------------------------------------------
export function scrapeAssignment(doc: Document, env: CanvasEnv, url: string): AssignmentData {
  const idMatch = url.match(/\/assignments\/(\d+)/);
  const id = idMatch?.[1] ?? "";

  const name =
    doc.querySelector("h1.title")?.textContent?.trim() ??
    doc.querySelector(".assignment-title")?.textContent?.trim() ??
    doc.title.split(":")[0].trim();

  const descEl =
    doc.getElementById("assignments-2-assignment-description") ??
    doc.getElementById("assignment_description") ??
    doc.querySelector(".description.user_content");
  const descriptionHtml = descEl?.innerHTML?.trim() ?? "";

  const sub = env.SUBMISSION;
  return {
    id,
    name,
    url,
    descriptionHtml,
    score: sub?.submission?.score ?? null,
    pointsPossible: sub?.points_possible ?? null,
    submittedAt: sub?.submission?.submitted_at ?? null,
    submissionType: sub?.submission?.submission_type ?? null,
    submissionBody: sub?.submission?.body ?? null,
  };
}

// ---------------------------------------------------------------------------
// Discussion list  (/courses/{id}/discussion_topics)
// ---------------------------------------------------------------------------
export function scrapeDiscussionList(doc: Document): { id: string; title: string; url: string }[] {
  const results: { id: string; title: string; url: string }[] = [];
  const seen = new Set<string>();

  doc.querySelectorAll<HTMLAnchorElement>("a[href*='/discussion_topics/']").forEach((a) => {
    const match = a.href.match(/\/discussion_topics\/(\d+)(?:\/|$)/);
    if (!match || seen.has(match[1])) return;
    seen.add(match[1]);
    const title = a.querySelector(".discussion-title, .title")?.textContent?.trim()
      ?? a.textContent?.trim()
      ?? `Discussion ${match[1]}`;
    results.push({ id: match[1], title, url: a.href });
  });

  return results;
}

// ---------------------------------------------------------------------------
// Discussion thread  (/courses/{id}/discussion_topics/{id})
// Handles flat + nested posts. Pagination detected via DOM.
// ---------------------------------------------------------------------------
export function scrapeDiscussion(doc: Document, url: string): Discussion {
  const idMatch = url.match(/\/discussion_topics\/(\d+)/);
  const id = idMatch?.[1] ?? "";
  const title =
    doc.querySelector("h1.discussion-title")?.textContent?.trim() ??
    doc.querySelector(".discussion-title")?.textContent?.trim() ??
    doc.title.trim();

  function extractPost(el: Element): DiscussionPost {
    const entryId = el.getAttribute("data-entry-id") ?? el.id ?? "";
    const authorEl = el.querySelector<HTMLElement>("[data-testid='author_avatar'], .author");
    const authorName = authorEl?.getAttribute("name") ?? authorEl?.textContent?.trim() ?? "Unknown";
    const contentEl = el.querySelector<HTMLElement>("[data-testid='post-message-container'], .message");
    const contentHtml = contentEl?.innerHTML?.trim() ?? "";
    const dateStr = el.getAttribute("aria-label")?.match(/from (.+)$/)?.[1] ?? "";

    // Recurse into direct child reply wrappers
    const replies: DiscussionPost[] = [];
    el.querySelectorAll<Element>("[data-entry-wrapper-id]").forEach((child) => {
      // Only direct children (not deeply nested — they'll have their own wrappers)
      if (child.closest("[data-entry-id]") !== el) return;
      replies.push(extractPost(child));
    });

    return { id: entryId, authorName, contentHtml, createdAt: dateStr, replies };
  }

  const posts: DiscussionPost[] = [];
  doc.querySelectorAll<Element>("[data-entry-id]").forEach((el) => {
    // Only top-level entries (not nested inside another entry)
    if (!el.parentElement?.closest("[data-entry-id]")) {
      posts.push(extractPost(el));
    }
  });

  // Detect total pages
  const pageButtons = doc.querySelectorAll(".discussion-pagination-section button[data-page], .pagination button");
  const totalPages = pageButtons.length > 0
    ? Math.max(...Array.from(pageButtons).map((b) => Number(b.textContent?.trim()) || 1))
    : 1;

  return { id, title, url, posts, totalPages };
}

// ---------------------------------------------------------------------------
// Announcements page  (/courses/{id}/announcements)
// Announcements list — each card links to a discussion-style detail page.
// ---------------------------------------------------------------------------
export function scrapeAnnouncementList(doc: Document): { id: string; title: string; url: string }[] {
  const results: { id: string; title: string; url: string }[] = [];
  const seen = new Set<string>();

  // Announcements use the same discussion_topics URL pattern
  doc.querySelectorAll<HTMLAnchorElement>("a[href*='/discussion_topics/']").forEach((a) => {
    const match = a.href.match(/\/discussion_topics\/(\d+)(?:\/|$)/);
    if (!match || seen.has(match[1])) return;
    seen.add(match[1]);
    const title = a.querySelector(".discussion-title, .title")?.textContent?.trim()
      ?? a.textContent?.trim()
      ?? `Announcement ${match[1]}`;
    results.push({ id: match[1], title, url: a.href });
  });

  return results;
}

// ---------------------------------------------------------------------------
// Detect which page type we're on from the URL
// ---------------------------------------------------------------------------
export type PageType =
  | "grades"
  | "modules"
  | "assignment_list"
  | "assignment"
  | "discussion_list"
  | "discussion"
  | "announcements"
  | "unknown";

export function detectPageType(url: string): PageType {
  const path = new URL(url).pathname;
  if (/\/grades\s*$/.test(path)) return "grades";
  if (/\/modules\s*$/.test(path)) return "modules";
  if (/\/assignments\/\d+/.test(path)) return "assignment";
  if (/\/assignments\s*$/.test(path)) return "assignment_list";
  if (/\/discussion_topics\/\d+/.test(path)) return "discussion";
  if (/\/discussion_topics\s*$/.test(path)) return "discussion_list";
  if (/\/announcements/.test(path)) return "announcements";
  return "unknown";
}
