import type { CanvasCourse, ExtMessage, TabState } from "../types/canvas";
import { startArchive, getActiveJob, loadJobState } from "./archiver";

const tabStates = new Map<number, TabState>();

function mergeCourses(existing: CanvasCourse[], incoming: CanvasCourse[]): CanvasCourse[] {
  const map = new Map<number, CanvasCourse>(existing.map((c) => [c.id, c]));
  for (const c of incoming) {
    if (!map.has(c.id)) map.set(c.id, c);
  }
  return Array.from(map.values());
}

function updateBadge(tabId: number, courses: CanvasCourse[]) {
  if (courses.length === 0) return;
  chrome.action.setBadgeText({ text: String(courses.length), tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#E66000", tabId });
}

chrome.runtime.onMessage.addListener(
  (msg: ExtMessage, sender, sendResponse) => {
    const tabId = sender.tab?.id;

    if (msg.type === "ENV_CAPTURED") {
      if (tabId == null) return;
      const activeCourses: CanvasCourse[] = (msg.env.STUDENT_PLANNER_COURSES ?? []).map((c) => ({
        ...c,
        status: "active" as const,
      }));
      const prev = tabStates.get(tabId);
      const merged = mergeCourses(prev?.courses ?? [], activeCourses);
      tabStates.set(tabId, {
        url: msg.url,
        env: msg.env,
        courses: merged,
        capturedAt: Date.now(),
      });
      updateBadge(tabId, merged);
    }

    if (msg.type === "COURSES_SCRAPED") {
      if (tabId == null) return;
      const prev = tabStates.get(tabId);
      const merged = mergeCourses(prev?.courses ?? [], msg.courses);
      tabStates.set(tabId, {
        url: prev?.url ?? "",
        env: prev?.env ?? { current_user_id: "" },
        courses: merged,
        capturedAt: Date.now(),
      });
      updateBadge(tabId, merged);
    }

    if (msg.type === "GET_TAB_STATE") {
      sendResponse({ type: "TAB_STATE", state: tabStates.get(msg.tabId) ?? null } satisfies ExtMessage);
      return true;
    }

    if (msg.type === "START_ARCHIVE") {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab?.id) return;
        const state = tabStates.get(tab.id);
        const courses = state?.courses ?? [];
        startArchive(msg.courseIds, courses, msg.baseUrl).catch(console.error);
      });
    }

    if (msg.type === "GET_JOB_STATE") {
      const job = getActiveJob();
      if (job) {
        sendResponse({ type: "JOB_STATE", job } satisfies ExtMessage);
      } else {
        // Fall back to session storage (handles popup-reopen case)
        loadJobState().then((stored) => {
          sendResponse({ type: "JOB_STATE", job: stored } satisfies ExtMessage);
        });
        return true;
      }
    }
  }
);

chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});
