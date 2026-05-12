export interface InstructorComment {
  id: string;
  authorName: string;
  comment: string;
  createdAt: string;
}

export interface GradeEntry {
  assignmentId: string;
  name: string;
  submissionUrl: string;
  due: string | null;
  submitted: string | null;
  score: number | null;
  pointsPossible: number | null;
  workflowState: string;
  submissionType: string | null;
  groupName: string;
  comments: InstructorComment[];
}

export interface AssignmentData {
  id: string;
  name: string;
  url: string;
  descriptionHtml: string;
  score: number | null;
  pointsPossible: number | null;
  submittedAt: string | null;
  submissionType: string | null;
  submissionBody: string | null; // text submissions
}

export interface ModuleItem {
  id: string;
  title: string;
  type: string;
  url: string;
  dueDate: string | null;
}

export interface Module {
  id: string;
  title: string;
  items: ModuleItem[];
}

export interface DiscussionPost {
  id: string;
  authorName: string;
  contentHtml: string;
  createdAt: string;
  replies: DiscussionPost[];
}

export interface Discussion {
  id: string;
  title: string;
  url: string;
  posts: DiscussionPost[];
  totalPages: number;
}

export interface CourseArchive {
  courseId: number;
  courseName: string;
  scrapedAt: number;
  grades: GradeEntry[];
  modules: Module[];
  assignments: AssignmentData[];
  discussions: Discussion[];
  announcements: Discussion[];
}

export interface ArchiveJob {
  id: string;
  courseIds: number[];
  status: "running" | "done" | "error";
  currentCourseId: number | null;
  step: string;
  completedCourses: number;
  totalCourses: number;
  errorMessage?: string;
  courses: CourseArchive[];
}
