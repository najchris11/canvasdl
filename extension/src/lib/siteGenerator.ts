import JSZip from "jszip";
import lunrMinJs from "lunr/lunr.min.js?raw";
import type { ArchiveJob } from "../types/archive";
import type { ParsedExport } from "./zipParser";
import {
  CSS,
  courseListPage,
  courseIndexPage,
  assignmentsPage,
  gradesPage,
  modulesPage,
  discussionListPage,
  discussionPage,
  buildSearchHtml,
} from "./htmlTemplates";
import { buildSearchIndex } from "./searchIndexer";

export async function generateArchiveSite(
  job: ArchiveJob,
  exportData: ParsedExport | null,
  submissionFileLoader?: (path: string) => Promise<Uint8Array | null>
): Promise<Uint8Array> {
  const zip = new JSZip();

  // Shared CSS
  zip.file("assets/style.css", CSS);

  // Root index
  zip.file("index.html", courseListPage(job));

  // Search — build index across all courses, embed inline in search.html
  const { index, documents } = buildSearchIndex(job);
  zip.file(
    "search.html",
    buildSearchHtml(
      JSON.stringify(index),
      JSON.stringify(documents),
      lunrMinJs
    )
  );

  for (const archive of job.courses) {
    const id = archive.courseId;
    const base = `courses/${id}`;

    zip.file(`${base}/index.html`, courseIndexPage(archive, exportData));
    zip.file(`${base}/assignments.html`, assignmentsPage(archive, exportData));
    zip.file(`${base}/grades.html`, gradesPage(archive));
    zip.file(`${base}/modules.html`, modulesPage(archive));

    zip.file(`${base}/discussions/index.html`, discussionListPage(archive, "discussions"));
    for (const disc of archive.discussions) {
      zip.file(`${base}/discussions/${disc.id}.html`, discussionPage(disc, archive, "discussions"));
    }

    zip.file(`${base}/announcements/index.html`, discussionListPage(archive, "announcements"));
    for (const ann of archive.announcements) {
      zip.file(`${base}/announcements/${ann.id}.html`, discussionPage(ann, archive, "announcements"));
    }

    // Submission files from ZIP
    if (submissionFileLoader && exportData) {
      const zipCourse = exportData.courses.find(c => c.id === id);
      if (zipCourse) {
        for (const assignment of zipCourse.assignments) {
          for (const file of assignment.files) {
            const bytes = await submissionFileLoader(file.path);
            if (bytes) {
              const safeName = assignment.name.replace(/[/\\?*:|"<>]/g, "_");
              zip.file(`${base}/files/${safeName}/${file.name}`, bytes);
            }
          }
        }
      }
    }
  }

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
}
