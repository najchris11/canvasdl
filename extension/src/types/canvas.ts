export interface CanvasCourse {
  id: number;
  assetString: string; // "course_206252"
  shortName: string;
  longName: string;
  href: string;
  color?: string;
  status: "active" | "archived";
  term?: string;
}

export interface CanvasSubmission {
  assignment_id: string;
  points_possible: number;
  submission: {
    grade: string | null;
    score: number | null;
    submitted_at: string | null;
    graded_at: string | null;
    submission_type: string | null;
    attempt: number;
    body: string | null;
  };
}

export interface CanvasEnv {
  current_user_id: string;
  current_user_global_id?: string;
  current_user_email?: string;
  STUDENT_PLANNER_COURSES?: Omit<CanvasCourse, "status">[];
  PREFERENCES?: { custom_colors?: Record<string, string> };
  SUBMISSION?: CanvasSubmission;
  COURSE_ID?: number;
  context_asset_string?: string; // e.g. "course_206252"
}

// Messages between content script ↔ background ↔ popup
export type ExtMessage =
  | { type: "ENV_CAPTURED"; env: CanvasEnv; url: string }
  | { type: "COURSES_SCRAPED"; courses: CanvasCourse[] }
  | { type: "GET_TAB_STATE"; tabId: number }
  | { type: "TAB_STATE"; state: TabState | null }
  | { type: "START_ARCHIVE"; courseIds: number[] }
  | { type: "ARCHIVE_PROGRESS"; courseId: number; step: string; pct: number }
  | { type: "ARCHIVE_DONE"; outputUrl: string };

export interface TabState {
  url: string;
  env: CanvasEnv;
  courses: CanvasCourse[];
  capturedAt: number;
}
