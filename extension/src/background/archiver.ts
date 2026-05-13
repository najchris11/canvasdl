import type { ArchiveJob, CourseArchive } from "../types/archive";
import type { CanvasCourse, ExtMessage, ScrapeResult } from "../types/canvas";
import { loadExportMeta, loadFileBytes, saveArchiveZip, saveFileBytes } from "../lib/storage";
import { generateArchiveSite } from "../lib/siteGenerator";

type QueueItem = { url: string; courseId: number; purpose: string };

let activeJob: ArchiveJob | null = null;

export function getActiveJob(): ArchiveJob | null {
  return activeJob;
}

export async function startArchive(
  courseIds: number[],
  courses: CanvasCourse[],
  baseUrl: string // e.g. "https://osu.instructure.com"
): Promise<void> {
  if (activeJob?.status === "running") return;

  activeJob = {
    id: Date.now().toString(),
    courseIds,
    status: "running",
    currentCourseId: null,
    step: "Starting...",
    completedCourses: 0,
    totalCourses: courseIds.length,
    courses: [],
  };

  broadcastJobState();

  // Open a dedicated scraping tab (active: false keeps it in background)
  const tab = await chrome.tabs.create({ url: "about:blank", active: false });
  const tabId = tab.id!;

  try {
    for (const courseId of courseIds) {
      const course = courses.find((c) => c.id === courseId);
      const courseName = course?.shortName ?? `Course ${courseId}`;

      activeJob.currentCourseId = courseId;
      activeJob.step = `${courseName}: loading grades`;
      broadcastJobState();

      const archive = await scrapeCourse(tabId, courseId, courseName, baseUrl);
      activeJob.courses.push(archive);
      activeJob.completedCourses++;
      broadcastJobState();
    }

    activeJob.step = "Generating archive...";
    broadcastJobState();

    const exportMeta = await loadExportMeta();
    const fileLoader = async (path: string) => {
      const bytes = await loadFileBytes(path);
      return bytes ?? null;
    };
    const zipBytes = await generateArchiveSite(activeJob, exportMeta ?? null, fileLoader);
    await saveArchiveZip(zipBytes);

    activeJob.status = "done";
    activeJob.step = "Complete";
  } catch (err) {
    activeJob.status = "error";
    activeJob.errorMessage = err instanceof Error ? err.message : String(err);
  } finally {
    chrome.tabs.remove(tabId).catch(() => {});
    broadcastJobState();
  }
}

async function scrapeCourse(
  tabId: number,
  courseId: number,
  courseName: string,
  baseUrl: string
): Promise<CourseArchive> {
  const archive: CourseArchive = {
    courseId,
    courseName,
    scrapedAt: Date.now(),
    grades: [],
    modules: [],
    assignments: [],
    discussions: [],
    announcements: [],
    files: [],
  };

  const base = `${baseUrl}/courses/${courseId}`;

  // 1. Grades (one page — gives all assignment metadata + scores from ENV)
  await visit(tabId, `${base}/grades`, courseName, "loading grades");
  const gradesResult = await scrapeTab(tabId);
  if (gradesResult.page === "grades") archive.grades = gradesResult.data;

  // 2. Modules
  await visit(tabId, `${base}/modules`, courseName, "loading modules");
  const modulesResult = await scrapeTab(tabId);
  if (modulesResult.page === "modules") archive.modules = modulesResult.data;

  // 3. Assignment list → then each assignment detail (+ quiz preview if applicable)
  await visit(tabId, `${base}/assignments`, courseName, "loading assignments");
  const listResult = await scrapeTab(tabId);
  if (listResult.page === "assignment_list") {
    const assignmentStubs = listResult.data;
    for (let i = 0; i < assignmentStubs.length; i++) {
      const stub = assignmentStubs[i];
      setStep(`${courseName}: assignment ${i + 1}/${assignmentStubs.length}`);
      await visit(tabId, stub.url, courseName, `assignment ${i + 1}/${assignmentStubs.length}`);
      const result = await scrapeTab(tabId);
      if (result.page === "assignment") {
        const assignment = result.data;
        if (assignment.quizPreviewUrl) {
          setStep(`${courseName}: quiz ${i + 1}/${assignmentStubs.length}`);
          await visit(tabId, assignment.quizPreviewUrl, courseName, `quiz ${i + 1}/${assignmentStubs.length}`);
          const quizResult = await scrapeTab(tabId);
          if (quizResult.page === "quiz_preview") {
            assignment.quizData = quizResult.data;
          }
        }
        archive.assignments.push(assignment);
      }
    }
  }

  // 4. Discussion list → each thread
  await visit(tabId, `${base}/discussion_topics`, courseName, "loading discussions");
  const discListResult = await scrapeTab(tabId);
  if (discListResult.page === "discussion_list") {
    const topics = discListResult.data;
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      setStep(`${courseName}: discussion ${i + 1}/${topics.length}`);
      await visit(tabId, topic.url, courseName, `discussion ${i + 1}/${topics.length}`);
      const result = await scrapeTab(tabId);
      if (result.page === "discussion") {
        const disc = result.data;
        // Scrape additional pages if paginated
        for (let p = 2; p <= disc.totalPages; p++) {
          const pageUrl = `${topic.url}?page=${p}`;
          await visit(tabId, pageUrl, courseName, `discussion ${i + 1} page ${p}`);
          const pageResult = await scrapeTab(tabId);
          if (pageResult.page === "discussion") {
            disc.posts.push(...pageResult.data.posts);
          }
        }
        archive.discussions.push(disc);
      }
    }
  }

  // 5. Files page — scrape list + download each file
  await visit(tabId, `${base}/files`, courseName, "loading files");
  const filesResult = await scrapeTab(tabId);
  if (filesResult.page === "files") {
    archive.files = filesResult.data;
    for (let i = 0; i < archive.files.length; i++) {
      const file = archive.files[i];
      setStep(`${courseName}: downloading file ${i + 1}/${archive.files.length} — ${file.name}`);
      const bytes = await fetchCourseFile(tabId, file.downloadUrl);
      if (bytes) {
        await saveFileBytes(`course_file/${courseId}/${file.id}`, bytes);
      }
    }
  }

  // 6. Announcements list → each thread
  await visit(tabId, `${base}/announcements`, courseName, "loading announcements");
  const annListResult = await scrapeTab(tabId);
  if (annListResult.page === "announcements") {
    for (let i = 0; i < annListResult.data.length; i++) {
      const ann = annListResult.data[i];
      setStep(`${courseName}: announcement ${i + 1}/${annListResult.data.length}`);
      await visit(tabId, ann.url, courseName, `announcement ${i + 1}`);
      const result = await scrapeTab(tabId);
      if (result.page === "discussion") archive.announcements.push(result.data);
    }
  }

  return archive;
}

function setStep(step: string) {
  if (activeJob) {
    activeJob.step = step;
    broadcastJobState();
  }
}

async function visit(tabId: number, url: string, courseName: string, step: string): Promise<void> {
  setStep(`${courseName}: ${step}`);
  await new Promise<void>((resolve) => {
    const listener = (id: number, info: chrome.tabs.TabChangeInfo) => {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.update(tabId, { url });
  });
  // Small pause for React hydration on heavy pages
  await delay(400);
}

async function fetchCourseFile(tabId: number, url: string): Promise<Uint8Array | null> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "FETCH_FILE", url } satisfies ExtMessage);
    if (response?.type === "FILE_BYTES" && response.bytes) {
      return new Uint8Array(response.bytes);
    }
  } catch {
    // Content script unavailable or fetch failed
  }
  return null;
}

async function scrapeTab(tabId: number): Promise<ScrapeResult> {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "SCRAPE_PAGE" } satisfies ExtMessage);
    if (response?.type === "SCRAPE_RESULT") return response.data;
  } catch {
    // Tab may have navigated away or content script not ready
  }
  return { page: "unknown", data: null };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function broadcastJobState() {
  // Save job state so popup can poll it
  saveJobState(activeJob);
  // Also push to any open popups
  chrome.runtime
    .sendMessage({ type: "JOB_STATE", job: activeJob } satisfies ExtMessage)
    .catch(() => {});
}

// Store job state in chrome.storage.session (cleared on browser restart)
function saveJobState(job: ArchiveJob | null) {
  chrome.storage.session?.set({ archiveJob: job }).catch(() => {});
}

export async function loadJobState(): Promise<ArchiveJob | null> {
  try {
    const result = await chrome.storage.session?.get("archiveJob");
    return (result?.archiveJob as ArchiveJob) ?? null;
  } catch {
    return null;
  }
}

// Called when download is requested after job completes
export function getJobData(): ArchiveJob | null {
  return activeJob;
}

