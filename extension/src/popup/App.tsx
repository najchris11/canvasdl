import { useCallback, useEffect, useRef, useState } from "react";
import type { ArchiveJob } from "../types/archive";
import type { CanvasCourse, ExtMessage, TabState } from "../types/canvas";
import { parseSubmissionsZip, iterateFileBytes } from "../lib/zipParser";
import { loadExportMeta, loadArchiveZip, saveExportMeta, saveFileBytes } from "../lib/storage";
import type { ParsedExport } from "../lib/zipParser";

type CanvasStatus = "loading" | "not-canvas" | "ready";
type Tab = "archive" | "import";
type ImportStatus = "idle" | "parsing" | "done" | "error";

export default function App() {
  const [canvasStatus, setCanvasStatus] = useState<CanvasStatus>("loading");
  const [tabState, setTabState] = useState<TabState | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showArchived, setShowArchived] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("archive");
  const [exportData, setExportData] = useState<ParsedExport | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importError, setImportError] = useState("");
  const [extractProgress, setExtractProgress] = useState<{ done: number; total: number } | null>(null);
  const [job, setJob] = useState<ArchiveJob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollJobState = useCallback(() => {
    chrome.runtime.sendMessage({ type: "GET_JOB_STATE" } satisfies ExtMessage, (res: ExtMessage) => {
      if (res?.type === "JOB_STATE") setJob(res.job);
    });
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) { setCanvasStatus("not-canvas"); return; }
      chrome.runtime.sendMessage(
        { type: "GET_TAB_STATE", tabId: tab.id } satisfies ExtMessage,
        (res: ExtMessage) => {
          if (res?.type === "TAB_STATE" && res.state) {
            setTabState(res.state);
            setSelected(new Set(res.state.courses.map((c) => c.id)));
            setCanvasStatus("ready");
          } else {
            setCanvasStatus("not-canvas");
          }
        }
      );
    });

    loadExportMeta().then((d) => { if (d) setExportData(d); });
    pollJobState();

    // Listen for live job updates broadcast from background
    const listener = (msg: ExtMessage) => {
      if (msg.type === "JOB_STATE") setJob(msg.job);
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [pollJobState]);

  // Poll while job is running (background may not be able to push to popup)
  useEffect(() => {
    if (job?.status === "running") {
      pollRef.current = setInterval(pollJobState, 800);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [job?.status, pollJobState]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("parsing");
    setImportError("");
    setExtractProgress(null);
    try {
      const parsed = await parseSubmissionsZip(file);
      await saveExportMeta(parsed);
      setExportData(parsed);

      // Extract and store all file bytes so they can be bundled into the archive
      const total = parsed.totalFiles;
      let done = 0;
      setExtractProgress({ done: 0, total });
      for await (const { path, bytes } of iterateFileBytes(file)) {
        await saveFileBytes(path, bytes);
        done++;
        // Update every 5 files to avoid excessive re-renders
        if (done % 5 === 0 || done === total) setExtractProgress({ done, total });
      }

      setImportStatus("done");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Unknown error");
      setImportStatus("error");
    } finally {
      setExtractProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function downloadArchive() {
    const bytes = await loadArchiveZip();
    if (!bytes) return;
    const blob = new Blob([bytes], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `canvasdl-archive-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  function startArchive() {
    if (selected.size === 0) return;
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.url) return;
      const { origin } = new URL(tab.url);
      chrome.runtime.sendMessage({
        type: "START_ARCHIVE",
        courseIds: Array.from(selected),
        baseUrl: origin,
      } satisfies ExtMessage);
      setJob({
        id: Date.now().toString(),
        courseIds: Array.from(selected),
        status: "running",
        currentCourseId: null,
        step: "Starting...",
        completedCourses: 0,
        totalCourses: selected.size,
        courses: [],
      });
    });
  }

  function toggleCourse(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allCourses = tabState?.courses ?? [];
  const active = allCourses.filter((c) => c.status === "active");
  const archived = allCourses.filter((c) => c.status === "archived");
  const visibleCourses = showArchived ? allCourses : active;
  const user = tabState?.env.current_user_email ?? "";
  const onCoursesPage = /\/courses\s*$/.test((tabState?.url ?? "").replace(/\/$/, ""));
  const isRunning = job?.status === "running";

  return (
    <div className="flex flex-col bg-white text-canvas-dark" style={{ width: 360 }}>
      {/* Header */}
      <div className="bg-canvas-dark px-4 py-3 flex items-center gap-2">
        <div className="w-6 h-6 bg-canvas-red rounded flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">C</span>
        </div>
        <span className="text-white font-semibold tracking-wide flex-1">CanvasDL</span>
        {user && <span className="text-gray-400 text-xs truncate max-w-40">{user}</span>}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["archive", "import"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors
              ${activeTab === t ? "border-b-2 border-canvas-red text-canvas-red" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "import" ? "Import Submissions" : "Archive Courses"}
          </button>
        ))}
      </div>

      {/* ── Archive tab ── */}
      {activeTab === "archive" && (
        <>
          {/* Active job progress */}
          {job && (job.status === "running" || job.status === "done" || job.status === "error") && (
            <div className={`px-4 py-3 border-b border-gray-100 ${
              job.status === "error" ? "bg-red-50" : job.status === "done" ? "bg-green-50" : "bg-blue-50"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">
                  {job.status === "done" ? "Archive complete" :
                   job.status === "error" ? "Error" : "Archiving..."}
                </span>
                <span className="text-xs text-gray-500">
                  {job.completedCourses}/{job.totalCourses}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    job.status === "error" ? "bg-red-400" : "bg-canvas-red"
                  }`}
                  style={{ width: `${(job.completedCourses / Math.max(job.totalCourses, 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 truncate">{job.step}</p>
              {job.status === "error" && (
                <p className="text-xs text-red-600 mt-1">{job.errorMessage}</p>
              )}
            </div>
          )}

          {canvasStatus === "loading" && (
            <div className="flex items-center justify-center text-sm text-gray-500 p-8">Checking page...</div>
          )}

          {canvasStatus === "not-canvas" && (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
              <p className="text-sm font-medium text-gray-700">Not on Canvas</p>
              <p className="text-xs text-gray-400">
                Navigate to your Canvas dashboard or{" "}
                <a href="https://osu.instructure.com/courses" target="_blank" rel="noreferrer"
                  className="text-canvas-red underline">/courses</a>{" "}
                to get started.
              </p>
            </div>
          )}

          {canvasStatus === "ready" && (
            <>
              {!onCoursesPage && archived.length === 0 && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                  <p className="text-xs text-amber-700">
                    Visit{" "}
                    <a href="https://osu.instructure.com/courses" target="_blank" rel="noreferrer"
                      className="underline font-medium">osu.instructure.com/courses</a>{" "}
                    to load your full course history.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 gap-2">
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-500">
                    {active.length} active{archived.length > 0 && `, ${archived.length} archived`}
                  </span>
                  {archived.length > 0 && (
                    <button onClick={() => setShowArchived((v) => !v)}
                      className="text-xs text-gray-400 hover:text-gray-600">
                      {showArchived ? "hide archived" : "show archived"}
                    </button>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setSelected(new Set(visibleCourses.map((c) => c.id)))}
                    className="text-xs text-canvas-red hover:underline">All</button>
                  <button onClick={() => setSelected(new Set())}
                    className="text-xs text-gray-400 hover:underline">None</button>
                </div>
              </div>

              <ul className="overflow-y-auto divide-y divide-gray-50 max-h-56">
                {visibleCourses.map((course) => (
                  <CourseRow key={course.id} course={course} checked={selected.has(course.id)}
                    isRunning={isRunning}
                    isCurrent={job?.currentCourseId === course.id}
                    isDone={job?.courses.some((c) => c.courseId === course.id) ?? false}
                    hasSubmissions={exportData?.courses.some((c) => c.id === course.id) ?? false}
                    onToggle={() => !isRunning && toggleCourse(course.id)} />
                ))}
              </ul>

              <div className="px-4 py-3 border-t border-gray-100 flex flex-col gap-2">
                {exportData && (
                  <p className="text-xs text-gray-400">
                    Submissions loaded: {exportData.courses.length} courses, {exportData.totalFiles} files
                  </p>
                )}
                {job?.status === "done" && (
                  <button
                    onClick={downloadArchive}
                    className="w-full bg-green-600 text-white text-sm font-semibold py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Download Archive (.zip)
                  </button>
                )}
                <button
                  onClick={job?.status === "done" ? () => { setJob(null); startArchive(); } : startArchive}
                  disabled={selected.size === 0 || isRunning}
                  className={`w-full text-sm font-semibold py-2 rounded transition-colors
                    disabled:opacity-40 disabled:cursor-not-allowed
                    ${job?.status === "done"
                      ? "border border-canvas-red text-canvas-red hover:bg-orange-50"
                      : "bg-canvas-red text-white hover:bg-orange-700"}`}
                >
                  {isRunning
                    ? `Archiving ${job.completedCourses}/${job.totalCourses}...`
                    : `Archive ${selected.size > 0 ? `${selected.size} ` : ""}${selected.size === 1 ? "Course" : "Courses"}`}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Import tab ── */}
      {activeTab === "import" && (
        <div className="p-4 flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800 mb-1">Import submissions export</p>
            <p className="text-xs text-gray-500">
              On Canvas go to <span className="font-mono bg-gray-100 px-1 rounded">Account → Settings → Download Submissions</span> and import the ZIP here.
            </p>
          </div>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200
                     rounded-lg py-6 px-4 cursor-pointer hover:border-canvas-red hover:bg-orange-50
                     transition-colors text-center">
            <span className="text-2xl mb-2">📦</span>
            {importStatus === "parsing"
              ? <div className="flex flex-col items-center gap-1">
                  <span className="text-sm text-gray-500">
                    {extractProgress
                      ? `Extracting files… ${extractProgress.done}/${extractProgress.total}`
                      : "Parsing ZIP…"}
                  </span>
                  {extractProgress && (
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-canvas-red rounded-full transition-all"
                        style={{ width: `${(extractProgress.done / Math.max(extractProgress.total, 1)) * 100}%` }} />
                    </div>
                  )}
                </div>
              : <>
                  <span className="text-sm font-medium text-gray-700">Click to select ZIP file</span>
                  <span className="text-xs text-gray-400 mt-1">submissions_export.zip</span>
                </>
            }
            <input ref={fileRef} type="file" accept=".zip" className="hidden"
              onChange={handleFileChange} disabled={importStatus === "parsing"} />
          </label>

          {importStatus === "error" && (
            <p className="text-xs text-red-600 bg-red-50 rounded p-2">{importError}</p>
          )}

          {exportData && (
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  {importStatus === "done" ? "Import complete" : "Previously imported"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(exportData.importedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="px-3 py-2 grid grid-cols-3 gap-2 text-center">
                <Stat label="Courses" value={exportData.courses.length} />
                <Stat label="Assignments" value={exportData.courses.reduce((s, c) => s + c.assignments.length, 0)} />
                <Stat label="Files" value={exportData.totalFiles} />
              </div>
              <ul className="divide-y divide-gray-50 max-h-40 overflow-y-auto">
                {exportData.courses.map((c) => (
                  <li key={c.id} className="px-3 py-1.5 flex items-center justify-between">
                    <span className="text-xs text-gray-700 truncate flex-1">{c.displayName}</span>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {c.fileCount} file{c.fileCount !== 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CourseRow({
  course, checked, hasSubmissions, isRunning, isCurrent, isDone, onToggle,
}: {
  course: CanvasCourse; checked: boolean; hasSubmissions: boolean;
  isRunning: boolean; isCurrent: boolean; isDone: boolean;
  onToggle: () => void;
}) {
  const isArchived = course.status === "archived";
  return (
    <li onClick={onToggle}
      className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50
        ${isCurrent ? "bg-blue-50" : ""} ${isDone ? "opacity-60" : ""}`}>
      <input type="checkbox" readOnly checked={checked}
        className="accent-canvas-red shrink-0" disabled={isRunning} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm truncate ${isArchived ? "text-gray-500" : "font-medium"}`}>
          {isCurrent && <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 mb-0.5" />}
          {course.shortName}
        </p>
        {course.term && <p className="text-xs text-gray-400 truncate">{course.term}</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        {isDone && <span className="text-xs text-green-600">✓</span>}
        {hasSubmissions && !isDone && (
          <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">files</span>
        )}
        {isArchived && (
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">archived</span>
        )}
      </div>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-base font-semibold text-canvas-dark">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
