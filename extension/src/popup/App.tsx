import { useEffect, useRef, useState } from "react";
import type { CanvasCourse, ExtMessage, TabState } from "../types/canvas";
import { parseSubmissionsZip } from "../lib/zipParser";
import { loadExportMeta, saveExportMeta } from "../lib/storage";
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
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) { setCanvasStatus("not-canvas"); return; }
      const msg: ExtMessage = { type: "GET_TAB_STATE", tabId: tab.id };
      chrome.runtime.sendMessage(msg, (response: ExtMessage) => {
        if (response?.type === "TAB_STATE" && response.state) {
          setTabState(response.state);
          setSelected(new Set(response.state.courses.map((c) => c.id)));
          setCanvasStatus("ready");
        } else {
          setCanvasStatus("not-canvas");
        }
      });
    });

    // Load any previously imported export metadata
    loadExportMeta().then((data) => {
      if (data) setExportData(data);
    });
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("parsing");
    setImportError("");
    try {
      const parsed = await parseSubmissionsZip(file);
      await saveExportMeta(parsed);
      setExportData(parsed);
      setImportStatus("done");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Unknown error");
      setImportStatus("error");
    }
    // Reset input so same file can be re-imported
    if (fileRef.current) fileRef.current.value = "";
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
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors
              ${activeTab === t
                ? "border-b-2 border-canvas-red text-canvas-red"
                : "text-gray-500 hover:text-gray-700"}`}
          >
            {t === "import" ? "Import Submissions" : "Archive Courses"}
          </button>
        ))}
      </div>

      {/* Archive tab */}
      {activeTab === "archive" && (
        <>
          {canvasStatus === "loading" && (
            <div className="flex items-center justify-center text-sm text-gray-500 p-8">
              Checking page...
            </div>
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

              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 gap-2">
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-gray-500">
                    {active.length} active
                    {archived.length > 0 && `, ${archived.length} archived`}
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

              {/* Course list */}
              <ul className="overflow-y-auto divide-y divide-gray-50 max-h-64">
                {visibleCourses.map((course) => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    checked={selected.has(course.id)}
                    hasSubmissions={exportData?.courses.some((c) => c.id === course.id) ?? false}
                    onToggle={() => toggleCourse(course.id)}
                  />
                ))}
              </ul>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-100">
                {exportData && (
                  <p className="text-xs text-gray-400 mb-2">
                    Submissions loaded: {exportData.courses.length} courses, {exportData.totalFiles} files
                  </p>
                )}
                <button
                  disabled={selected.size === 0}
                  className="w-full bg-canvas-red text-white text-sm font-semibold py-2 rounded
                             disabled:opacity-40 disabled:cursor-not-allowed
                             hover:bg-orange-700 transition-colors"
                >
                  Archive {selected.size > 0 ? `${selected.size} ` : ""}
                  {selected.size === 1 ? "Course" : "Courses"}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Import tab */}
      {activeTab === "import" && (
        <div className="p-4 flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-gray-800 mb-1">Import submissions export</p>
            <p className="text-xs text-gray-500">
              On Canvas, go to <span className="font-mono bg-gray-100 px-1 rounded">Account → Settings → Download Submissions</span> and import the ZIP here.
            </p>
          </div>

          {/* Drop zone */}
          <label
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200
                       rounded-lg py-6 px-4 cursor-pointer hover:border-canvas-red hover:bg-orange-50
                       transition-colors text-center"
          >
            <span className="text-2xl mb-2">📦</span>
            {importStatus === "parsing" ? (
              <span className="text-sm text-gray-500">Parsing ZIP...</span>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-700">Click to select ZIP file</span>
                <span className="text-xs text-gray-400 mt-1">submissions_export.zip</span>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleFileChange}
              disabled={importStatus === "parsing"}
            />
          </label>

          {importStatus === "error" && (
            <p className="text-xs text-red-600 bg-red-50 rounded p-2">{importError}</p>
          )}

          {/* Summary of imported data */}
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
  course, checked, hasSubmissions, onToggle,
}: {
  course: CanvasCourse;
  checked: boolean;
  hasSubmissions: boolean;
  onToggle: () => void;
}) {
  const isArchived = course.status === "archived";
  return (
    <li onClick={onToggle}
      className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50">
      <input type="checkbox" readOnly checked={checked} className="accent-canvas-red shrink-0" />
      <div className="min-w-0 flex-1">
        <p className={`text-sm truncate ${isArchived ? "text-gray-500" : "font-medium"}`}>
          {course.shortName}
        </p>
        {course.term && <p className="text-xs text-gray-400 truncate">{course.term}</p>}
      </div>
      <div className="flex gap-1 shrink-0">
        {hasSubmissions && (
          <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded" title="Submissions imported">
            files
          </span>
        )}
        {isArchived && (
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            archived
          </span>
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
