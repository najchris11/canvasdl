import type { CanvasCourse, ExtMessage, TabState } from "../types/canvas";

const tabStates = new Map<number, TabState>();

// Merges ENV active courses + DOM-scraped full list, deduplicating by ID.
function mergeCourses(existing: CanvasCourse[], incoming: CanvasCourse[]): CanvasCourse[] {
  const map = new Map<number, CanvasCourse>(existing.map((c) => [c.id, c]));
  for (const c of incoming) {
    if (!map.has(c.id)) map.set(c.id, c);
  }
  return Array.from(map.values());
}

function updateBadge(tabId: number, courses: CanvasCourse[]) {
  const count = courses.length;
  if (count === 0) return;
  chrome.action.setBadgeText({ text: String(count), tabId });
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
      const state = tabStates.get(msg.tabId) ?? null;
      sendResponse({ type: "TAB_STATE", state } satisfies ExtMessage);
      return true;
    }
  }
);

chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});
