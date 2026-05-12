import lunr from "lunr";
import type { ArchiveJob } from "../types/archive";

export interface SearchDocument {
  id: string;
  type: "assignment" | "discussion" | "announcement" | "module";
  courseId: number;
  courseName: string;
  title: string;
  body: string;
  url: string; // relative to archive root
}

export interface SearchIndex {
  index: object; // serialized lunr index
  documents: Record<string, SearchDocument>;
}

// Strip HTML tags for indexing
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildSearchIndex(job: ArchiveJob): SearchIndex {
  const documents: Record<string, SearchDocument> = {};

  for (const archive of job.courses) {
    const cid = archive.courseId;
    const courseName = archive.courseName.replace(/^\[ARCHIVED\]\s*/, "");

    // Assignments (prompt + grade entry name)
    for (const grade of archive.grades) {
      const detail = archive.assignments.find(a => a.id === grade.assignmentId);
      const id = `a-${cid}-${grade.assignmentId}`;
      documents[id] = {
        id,
        type: "assignment",
        courseId: cid,
        courseName,
        title: grade.name,
        body: [
          stripHtml(detail?.descriptionHtml ?? ""),
          detail?.submissionBody ?? "",
          grade.comments.map(c => c.comment).join(" "),
        ].join(" ").slice(0, 5000),
        url: `courses/${cid}/assignments.html#a${grade.assignmentId}`,
      };
    }

    // Discussions
    for (const disc of archive.discussions) {
      const id = `d-${cid}-${disc.id}`;
      const postText = disc.posts
        .flatMap(p => [stripHtml(p.contentHtml), ...p.replies.map(r => stripHtml(r.contentHtml))])
        .join(" ")
        .slice(0, 5000);
      documents[id] = {
        id,
        type: "discussion",
        courseId: cid,
        courseName,
        title: disc.title,
        body: postText,
        url: `courses/${cid}/discussions/${disc.id}.html`,
      };
    }

    // Announcements
    for (const ann of archive.announcements) {
      const id = `n-${cid}-${ann.id}`;
      documents[id] = {
        id,
        type: "announcement",
        courseId: cid,
        courseName,
        title: ann.title,
        body: ann.posts.map(p => stripHtml(p.contentHtml)).join(" ").slice(0, 2000),
        url: `courses/${cid}/announcements/${ann.id}.html`,
      };
    }

    // Module items
    for (const mod of archive.modules) {
      for (const item of mod.items) {
        const id = `m-${cid}-${item.id}`;
        documents[id] = {
          id,
          type: "module",
          courseId: cid,
          courseName,
          title: item.title,
          body: mod.title,
          url: `courses/${cid}/modules.html`,
        };
      }
    }
  }

  const idx = lunr(function () {
    this.ref("id");
    this.field("title", { boost: 10 });
    this.field("courseName", { boost: 5 });
    this.field("body");
    this.metadataWhitelist = ["position"];

    Object.values(documents).forEach(doc => this.add(doc));
  });

  return { index: idx.toJSON(), documents };
}
