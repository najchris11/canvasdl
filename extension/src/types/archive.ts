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

export interface QuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
  isSelected: boolean;
  matchLeft?: string;
  matchRight?: string;
  comment?: string;
}

export interface QuizQuestion {
  id: string;
  type: string;
  questionText: string;
  correct: boolean | null;
  pointsEarned: number | null;
  pointsPossible: number | null;
  answers: QuizAnswer[];
}

export interface QuizData {
  questions: QuizQuestion[];
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
  submissionBody: string | null;
  quizPreviewUrl: string | null;
  quizData: QuizData | null;
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

export interface CourseFile {
  id: string;
  name: string;
  contentType: string;
  sizeBytes: number;
  sizeLabel: string;
  updatedAt: string;
  downloadUrl: string;
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
  files: CourseFile[];
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
