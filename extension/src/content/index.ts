import type { CanvasCourse, CanvasEnv, ExtMessage, ScrapeResult } from "../types/canvas";
import {
  detectPageType,
  scrapeAssignment,
  scrapeAssignmentList,
  scrapeAnnouncementList,
  scrapeDiscussion,
  scrapeDiscussionList,
  scrapeFileList,
  scrapeGrades,
  scrapeModules,
  scrapePage,
  scrapePageList,
  scrapeQuizPreview,
} from "../lib/scrapers";

let capturedEnv: CanvasEnv | null = null;

function injectScript() {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("src/injected/index.js");
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);
}

function scrapeCoursesPage(): CanvasCourse[] {
  const courses: CanvasCourse[] = [];

  document.querySelectorAll<HTMLElement>("[data-course-id]").forEach((el) => {
    const id = Number(el.dataset.courseId);
    const name = el.dataset.courseName ?? "";
    if (!id || courses.some((c) => c.id === id)) return;
    courses.push({
      id,
      assetString: `course_${id}`,
      shortName: name,
      longName: name,
      href: `/courses/${id}`,
      status: "active",
    });
  });

  const table = document.getElementById("past_enrollments_table");
  if (table) {
    table.querySelectorAll<HTMLAnchorElement>("td.course-list-course-title-column a[href]").forEach((a) => {
      const match = a.href.match(/\/courses\/(\d+)/);
      if (!match) return;
      const id = Number(match[1]);
      if (courses.some((c) => c.id === id)) return;
      const nameEl = a.querySelector("span.name");
      const name = nameEl?.textContent?.trim() ?? a.title ?? "";
      const row = a.closest("tr");
      const term = row?.querySelector("td.course-list-term-column")?.textContent?.trim();
      courses.push({
        id,
        assetString: `course_${id}`,
        shortName: name,
        longName: name,
        href: `/courses/${id}`,
        status: "archived",
        term: term || undefined,
      });
    });
  }

  return courses;
}

function handleScrapePage(): ScrapeResult {
  const url = location.href;
  const env = capturedEnv ?? {};
  const pageType = detectPageType(url);

  switch (pageType) {
    case "grades":
      return { page: "grades", data: scrapeGrades(document, env) };
    case "modules":
      return { page: "modules", data: scrapeModules(document) };
    case "assignment_list":
      return { page: "assignment_list", data: scrapeAssignmentList(document) };
    case "assignment":
      return { page: "assignment", data: scrapeAssignment(document, env, url) };
    case "discussion_list":
      return { page: "discussion_list", data: scrapeDiscussionList(document) };
    case "discussion":
      return { page: "discussion", data: scrapeDiscussion(document, url) };
    case "quiz_preview":
      return { page: "quiz_preview", data: scrapeQuizPreview(document) };
    case "files":
      return { page: "files", data: scrapeFileList(document) };
    case "page_list":
      return { page: "page_list", data: scrapePageList(document) };
    case "page":
      return { page: "page", data: scrapePage(document, env, url) };
    case "announcements":
      return { page: "announcements", data: scrapeAnnouncementList(document).map((d) => ({
        ...d, posts: [], totalPages: 0
      })) };
    default:
      return { page: "unknown", data: null };
  }
}

function init() {
  window.addEventListener("canvasdl:env", (e: Event) => {
    capturedEnv = (e as CustomEvent<CanvasEnv | null>).detail;
    if (!capturedEnv) return;
    chrome.runtime.sendMessage({
      type: "ENV_CAPTURED",
      env: capturedEnv,
      url: location.href,
    } satisfies ExtMessage).catch(() => {});
  });

  injectScript();

  if (/\/courses\s*$/.test(location.pathname.replace(/\/$/, ""))) {
    const courses = scrapeCoursesPage();
    if (courses.length > 0) {
      chrome.runtime.sendMessage({ type: "COURSES_SCRAPED", courses } satisfies ExtMessage).catch(() => {});
    }
  }

  chrome.runtime.onMessage.addListener((msg: ExtMessage, _sender, sendResponse) => {
    if (msg.type === "SCRAPE_PAGE") {
      const respond = () => {
        const result = handleScrapePage();
        sendResponse({ type: "SCRAPE_RESULT", data: result } satisfies ExtMessage);
      };
      if (capturedEnv) {
        respond();
      } else {
        const timeout = setTimeout(respond, 2000);
        window.addEventListener("canvasdl:env", () => {
          clearTimeout(timeout);
          respond();
        }, { once: true });
      }
      return true;
    }

    if (msg.type === "FETCH_FILE") {
      const MAX_BYTES = 50 * 1024 * 1024; // 50 MB limit
      (async () => {
        try {
          // HEAD first to check size
          const head = await fetch(msg.url, { method: "HEAD" });
          const len = Number(head.headers.get("Content-Length") ?? 0);
          if (len > MAX_BYTES) {
            sendResponse({ type: "FILE_BYTES", bytes: null, error: "too_large" } satisfies ExtMessage);
            return;
          }
          const resp = await fetch(msg.url);
          if (!resp.ok) {
            sendResponse({ type: "FILE_BYTES", bytes: null, error: resp.statusText } satisfies ExtMessage);
            return;
          }
          const buf = await resp.arrayBuffer();
          if (buf.byteLength > MAX_BYTES) {
            sendResponse({ type: "FILE_BYTES", bytes: null, error: "too_large" } satisfies ExtMessage);
            return;
          }
          sendResponse({ type: "FILE_BYTES", bytes: new Uint8Array(buf) } satisfies ExtMessage);
        } catch (e) {
          sendResponse({ type: "FILE_BYTES", bytes: null, error: String(e) } satisfies ExtMessage);
        }
      })();
      return true;
    }
  });
}

init();
