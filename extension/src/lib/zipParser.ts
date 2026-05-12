import JSZip from "jszip";

export interface SubmissionFile {
  name: string;
  path: string; // full path within ZIP
  size: number;
  mimeType: string;
}

export interface SubmissionAssignment {
  name: string;
  files: SubmissionFile[];
}

export interface SubmissionCourse {
  id: number;
  folderName: string; // raw folder name from ZIP
  displayName: string; // cleaned, without [ARCHIVED] prefix and trailing (id)
  archived: boolean;
  assignments: SubmissionAssignment[];
  fileCount: number;
}

export interface ParsedExport {
  courses: SubmissionCourse[];
  totalFiles: number;
  importedAt: number;
}

// "[ARCHIVED] SP25 CSE 2431 - Sys 2: Oper Sys (6814)" → { id: 6814, displayName: "SP25 CSE 2431 - Sys 2: Oper Sys", archived: true }
function parseFolderName(name: string): { id: number; displayName: string; archived: boolean } | null {
  const archived = name.startsWith("[ARCHIVED]");
  const clean = archived ? name.replace(/^\[ARCHIVED\]\s*/, "") : name;
  const match = clean.match(/^(.+?)\s+\((\d+)\)$/);
  if (!match) return null;
  return {
    id: Number(match[2]),
    displayName: match[1].trim(),
    archived,
  };
}

function guessMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    zip: "application/zip",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    java: "text/x-java",
    py: "text/x-python",
    c: "text/x-c",
    cpp: "text/x-c++",
    h: "text/x-c",
    js: "text/javascript",
    ts: "text/typescript",
    html: "text/html",
    css: "text/css",
    json: "application/json",
    mp4: "video/mp4",
    mov: "video/quicktime",
  };
  return map[ext] ?? "application/octet-stream";
}

export async function parseSubmissionsZip(file: File): Promise<ParsedExport> {
  const zip = await JSZip.loadAsync(file);
  const courseMap = new Map<string, SubmissionCourse>();

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    // Skip macOS metadata files
    if (path.includes("__MACOSX") || path.includes(".DS_Store")) continue;

    const parts = path.split("/").filter(Boolean);
    // Expect: [topLevel?], courseFolderName, assignmentName, fileName
    // The ZIP may or may not have a single top-level wrapper folder.
    // Detect: if first segment parses as a course name, depth is 3; else depth is 4.

    let courseFolder: string, assignmentName: string, fileName: string;

    if (parts.length === 3 && parseFolderName(parts[0])) {
      [courseFolder, assignmentName, fileName] = parts;
    } else if (parts.length === 4) {
      // Top-level wrapper (e.g., "2026-05-11 data export/")
      [, courseFolder, assignmentName, fileName] = parts;
    } else {
      continue; // unexpected depth, skip
    }

    const parsed = parseFolderName(courseFolder);
    if (!parsed) continue;

    if (!courseMap.has(courseFolder)) {
      courseMap.set(courseFolder, {
        id: parsed.id,
        folderName: courseFolder,
        displayName: parsed.displayName,
        archived: parsed.archived,
        assignments: [],
        fileCount: 0,
      });
    }

    const course = courseMap.get(courseFolder)!;
    let assignment = course.assignments.find((a) => a.name === assignmentName);
    if (!assignment) {
      assignment = { name: assignmentName, files: [] };
      course.assignments.push(assignment);
    }

    const size = entry._data?.uncompressedSize ?? 0;
    assignment.files.push({
      name: fileName,
      path,
      size,
      mimeType: guessMime(fileName),
    });
    course.fileCount++;
  }

  const courses = Array.from(courseMap.values()).sort((a, b) =>
    a.folderName.localeCompare(b.folderName)
  );

  return {
    courses,
    totalFiles: courses.reduce((sum, c) => sum + c.fileCount, 0),
    importedAt: Date.now(),
  };
}

// Extracts a single file's bytes from the ZIP by its stored path.
export async function extractFile(file: File, path: string): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(file);
  const entry = zip.file(path);
  if (!entry) throw new Error(`File not found in ZIP: ${path}`);
  return entry.async("uint8array");
}
