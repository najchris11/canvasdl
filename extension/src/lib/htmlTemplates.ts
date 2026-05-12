import type { ArchiveJob, CourseArchive, GradeEntry, Discussion, DiscussionPost } from "../types/archive";
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
.submission-body{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:1rem;margin-top:.75rem;font-size:.9rem;line-height:1.7;white-space:pre-wrap}

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
</nav>
<main class="container">
${content}
</main>
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
    ["Discussions", `${base}/discussions/index.html`],
    ["Announcements", `${base}/announcements/index.html`],
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
            ${detail?.submissionBody ? `
              <h4 style="font-size:.8rem;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin:.75rem 0 .5rem">Your Submission</h4>
              <div class="submission-body">${esc(detail.submissionBody)}</div>
            ` : ""}
            ${zipAssignment?.files.length ? `
              <h4 style="font-size:.8rem;color:var(--gray);text-transform:uppercase;letter-spacing:.06em;margin:.75rem 0 .5rem">Submitted Files</h4>
              <ul class="file-list">
                ${zipAssignment.files.map(f => `<li>
                  <span class="file-icon">${fileIcon(f.mimeType)}</span>
                  <a href="files/${esc(zipAssignment.name)}/${esc(f.name)}">${esc(f.name)}</a>
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
