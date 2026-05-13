# CanvasDL

A Chrome extension that archives your Canvas LMS courses into a fully offline, searchable HTML site before you lose access.

## What it saves

- **Assignments** — description, your submission, score, instructor comments, and quiz question/answer review
- **Grades** — full grade breakdown per course
- **Modules** — complete module structure with item links
- **Discussions & Announcements** — all threads and replies
- **Pages** — course wiki pages
- **Files** — course file library, downloaded into the archive
- **Inline images** — Canvas-hosted images embedded in content are downloaded and rewritten to local paths

Everything is bundled into a single `.zip` file. Open `index.html` inside to browse, or use the built-in full-text search (powered by [lunr.js](https://lunrjs.com/)).

## Installation

1. Clone the repo and install dependencies:
   ```
   git clone https://github.com/najchris11/canvasdl.git
   cd canvasdl/extension
   npm install
   npm run build
   ```
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `extension/dist` folder.

## Usage

1. Log in to your Canvas instance in Chrome.
2. Click the CanvasDL extension icon.
3. Select the courses you want to archive and click **Start Archive**.
4. When the job completes, click **Download ZIP**.
5. Unzip and open `index.html` in any browser — no internet required.

## Optional: Canvas export ZIP

If you export your course data from Canvas (**Account → Settings → Download Submissions**), you can load that ZIP into the extension before archiving. CanvasDL will include your submission files in the archive alongside the scraped content.

## Tech stack

- Chrome Extension Manifest V3 (service worker + content script)
- Vite + TypeScript
- JSZip for archive generation
- lunr.js for offline full-text search

## Privacy

All data stays local. Nothing is sent to any server — the extension only communicates with your Canvas instance to scrape pages and download files using your existing authenticated session.

## License

MIT
