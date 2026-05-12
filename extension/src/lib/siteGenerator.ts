import JSZip from "jszip";
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
} from "./htmlTemplates";

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

  for (const archive of job.courses) {
    const id = archive.courseId;
    const base = `courses/${id}`;

    // Course index
    zip.file(`${base}/index.html`, courseIndexPage(archive, exportData));

    // Assignments
    zip.file(`${base}/assignments.html`, assignmentsPage(archive, exportData));

    // Grades
    zip.file(`${base}/grades.html`, gradesPage(archive));

    // Modules
    zip.file(`${base}/modules.html`, modulesPage(archive));

    // Discussions
    zip.file(`${base}/discussions/index.html`, discussionListPage(archive, "discussions"));
    for (const disc of archive.discussions) {
      zip.file(
        `${base}/discussions/${disc.id}.html`,
        discussionPage(disc, archive, "discussions")
      );
    }

    // Announcements
    zip.file(`${base}/announcements/index.html`, discussionListPage(archive, "announcements"));
    for (const ann of archive.announcements) {
      zip.file(
        `${base}/announcements/${ann.id}.html`,
        discussionPage(ann, archive, "announcements")
      );
    }

    // Submission files from ZIP (if loader provided)
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
