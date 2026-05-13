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

function persistTabState(tabId: number, state: TabState) {
  chrome.storage.session?.set({ [`tabState_${tabId}`]: state }).catch(() => {});
}

async function loadPersistedTabState(tabId: number): Promise<TabState | null> {
  try {
    const result = await chrome.storage.session?.get(`tabState_${tabId}`);
    return (result?.[`tabState_${tabId}`] as TabState) ?? null;
  } catch {
    return null;
  }
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
      const state: TabState = { url: msg.url, env: msg.env, courses: merged, capturedAt: Date.now() };
      tabStates.set(tabId, state);
      persistTabState(tabId, state);
      updateBadge(tabId, merged);
    }

    if (msg.type === "COURSES_SCRAPED") {
      if (tabId == null) return;
      const prev = tabStates.get(tabId);
      const merged = mergeCourses(prev?.courses ?? [], msg.courses);
      const state: TabState = {
        url: prev?.url ?? "",
        env: prev?.env ?? { current_user_id: "" },
        courses: merged,
        capturedAt: Date.now(),
      };
      tabStates.set(tabId, state);
      persistTabState(tabId, state);
      updateBadge(tabId, merged);
    }

    if (msg.type === "GET_TAB_STATE") {
      const inMemory = tabStates.get(msg.tabId);
      if (inMemory) {
        sendResponse({ type: "TAB_STATE", state: inMemory } satisfies ExtMessage);
      } else {
        loadPersistedTabState(msg.tabId).then((state) => {
          if (state) tabStates.set(msg.tabId, state);
          sendResponse({ type: "TAB_STATE", state: state ?? null } satisfies ExtMessage);
        });
        return true;
      }
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
  chrome.storage.session?.remove(`tabState_${tabId}`).catch(() => {});
});
