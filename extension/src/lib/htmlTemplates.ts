import type { ArchiveJob, AssignmentData, CourseArchive, CourseFile, CoursePage, GradeEntry, Discussion, DiscussionPost } from "../types/archive";
import type { ParsedExport } from "./zipParser";

// ─── Shared CSS ──────────────────────────────────────────────────────────────

export const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--red:#E66000;--dark:#2D3B45;--gray:#6B7280;--light:#F9FAFB;--border:#E5E7EB}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--dark);background:#fff;line-height:1.5}
a{color:var(--red);text-decoration:none}
a:hover{text-decoration:underline}
h1{font-size:1.5rem;font-weight:700;line-height:1.2}
h2{font-size:1.125rem;font-weight:600}
h3{font-size:1rem;font-weight:600}

/* Nav */
.nav{background:var(--dark);padding:0 1.5rem;display:flex;align-items:center;gap:.5rem;height:48px;position:sticky;top:0;z-index:100;flex-wrap:wrap}
.nav-brand{color:#fff;font-weight:700;font-size:1rem;white-space:nowrap}
.nav-sep{color:#64748b;font-size:.875rem}
.nav-crumb{color:#94a3b8;font-size:.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Layout */
.container{max-width:900px;margin:0 auto;padding:2rem 1.5rem}
.page-header{margin-bottom:1.75rem;padding-bottom:1rem;border-bottom:1px solid var(--border)}
.page-header .meta{color:var(--gray);font-size:.875rem;margin-top:.375rem}

/* Course section tabs */
.tabs{display:flex;gap:0;border-bottom:2px solid var(--border);margin-bottom:1.5rem;overflow-x:auto}
.tab{padding:.5rem 1rem;font-size:.875rem;color:var(--gray);border-bottom:2px solid transparent;margin-bottom:-2px;white-space:nowrap}
.tab:hover{color:var(--dark);text-decoration:none}
.tab.active{color:var(--red);border-bottom-color:var(--red);font-weight:600}

/* Course grid */
.course-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem}
.course-card{border:1px solid var(--border);border-radius:8px;padding:1.25rem;text-decoration:none;color:inherit;display:block;transition:border-color .15s,box-shadow .15s}
.course-card:hover{border-color:var(--red);box-shadow:0 2px 8px rgba(0,0,0,.08);text-decoration:none}
.course-card h3{font-size:.9375rem;margin-bottom:.25rem}
.course-card .term{font-size:.75rem;color:var(--gray)}
.course-card .stats{margin-top:.75rem;font-size:.8rem;color:var(--gray);display:flex;gap:1rem}
.archived-label{display:inline-block;font-size:.7rem;padding:.1rem .4rem;background:#f3f4f6;color:var(--gray);border-radius:999px;margin-left:.4rem;vertical-align:middle}

/* Assignment cards */
.assignment-card{border:1px solid var(--border);border-radius:8px;margin-bottom:1rem;overflow:hidden}
.assignment-card .card-header{padding:1rem 1.25rem;display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;cursor:pointer}
.assignment-card .card-header:hover{background:var(--light)}
.assignment-card .card-title{font-weight:600;font-size:.9375rem}
.assignment-card .card-meta{font-size:.8rem;color:var(--gray);margin-top:.2rem}
.assignment-card .card-body{padding:1.25rem;border-top:1px solid var(--border)}
.grade-display{text-align:right;flex-shrink:0}
.grade-display .score{font-size:1.25rem;font-weight:700}
.grade-display .possible{font-size:.8rem;color:var(--gray)}

/* Badges */
.badge{display:inline-block;padding:.125rem .5rem;border-radius:999px;font-size:.72rem;font-weight:600}
.badge-graded{background:#d1fae5;color:#065f46}
.badge-unsubmitted{background:#fef3c7;color:#92400e}
.badge-excused{background:#e0e7ff;color:#3730a3}
.badge-missing{background:#fee2e2;color:#991b1b}
.badge-archived{background:#f3f4f6;color:#6b7280}

/* Grade table */
.grade-table{width:100%;border-collapse:collapse;font-size:.875rem}
.grade-table th{text-align:left;padding:.5rem .75rem;border-bottom:2px solid var(--border);font-weight:600;color:var(--gray);font-size:.8rem;text-transform:uppercase;letter-spacing:.04em}
.grade-table td{padding:.5rem .75rem;border-bottom:1px solid var(--border);vertical-align:top}
.grade-table tr:last-child td{border-bottom:none}
.grade-table .group-header td{background:var(--light);font-weight:600;font-size:.8rem;color:var(--gray);padding:.375rem .75rem}
.score-cell{font-weight:600;white-space:nowrap}

/* Comments */
.comments{margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)}
.comment{background:var(--light);border-radius:6px;padding:.75rem;margin-top:.5rem}
.comment-author{font-weight:600;font-size:.8rem;color:var(--gray)}
.comment-body{margin-top:.375rem;font-size:.875rem;line-height:1.6}

/* Assignment description */
.desc-content{line-height:1.75;font-size:.9375rem}
.desc-content img{max-width:100%;height:auto;border-radius:4px}
.desc-content p{margin-bottom:.75rem}
.desc-content ul,
.desc-content ol{margin:.5rem 0 .75rem 1.5rem}
.desc-content li{margin-bottom:.25rem}
.desc-content pre,
.desc-content code{background:var(--light);border-radius:4px;font-family:'Courier New',monospace;font-size:.875em}
.desc-content pre{padding:.75rem;overflow-x:auto;margin:.5rem 0}
.desc-content code{padding:.125rem .3rem}

/* Submission body */
.submission-body{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:1rem;margin-top:.75rem;font-size:.9rem;line-height:1.7}
.submission-body p:first-child{margin-top:0}.submission-body p:last-child{margin-bottom:0}

/* File list */
.file-list{list-style:none;margin-top:.5rem}
.file-list li{display:flex;align-items:center;gap:.5rem;padding:.375rem 0;border-bottom:1px solid var(--border);font-size:.875rem}
.file-list li:last-child{border-bottom:none}
.file-icon{font-size:1rem}

/* Modules */
.module{border:1px solid var(--border);border-radius:8px;margin-bottom:.75rem;overflow:hidden}
.module summary{background:var(--light);padding:.75rem 1rem;font-weight:600;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;font-size:.9375rem}
.module summary::-webkit-details-marker{display:none}
.module summary::after{content:'▸';font-size:.75rem;color:var(--gray);transition:transform .2s}
details[open] summary::after{transform:rotate(90deg)}
.module-items{list-style:none}
.module-item{padding:.5rem 1rem;border-top:1px solid var(--border);font-size:.875rem;display:flex;align-items:center;gap:.75rem}
.module-item:hover{background:var(--light)}
.item-type{color:var(--gray);font-size:.72rem;min-width:80px;text-transform:uppercase;letter-spacing:.04em}

/* Discussions */
.post{padding:1rem 0;border-bottom:1px solid var(--border)}
.post:last-child{border-bottom:none}
.post-header{display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem}
.post-author{font-weight:600;font-size:.875rem}
.post-date{color:var(--gray);font-size:.8rem}
.post-content{font-size:.9rem;line-height:1.7}
.post-content img{max-width:100%;border-radius:4px}
.replies{margin-left:1.5rem;border-left:3px solid var(--border);padding-left:1rem;margin-top:.75rem}
.disc-list a{display:flex;flex-direction:column;padding:.75rem;border:1px solid var(--border);border-radius:6px;margin-bottom:.5rem;color:inherit}
.disc-list a:hover{border-color:var(--red);text-decoration:none;background:var(--light)}
.disc-list .disc-meta{font-size:.8rem;color:var(--gray);margin-top:.2rem}

/* Quiz */
.quiz-q{border:1px solid var(--border);border-radius:8px;margin-bottom:1rem;overflow:hidden}
.quiz-q .q-head{padding:.875rem 1.25rem;display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;background:var(--light)}
.quiz-q .q-head.correct{background:#d1fae5}.quiz-q .q-head.incorrect{background:#fee2e2}
.q-label{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--gray)}
.q-pts{font-size:.875rem;font-weight:600;white-space:nowrap}
.q-body{padding:1.25rem}
.q-text{line-height:1.75;margin-bottom:1rem}
.q-text img{max-width:100%;border-radius:4px}
.ans-list{list-style:none}
.ans-row{display:flex;align-items:flex-start;gap:.625rem;padding:.4rem .5rem;border-radius:4px;margin-bottom:.25rem;font-size:.9rem;line-height:1.5}
.ans-row.selected{background:#fef3c7}
.ans-row.is-correct{background:#d1fae5}
.ans-row.selected.is-correct{background:#d1fae5}
.ans-row.selected.is-wrong{background:#fee2e2}
.ans-icon{min-width:1.25rem;font-size:.875rem}
.match-pair{display:flex;align-items:center;gap:.5rem;padding:.35rem .5rem;border-radius:4px;margin-bottom:.25rem;font-size:.9rem}
.match-pair.is-correct{background:#d1fae5}.match-pair.is-wrong{background:#fee2e2}
.match-arrow{color:var(--gray);flex-shrink:0}
.q-comment{font-size:.8rem;color:#065f46;background:#d1fae5;border-radius:4px;padding:.3rem .5rem;margin-top:.35rem}
.answers-hidden .q-body{display:none}
.toggle-btn{padding:.35rem .75rem;font-size:.8rem;border:1px solid var(--border);border-radius:4px;background:#fff;cursor:pointer;color:var(--dark)}
.toggle-btn:hover{background:var(--light)}

/* Summary stats */
.stats-row{display:flex;gap:1.5rem;margin-bottom:1.5rem;flex-wrap:wrap}
.stat-box{border:1px solid var(--border);border-radius:8px;padding:.875rem 1.25rem;flex:1;min-width:120px;text-align:center}
.stat-box .val{font-size:1.5rem;font-weight:700;color:var(--dark)}
.stat-box .lbl{font-size:.75rem;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin-top:.2rem}

@media(max-width:600px){
  .container{padding:1rem}
  .course-grid{grid-template-columns:1fr}
  .stats-row{gap:.75rem}
}
`.trim();

// ─── Shared shell ─────────────────────────────────────────────────────────────

function shell(
  title: string,
  relRoot: string, // e.g. "../../" or "../"
  nav: string,
  content: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — CanvasDL</title>
<link rel="stylesheet" href="${relRoot}assets/style.css">
</head>
<body>
<nav class="nav">
  <a href="${relRoot}index.html" class="nav-brand">CanvasDL</a>
  ${nav}
  <form class="nav-search" action="${relRoot}search.html" method="get" style="margin-left:auto">
    <input name="q" type="search" placeholder="Search archive…" autocomplete="off"
      style="background:#3d4f5c;border:none;border-radius:4px;color:#fff;font-size:.8rem;padding:.3rem .6rem;width:160px;outline:none"
      onfocus="this.style.background='#4a5f6e'" onblur="this.style.background='#3d4f5c'">
  </form>
</nav>
<main class="container">
${content}
</main>
<script>
document.querySelectorAll('img').forEach(function(img){
  img.addEventListener('error',function(){
    if(this.dataset.errHandled)return;
    this.dataset.errHandled='1';
    this.alt=this.alt||'Image unavailable';
    this.style.cssText='display:inline-block;padding:.25rem .5rem;background:#2a3a46;color:#8fa8b8;font-size:.75rem;border:1px dashed #4a5f6e;border-radius:4px;min-width:60px;text-align:center';
    this.removeAttribute('src');
  },true);
});
</script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function courseTabs(courseId: number, active: string, relRoot: string): string {
  const base = `${relRoot}courses/${courseId}`;
  const tabs = [
    ["Overview", `${base}/index.html`],
    ["Assignments", `${base}/assignments.html`],
    ["Grades", `${base}/grades.html`],
    ["Modules", `${base}/modules.html`],
    ["Pages", `${base}/pages/index.html`],
    ["Discussions", `${base}/discussions/index.html`],
    ["Announcements", `${base}/announcements/index.html`],
    ["Files", `${base}/files.html`],
  ];
  return `<div class="tabs">${tabs.map(([label, href]) =>
    `<a href="${href}" class="tab${label === active ? " active" : ""}">${label}</a>`
  ).join("")}</div>`;
}

function badgeFor(state: string, excused: boolean): string {
  if (excused) return `<span class="badge badge-excused">Excused</span>`;
  switch (state) {
    case "graded": return `<span class="badge badge-graded">Graded</span>`;
    case "submitted": return `<span class="badge badge-graded">Submitted</span>`;
    case "unsubmitted": return `<span class="badge badge-unsubmitted">Unsubmitted</span>`;
    case "missing": return `<span class="badge badge-missing">Missing</span>`;
    default: return `<span class="badge badge-unsubmitted">${esc(state)}</span>`;
  }
}

function renderComments(comments: GradeEntry["comments"]): string {
  if (!comments.length) return "";
  return `<div class="comments">
    <h4 style="font-size:.8rem;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.25rem">Instructor Feedback</h4>
    ${comments.map(c => `<div class="comment">
      <div class="comment-author">${esc(c.authorName)} <span style="font-weight:400">&middot; ${esc(c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "")}</span></div>
      <div class="comment-body">${c.comment}</div>
    </div>`).join("")}
  </div>`;
}

// ─── index.html ───────────────────────────────────────────────────────────────

export function courseListPage(job: ArchiveJob): string {
  const archived = job.courses.filter(c => {
    // Courses with [ARCHIVED] in name or no active designation
    return c.courseName.includes("[ARCHIVED]");
  });
  const active = job.courses.filter(c => !c.courseName.includes("[ARCHIVED]"));

  function renderGroup(courses: CourseArchive[], label: string) {
    if (!courses.length) return "";
    return `<h2 style="font-size:.8rem;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin:1.5rem 0 .75rem">${label}</h2>
    <div class="course-grid">
      ${courses.map(c => {
        const grade = c.grades.filter(g => g.score !== null);
        const totalPts = grade.reduce((s, g) => s + (g.score ?? 0), 0);
        const maxPts = grade.reduce((s, g) => s + (g.pointsPossible ?? 0), 0);
        const pct = maxPts > 0 ? Math.round((totalPts / maxPts) * 100) : null;
        return `<a href="courses/${c.courseId}/index.html" class="course-card">
          <h3>${esc(c.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</h3>
          <div class="stats">
            <span>${c.grades.length} assignments</span>
            ${pct !== null ? `<span>${pct}%</span>` : ""}
            ${c.discussions.length ? `<span>${c.discussions.length} discussions</span>` : ""}
          </div>
        </a>`;
      }).join("")}
    </div>`;
  }

  const content = `
    <div class="page-header">
      <h1>Course Archive</h1>
      <div class="meta">Archived ${new Date(job.courses[0]?.scrapedAt ?? Date.now()).toLocaleDateString()} &middot; ${job.courses.length} courses</div>
    </div>
    ${renderGroup(active, "Current & Recent")}
    ${renderGroup(archived, "Past Enrollments")}
  `;
  return shell("Course Archive", "", "", content);
}

// ─── courses/{id}/index.html ──────────────────────────────────────────────────

export function courseIndexPage(archive: CourseArchive, exportData: ParsedExport | null): string {
  const relRoot = "../../";
  const graded = archive.grades.filter(g => g.score !== null);
  const totalEarned = graded.reduce((s, g) => s + (g.score ?? 0), 0);
  const totalPossible = graded.reduce((s, g) => s + (g.pointsPossible ?? 0), 0);
  const pct = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : null;
  const zipCourse = exportData?.courses.find(c => c.id === archive.courseId);

  const content = `
    <div class="page-header">
      <h1>${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</h1>
      <div class="meta">Archived ${new Date(archive.scrapedAt).toLocaleDateString()}</div>
    </div>
    ${courseTabs(archive.courseId, "Overview", relRoot)}
    <div class="stats-row">
      <div class="stat-box"><div class="val">${archive.grades.length}</div><div class="lbl">Assignments</div></div>
      <div class="stat-box"><div class="val">${graded.length}</div><div class="lbl">Graded</div></div>
      ${pct !== null ? `<div class="stat-box"><div class="val">${pct}%</div><div class="lbl">Points Earned</div></div>` : ""}
      ${archive.discussions.length ? `<div class="stat-box"><div class="val">${archive.discussions.length}</div><div class="lbl">Discussions</div></div>` : ""}
      ${zipCourse ? `<div class="stat-box"><div class="val">${zipCourse.fileCount}</div><div class="lbl">Files Saved</div></div>` : ""}
    </div>
    ${archive.grades.length ? `
    <h2 style="margin-bottom:1rem">Recent Grades</h2>
    <table class="grade-table">
      <thead><tr><th>Assignment</th><th>Score</th><th>Status</th></tr></thead>
      <tbody>
        ${archive.grades.slice(0, 10).map(g => `<tr>
          <td><a href="assignments.html#a${esc(g.assignmentId)}">${esc(g.name)}</a></td>
          <td class="score-cell">${g.score !== null ? `${g.score} / ${g.pointsPossible}` : "—"}</td>
          <td>${badgeFor(g.workflowState, false)}</td>
        </tr>`).join("")}
        ${archive.grades.length > 10 ? `<tr><td colspan="3" style="color:var(--gray);font-size:.85rem;text-align:center;padding:.75rem"><a href="grades.html">View all ${archive.grades.length} assignments →</a></td></tr>` : ""}
      </tbody>
    </table>` : ""}
  `;

  return shell(archive.courseName, relRoot,
    `<span class="nav-sep">/</span><span class="nav-crumb">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</span>`,
    content
  );
}

// ─── courses/{id}/assignments.html ────────────────────────────────────────────

export function assignmentsPage(archive: CourseArchive, exportData: ParsedExport | null): string {
  const relRoot = "../../";
  const zipCourse = exportData?.courses.find(c => c.id === archive.courseId);

  // Build assignment detail map from scraped assignment pages
  const detailMap = new Map(archive.assignments.map(a => [a.id, a]));

  const content = `
    <div class="page-header">
      <h1>Assignments</h1>
      <div class="meta">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</div>
    </div>
    ${courseTabs(archive.courseId, "Assignments", relRoot)}
    ${archive.grades.map(g => {
      const detail = detailMap.get(g.assignmentId);
      const zipAssignment = zipCourse?.assignments.find(a =>
        a.name.toLowerCase().trim() === g.name.toLowerCase().trim()
      );

      const gradeHtml = g.score !== null
        ? `<div class="grade-display"><div class="score">${g.score}</div><div class="possible">/ ${g.pointsPossible}</div></div>`
        : `<div class="grade-display" style="color:var(--gray)">—</div>`;

      return `<div class="assignment-card" id="a${esc(g.assignmentId)}">
        <details>
          <summary style="list-style:none;padding:0">
            <div class="card-header">
              <div style="flex:1">
                <div class="card-title">${esc(g.name)}</div>
                <div class="card-meta">
                  ${g.due ? `Due ${esc(g.due)}` : ""}
                  ${g.submitted ? ` &middot; Submitted ${esc(g.submitted)}` : ""}
                  &nbsp;${badgeFor(g.workflowState, false)}
                </div>
              </div>
              ${gradeHtml}
            </div>
          </summary>
          <div class="card-body">
            ${detail?.descriptionHtml ? `
              <h4 style="font-size:.8rem;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.75rem">Prompt</h4>
              <div class="desc-content">${detail.descriptionHtml}</div>
            ` : ""}
            ${detail?.quizData ? `
              <a href="quizzes/${esc(detail.id)}.html" style="display:inline-block;margin-bottom:.75rem;padding:.35rem .875rem;background:var(--red);color:#fff;border-radius:4px;font-size:.85rem;font-weight:600">View Quiz Questions →</a>
            ` : ""}
            ${detail?.submissionBody ? `
              <h4 style="font-size:.8rem;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin:.75rem 0 .5rem">Your Submission</h4>
              <div class="submission-body desc-content">${detail.submissionBody}</div>
            ` : ""}
            ${zipAssignment?.files.length ? `
              <h4 style="font-size:.8rem;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin:.75rem 0 .5rem">Submitted Files</h4>
              <ul class="file-list">
                ${zipAssignment.files.map(f => `<li>
                  <span class="file-icon">${fileIcon(f.mimeType)}</span>
                  <a href="files/${encodeURIComponent(sanitizeFolderName(zipAssignment.name))}/${encodeURIComponent(f.name)}">${esc(f.name)}</a>
                  <span style="color:var(--gray);font-size:.75rem;margin-left:auto">${formatBytes(f.size)}</span>
                </li>`).join("")}
              </ul>
            ` : ""}
            ${renderComments(g.comments)}
          </div>
        </details>
      </div>`;
    }).join("")}
  `;

  return shell(`Assignments — ${archive.courseName}`, relRoot,
    `<span class="nav-sep">/</span>
     <a href="index.html" class="nav-crumb">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</a>
     <span class="nav-sep">/</span><span class="nav-crumb">Assignments</span>`,
    content
  );
}

// ─── courses/{id}/grades.html ─────────────────────────────────────────────────

export function gradesPage(archive: CourseArchive): string {
  const relRoot = "../../";
  const graded = archive.grades.filter(g => g.score !== null);
  const totalEarned = graded.reduce((s, g) => s + (g.score ?? 0), 0);
  const totalPossible = graded.reduce((s, g) => s + (g.pointsPossible ?? 0), 0);

  // Group by assignment group name
  const groups = new Map<string, GradeEntry[]>();
  for (const g of archive.grades) {
    const group = g.groupName || "Other";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(g);
  }

  const content = `
    <div class="page-header">
      <h1>Grades</h1>
      <div class="meta">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</div>
    </div>
    ${courseTabs(archive.courseId, "Grades", relRoot)}
    <div class="stats-row" style="margin-bottom:1.5rem">
      <div class="stat-box"><div class="val">${graded.length}/${archive.grades.length}</div><div class="lbl">Graded</div></div>
      <div class="stat-box"><div class="val">${totalEarned.toFixed(1)}</div><div class="lbl">Points Earned</div></div>
      <div class="stat-box"><div class="val">${totalPossible.toFixed(1)}</div><div class="lbl">Points Possible</div></div>
      ${totalPossible > 0 ? `<div class="stat-box"><div class="val">${((totalEarned / totalPossible) * 100).toFixed(1)}%</div><div class="lbl">Overall</div></div>` : ""}
    </div>
    <table class="grade-table">
      <thead><tr><th>Assignment</th><th>Due</th><th>Submitted</th><th>Score</th><th>Status</th></tr></thead>
      <tbody>
        ${Array.from(groups.entries()).map(([groupName, entries]) => `
          <tr class="group-header"><td colspan="5">${esc(groupName)}</td></tr>
          ${entries.map(g => `<tr>
            <td><a href="assignments.html#a${esc(g.assignmentId)}">${esc(g.name)}</a></td>
            <td style="color:var(--gray);font-size:.8rem;white-space:nowrap">${esc(g.due ?? "—")}</td>
            <td style="color:var(--gray);font-size:.8rem;white-space:nowrap">${esc(g.submitted ?? "—")}</td>
            <td class="score-cell">${g.score !== null ? `${g.score} / ${g.pointsPossible}` : "—"}</td>
            <td>${badgeFor(g.workflowState, false)}</td>
          </tr>`).join("")}
        `).join("")}
      </tbody>
    </table>
  `;

  return shell(`Grades — ${archive.courseName}`, relRoot,
    `<span class="nav-sep">/</span>
     <a href="index.html" class="nav-crumb">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</a>
     <span class="nav-sep">/</span><span class="nav-crumb">Grades</span>`,
    content
  );
}

// ─── courses/{id}/modules.html ────────────────────────────────────────────────

export function modulesPage(archive: CourseArchive): string {
  const relRoot = "../../";

  const content = `
    <div class="page-header">
      <h1>Modules</h1>
      <div class="meta">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</div>
    </div>
    ${courseTabs(archive.courseId, "Modules", relRoot)}
    ${archive.modules.length ? archive.modules.map(m => `
      <div class="module">
        <details open>
          <summary>${esc(m.title)} <span style="color:var(--gray);font-weight:400;font-size:.8rem">${m.items.length} items</span></summary>
          <ul class="module-items">
            ${m.items.map(item => `<li class="module-item">
              <span class="item-type">${esc(item.type.replace("_", " "))}</span>
              ${item.url ? `<a href="${esc(item.url)}">${esc(item.title)}</a>` : esc(item.title)}
              ${item.dueDate ? `<span style="margin-left:auto;color:var(--gray);font-size:.75rem">${esc(item.dueDate)}</span>` : ""}
            </li>`).join("")}
          </ul>
        </details>
      </div>`).join("") : `<p style="color:var(--gray)">No modules recorded.</p>`}
  `;

  return shell(`Modules — ${archive.courseName}`, relRoot,
    `<span class="nav-sep">/</span>
     <a href="index.html" class="nav-crumb">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</a>
     <span class="nav-sep">/</span><span class="nav-crumb">Modules</span>`,
    content
  );
}

// ─── courses/{id}/discussions/index.html ──────────────────────────────────────

export function discussionListPage(archive: CourseArchive, type: "discussions" | "announcements"): string {
  const relRoot = "../../../";
  const items = type === "discussions" ? archive.discussions : archive.announcements;
  const label = type === "discussions" ? "Discussions" : "Announcements";

  const content = `
    <div class="page-header">
      <h1>${label}</h1>
      <div class="meta">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</div>
    </div>
    ${courseTabs(archive.courseId, label, relRoot)}
    ${items.length ? `<div class="disc-list">
      ${items.map(d => `<a href="${esc(d.id)}.html">
        <strong>${esc(d.title)}</strong>
        <span class="disc-meta">${d.posts.length} post${d.posts.length !== 1 ? "s" : ""}</span>
      </a>`).join("")}
    </div>` : `<p style="color:var(--gray)">No ${label.toLowerCase()} recorded.</p>`}
  `;

  return shell(`${label} — ${archive.courseName}`, relRoot,
    `<span class="nav-sep">/</span>
     <a href="../index.html" class="nav-crumb">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</a>
     <span class="nav-sep">/</span><span class="nav-crumb">${label}</span>`,
    content
  );
}

// ─── courses/{id}/discussions/{id}.html ───────────────────────────────────────

export function discussionPage(
  disc: Discussion,
  archive: CourseArchive,
  type: "discussions" | "announcements"
): string {
  const relRoot = "../../../";
  const label = type === "discussions" ? "Discussions" : "Announcements";

  function renderPosts(posts: DiscussionPost[], depth = 0): string {
    return posts.map(post => `
      <div class="${depth === 0 ? "post" : ""}">
        <div class="post-header">
          <span class="post-author">${esc(post.authorName)}</span>
          ${post.createdAt ? `<span class="post-date">${esc(post.createdAt)}</span>` : ""}
        </div>
        <div class="post-content">${post.contentHtml || "<em style='color:var(--gray)'>No content</em>"}</div>
        ${post.replies.length ? `<div class="replies">${renderPosts(post.replies, depth + 1)}</div>` : ""}
      </div>`).join("");
  }

  const content = `
    <div class="page-header">
      <h1>${esc(disc.title)}</h1>
      <div class="meta">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))} &middot; ${disc.posts.length} post${disc.posts.length !== 1 ? "s" : ""}</div>
    </div>
    <p style="margin-bottom:1rem"><a href="index.html">← Back to ${label}</a></p>
    ${disc.posts.length ? renderPosts(disc.posts) : `<p style="color:var(--gray)">No posts recorded.</p>`}
  `;

  return shell(`${disc.title} — ${archive.courseName}`, relRoot,
    `<span class="nav-sep">/</span>
     <a href="../index.html" class="nav-crumb">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</a>
     <span class="nav-sep">/</span>
     <a href="index.html" class="nav-crumb">${label}</a>
     <span class="nav-sep">/</span><span class="nav-crumb">${esc(disc.title)}</span>`,
    content
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Must match the sanitization used in siteGenerator when writing files to the ZIP
function sanitizeFolderName(name: string): string {
  return name.replace(/[/\\?*:|"<>]/g, "_");
}

function fileIcon(mime: string): string {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("zip")) return "🗜️";
  if (mime.includes("word")) return "📝";
  if (mime.includes("presentation")) return "📊";
  if (mime.includes("spreadsheet")) return "📈";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("text/")) return "📃";
  return "📎";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── courses/{id}/pages/index.html + pages/{slug}.html ───────────────────────

export function pageListPage(archive: CourseArchive): string {
  const relRoot = "../../../";

  const content = `
    <div class="page-header">
      <h1>Pages</h1>
      <div class="meta">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</div>
    </div>
    ${courseTabs(archive.courseId, "Pages", relRoot)}
    ${archive.pages.length ? `<div class="disc-list">
      ${archive.pages.map(p => `<a href="${esc(p.slug)}.html">
        <strong>${esc(p.title)}</strong>
        ${p.updatedAt ? `<span class="disc-meta">Updated ${esc(new Date(p.updatedAt).toLocaleDateString())}</span>` : ""}
      </a>`).join("")}
    </div>` : `<p style="color:var(--gray)">No pages recorded.</p>`}
  `;

  return shell(`Pages — ${archive.courseName}`, relRoot,
    `<span class="nav-sep">/</span>
     <a href="../index.html" class="nav-crumb">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</a>
     <span class="nav-sep">/</span><span class="nav-crumb">Pages</span>`,
    content
  );
}

export function pageDetailPage(page: CoursePage, archive: CourseArchive): string {
  const relRoot = "../../../";

  const content = `
    <div class="page-header">
      <h1>${esc(page.title)}</h1>
      <div class="meta">
        ${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}
        ${page.updatedAt ? ` &middot; Updated ${esc(new Date(page.updatedAt).toLocaleDateString())}` : ""}
      </div>
    </div>
    <p style="margin-bottom:1rem"><a href="index.html">← Back to Pages</a></p>
    <div class="desc-content">${page.bodyHtml || "<p style='color:var(--gray)'>No content.</p>"}</div>
  `;

  return shell(`${page.title} — ${archive.courseName}`, relRoot,
    `<span class="nav-sep">/</span>
     <a href="../index.html" class="nav-crumb">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</a>
     <span class="nav-sep">/</span>
     <a href="index.html" class="nav-crumb">Pages</a>
     <span class="nav-sep">/</span><span class="nav-crumb">${esc(page.title)}</span>`,
    content
  );
}

// ─── courses/{id}/files.html ──────────────────────────────────────────────────

export function filesPage(archive: CourseArchive, downloadedIds: Set<string>): string {
  const relRoot = "../../";

  const rows = archive.files.map(f => {
    const isDownloaded = downloadedIds.has(f.id);
    const fileLink = isDownloaded
      ? `<a href="course_files/${encodeURIComponent(f.name)}">${esc(f.name)}</a>`
      : `<span>${esc(f.name)}</span>`;
    return `<tr>
      <td>${fileLink}</td>
      <td style="color:var(--gray);font-size:.8rem;white-space:nowrap">${esc(f.sizeLabel)}</td>
      <td style="color:var(--gray);font-size:.8rem;white-space:nowrap">${esc(f.updatedAt)}</td>
      <td>${isDownloaded
        ? `<span class="badge badge-graded">Saved</span>`
        : `<span class="badge badge-unsubmitted">Not saved</span>`}</td>
    </tr>`;
  }).join("");

  const content = `
    <div class="page-header">
      <h1>Files</h1>
      <div class="meta">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}
        &middot; ${archive.files.length} file${archive.files.length !== 1 ? "s" : ""}
        &middot; ${downloadedIds.size} saved
      </div>
    </div>
    ${courseTabs(archive.courseId, "Files", relRoot)}
    ${archive.files.length ? `
    <table class="grade-table">
      <thead><tr><th>Name</th><th>Size</th><th>Updated</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>` : `<p style="color:var(--gray)">No files recorded.</p>`}
  `;

  return shell(`Files — ${archive.courseName}`, relRoot,
    `<span class="nav-sep">/</span>
     <a href="index.html" class="nav-crumb">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</a>
     <span class="nav-sep">/</span><span class="nav-crumb">Files</span>`,
    content
  );
}

// ─── courses/{id}/quizzes/{aid}.html ─────────────────────────────────────────

export function quizPage(detail: AssignmentData, archive: CourseArchive): string {
  const relRoot = "../../../";
  const quiz = detail.quizData!;

  function typeLabel(type: string): string {
    return type.replace(/_question$/, "").replace(/_/g, " ");
  }

  function renderAnswers(q: import("../types/archive").QuizQuestion): string {
    if (!q.answers.length) return "";

    if (q.type === "matching_question") {
      return `<ul class="ans-list">${q.answers.map(a => {
        const cls = a.isCorrect ? "is-correct" : "is-wrong";
        return `<li class="match-pair ${cls}">
          <span class="ans-icon">${a.isCorrect ? "✓" : "✗"}</span>
          <span>${esc(a.matchLeft ?? a.text)}</span>
          <span class="match-arrow">→</span>
          <span>${esc(a.matchRight ?? "")}</span>
          ${a.comment ? `<span class="q-comment">${esc(a.comment)}</span>` : ""}
        </li>`;
      }).join("")}</ul>`;
    }

    return `<ul class="ans-list">${q.answers.map(a => {
      let cls = "";
      if (a.isSelected && a.isCorrect) cls = "selected is-correct";
      else if (a.isSelected && !a.isCorrect) cls = "selected is-wrong";
      else if (!a.isSelected && a.isCorrect) cls = "is-correct";
      const icon = a.isSelected
        ? (a.isCorrect ? "✓" : "✗")
        : (a.isCorrect ? "○" : "");
      return `<li class="ans-row ${cls}">
        <span class="ans-icon">${icon}</span>
        <span>${esc(a.text)}</span>
        ${a.comment ? `<div class="q-comment">${esc(a.comment)}</div>` : ""}
      </li>`;
    }).join("")}</ul>`;
  }

  const totalEarned = quiz.questions.reduce((s, q) => s + (q.pointsEarned ?? 0), 0);
  const totalPossible = quiz.questions.reduce((s, q) => s + (q.pointsPossible ?? 0), 0);
  const correct = quiz.questions.filter(q => q.correct === true).length;
  const incorrect = quiz.questions.filter(q => q.correct === false).length;

  const questionsHtml = quiz.questions.map((q, i) => {
    const headCls = q.correct === true ? "correct" : q.correct === false ? "incorrect" : "";
    const ptsTxt = q.pointsEarned !== null && q.pointsPossible !== null
      ? `${q.pointsEarned} / ${q.pointsPossible} pts`
      : q.pointsPossible !== null ? `— / ${q.pointsPossible} pts` : "";
    return `<div class="quiz-q answers-hidden" id="q${esc(q.id)}">
      <div class="q-head ${headCls}">
        <div>
          <div style="font-weight:600;margin-bottom:.2rem">Question ${i + 1}</div>
          <div class="q-label">${esc(typeLabel(q.type))}</div>
        </div>
        <div style="display:flex;align-items:center;gap:.75rem">
          ${ptsTxt ? `<span class="q-pts">${esc(ptsTxt)}</span>` : ""}
          <button class="toggle-btn" onclick="toggleQ(this)" type="button">Show answer</button>
        </div>
      </div>
      <div class="q-body">
        <div class="q-text">${q.questionText || "<em>No question text</em>"}</div>
        ${renderAnswers(q)}
      </div>
    </div>`;
  }).join("");

  const toggleScript = `<script>
function toggleQ(btn){
  var card=btn.closest('.quiz-q');
  var hidden=card.classList.toggle('answers-hidden');
  btn.textContent=hidden?'Show answer':'Hide answer';
}
function toggleAll(btn){
  var all=document.querySelectorAll('.quiz-q');
  var anyHidden=Array.from(all).some(function(c){return c.classList.contains('answers-hidden');});
  all.forEach(function(c){
    c.classList.toggle('answers-hidden',!anyHidden);
    var b=c.querySelector('.toggle-btn');
    if(b) b.textContent=anyHidden?'Hide answer':'Show answer';
  });
  btn.textContent=anyHidden?'Hide all answers':'Show all answers';
}
</script>`;

  const content = `
    <div class="page-header">
      <h1>${esc(detail.name)}</h1>
      <div class="meta">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</div>
    </div>
    <p style="margin-bottom:1.25rem"><a href="../assignments.html#a${esc(detail.id)}">← Back to Assignments</a></p>
    <div class="stats-row" style="margin-bottom:1.5rem">
      <div class="stat-box"><div class="val">${quiz.questions.length}</div><div class="lbl">Questions</div></div>
      ${correct > 0 || incorrect > 0 ? `<div class="stat-box"><div class="val">${correct}</div><div class="lbl">Correct</div></div>
      <div class="stat-box"><div class="val">${incorrect}</div><div class="lbl">Incorrect</div></div>` : ""}
      ${totalPossible > 0 ? `<div class="stat-box"><div class="val">${totalEarned} / ${totalPossible}</div><div class="lbl">Points</div></div>` : ""}
    </div>
    <div style="margin-bottom:1.25rem">
      <button class="toggle-btn" onclick="toggleAll(this)" type="button">Show all answers</button>
    </div>
    ${questionsHtml}
    ${toggleScript}
  `;

  return shell(`${detail.name} — ${archive.courseName}`, relRoot,
    `<span class="nav-sep">/</span>
     <a href="../index.html" class="nav-crumb">${esc(archive.courseName.replace(/^\[ARCHIVED\]\s*/, ""))}</a>
     <span class="nav-sep">/</span>
     <a href="../assignments.html" class="nav-crumb">Assignments</a>
     <span class="nav-sep">/</span><span class="nav-crumb">${esc(detail.name)}</span>`,
    content
  );
}

// ─── search.html ──────────────────────────────────────────────────────────────
// Fully self-contained: embeds the serialized lunr index + lunr runtime inline
// so it works on file:// with zero network requests.

// ─── search.html ──────────────────────────────────────────────────────────────
export function buildSearchHtml(
  indexJson: string,
  docsJson: string,
  lunrSource: string
): string {
  const runtime = `
(function() {
  var idx = lunr.Index.load(JSON.parse(document.getElementById('search-index').textContent));
  var docs = JSON.parse(document.getElementById('search-docs').textContent);
  var typeLabel = { assignment: 'Assignment', discussion: 'Discussion', announcement: 'Announcement', module: 'Module' };
  var typeColor = { assignment: '#E66000', discussion: '#3b82f6', announcement: '#8b5cf6', module: '#6b7280' };
  function getQuery() { return new URLSearchParams(location.search).get('q') || ''; }
  function render(q) {
    document.getElementById('search-input').value = q;
    document.title = (q ? '"' + q + '" \\u2014 ' : '') + 'Search \\u2014 CanvasDL';
    var out = document.getElementById('results');
    if (!q.trim()) { out.innerHTML = '<p style="color:var(--gray)">Enter a query above.</p>'; return; }
    var results;
    try { results = idx.search(q + ' ' + q.split(/\\s+/).map(function(t){return t+'*';}).join(' ')); } catch(e) { results = []; }
    if (!results.length) { out.innerHTML = '<p style="color:var(--gray)">No results for <strong>' + q.replace(/</g,'&lt;') + '</strong>.</p>'; return; }
    var groups = {};
    results.forEach(function(r) {
      var doc = docs[r.ref]; if (!doc) return;
      if (!groups[doc.courseId]) groups[doc.courseId] = { name: doc.courseName, items: [] };
      groups[doc.courseId].items.push(doc);
    });
    var html = Object.values(groups).map(function(g) {
      return '<div style="margin-bottom:1.5rem"><h2 style="font-size:.8rem;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem">' + g.name + '</h2>' +
        g.items.map(function(doc) {
          var snippet = doc.body.replace(/<[^>]+>/g,'').slice(0, 160);
          if (snippet.length===160) snippet += '\\u2026';
          return '<a href="' + doc.url + '" style="display:block;padding:.75rem;border:1px solid var(--border);border-radius:6px;margin-bottom:.375rem;color:inherit;text-decoration:none" onmouseover="this.style.borderColor=\\'var(--red)\\'" onmouseout="this.style.borderColor=\\'var(--border)\\'">' +
            '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.2rem">' +
              '<span style="font-size:.7rem;font-weight:600;padding:.1rem .4rem;border-radius:999px;background:' + (typeColor[doc.type]||'#888') + '20;color:' + (typeColor[doc.type]||'#888') + '">' + (typeLabel[doc.type]||doc.type) + '</span>' +
              '<span style="font-weight:600;font-size:.9rem">' + doc.title.replace(/</g,'&lt;') + '</span>' +
            '</div>' +
            (snippet ? '<div style="font-size:.8rem;color:var(--gray);line-height:1.5">' + snippet.replace(/</g,'&lt;') + '</div>' : '') +
          '</a>';
        }).join('') + '</div>';
    }).join('');
    out.innerHTML = html;
  }
  document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var q = document.getElementById('search-input').value;
    history.pushState({}, '', '?q=' + encodeURIComponent(q));
    render(q);
  });
  document.getElementById('search-input').addEventListener('input', function() { render(this.value); });
  render(getQuery());
})();
`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Search \u2014 CanvasDL</title>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<nav class="nav">
  <a href="index.html" class="nav-brand">CanvasDL</a>
  <span class="nav-sep">/</span>
  <span class="nav-crumb">Search</span>
</nav>
<main class="container">
  <div class="page-header"><h1>Search</h1></div>
  <form id="search-form" style="margin-bottom:1.5rem">
    <input id="search-input" type="search" name="q" placeholder="Search assignments, discussions, announcements\u2026"
      autocomplete="off"
      style="width:100%;padding:.625rem .875rem;font-size:1rem;border:2px solid var(--border);border-radius:6px;outline:none;color:var(--dark);font-family:inherit"
      onfocus="this.style.borderColor='var(--red)'" onblur="this.style.borderColor='var(--border)'">
  </form>
  <div id="results"><p style="color:var(--gray)">Enter a query above.</p></div>
</main>
<script type="application/json" id="search-index">${indexJson}</script>
<script type="application/json" id="search-docs">${docsJson}</script>
<script>${lunrSource}</script>
<script>${runtime}</script>
</body>
</html>`;
}
