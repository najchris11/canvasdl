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
  user_id: string;
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
  context_asset_string?: string;
  // Gradebook page
  submissions?: GradebookSubmission[];
  assignment_groups?: AssignmentGroup[];
  // Wiki/Pages page
  wiki_page?: {
    title: string;
    body: string;
    url: string;
    updated_at?: string;
    created_at?: string;
  };
}

export interface GradebookSubmission {
  assignment_id: string;
  score?: number;
  workflow_state?: string;
  submission_type?: string;
  submitted_at?: string;
  excused?: boolean;
  submission_comments?: {
    id: string;
    author_name: string;
    comment: string;
    created_at: string;
  }[];
}

export interface AssignmentGroup {
  id: string;
  name?: string;
  group_weight?: number;
  assignments: {
    id: string;
    points_possible: number;
    due_at: string | null;
    submission_types: string[];
    omit_from_final_grade: boolean;
  }[];
}

// Messages between content script ↔ background ↔ popup
export type ExtMessage =
  | { type: "ENV_CAPTURED"; env: CanvasEnv; url: string }
  | { type: "COURSES_SCRAPED"; courses: CanvasCourse[] }
  | { type: "GET_TAB_STATE"; tabId: number }
  | { type: "TAB_STATE"; state: TabState | null }
  | { type: "START_ARCHIVE"; courseIds: number[]; baseUrl: string }
  | { type: "SCRAPE_PAGE" }
  | { type: "SCRAPE_RESULT"; data: ScrapeResult }
  | { type: "GET_JOB_STATE" }
  | { type: "JOB_STATE"; job: import("./archive").ArchiveJob | null }
  | { type: "ARCHIVE_DONE"; downloadUrl: string }
  | { type: "FETCH_FILE"; url: string }
  | { type: "FILE_BYTES"; bytes: Uint8Array | null; error?: string };

export type ScrapeResult =
  | { page: "grades"; data: import("./archive").GradeEntry[] }
  | { page: "modules"; data: import("./archive").Module[] }
  | { page: "assignment"; data: import("./archive").AssignmentData }
  | { page: "assignment_list"; data: { id: string; name: string; url: string }[] }
  | { page: "discussion"; data: import("./archive").Discussion }
  | { page: "discussion_list"; data: { id: string; title: string; url: string }[] }
  | { page: "announcements"; data: import("./archive").Discussion[] }
  | { page: "quiz_preview"; data: import("./archive").QuizData }
  | { page: "files"; data: import("./archive").CourseFile[] }
  | { page: "page_list"; data: { slug: string; title: string; url: string }[] }
  | { page: "page"; data: import("./archive").CoursePage }
  | { page: "unknown"; data: null };

export interface TabState {
  url: string;
  env: CanvasEnv;
  courses: CanvasCourse[];
  capturedAt: number;
}
