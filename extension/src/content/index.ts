import type { CanvasCourse, CanvasEnv, ExtMessage } from "../types/canvas";

function injectScript() {
  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("src/injected/index.js");
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);
}

// Scrapes the /courses page for the full course list including past enrollments.
// The dashboard ENV only returns ~7 favorited courses; this table has everything.
function scrapeCoursesPage(): CanvasCourse[] {
  const courses: CanvasCourse[] = [];

  // Active/current courses — data-course-id on the favoriting span
  document.querySelectorAll<HTMLElement>("[data-course-id]").forEach((el) => {
    const id = Number(el.dataset.courseId);
    const name = el.dataset.courseName ?? "";
    if (!id || courses.some((c) => c.id === id)) return;
    const href = `/courses/${id}`;
    courses.push({
      id,
      assetString: `course_${id}`,
      shortName: name,
      longName: name,
      href,
      status: "active",
    });
  });

  // Past/archived enrollments — server-rendered table, IDs live in the href
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
      const termEl = row?.querySelector("td.course-list-term-column");
      const term = termEl?.textContent?.trim() ?? undefined;

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

function init() {
  // Relay ENV from the main world
  window.addEventListener("canvasdl:env", (e: Event) => {
    const env = (e as CustomEvent<CanvasEnv | null>).detail;
    if (!env) return;
    chrome.runtime.sendMessage({ type: "ENV_CAPTURED", env, url: location.href } satisfies ExtMessage).catch(() => {});
  });

  injectScript();

  // If we're on the /courses page, also scrape the full course list
  if (/\/courses\s*$/.test(location.pathname.replace(/\/$/, ""))) {
    const courses = scrapeCoursesPage();
    if (courses.length > 0) {
      chrome.runtime.sendMessage({ type: "COURSES_SCRAPED", courses } satisfies ExtMessage).catch(() => {});
    }
  }
}

init();
