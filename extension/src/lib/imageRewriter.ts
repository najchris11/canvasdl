// Matches Canvas-hosted image src/data-src values (single or double quoted):
//   https://osu.instructure.com/courses/.../files/.../preview
//   https://instructure-uploads.s3.amazonaws.com/...
//   /courses/.../files/.../preview  (relative)
const CANVAS_IMG_RE =
  /(?:src|data-src)=(["'])((?:https?:\/\/[^"']*(?:instructure\.com|instructure-uploads)[^"']*|\/courses\/\d+\/files\/[^"']+))\1/g;

export function extractCanvasImageUrls(html: string, baseOrigin: string): string[] {
  const urls: string[] = [];
  let m: RegExpExecArray | null;
  CANVAS_IMG_RE.lastIndex = 0;
  while ((m = CANVAS_IMG_RE.exec(html)) !== null) {
    const url = m[2].startsWith("/") ? `${baseOrigin}${m[2]}` : m[2];
    // Normalise: drop verifier/rand query params that change each request
    const clean = url.replace(/[?&](verifier|rand)=[^&"']+/g, "");
    urls.push(clean);
  }
  return urls;
}

export function hashUrl(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

export function extFromUrl(url: string): string {
  const m = url.match(/\.([a-zA-Z0-9]{2,5})(?:[?#]|$)/);
  if (m) return m[1].toLowerCase();
  if (url.includes("/preview") || url.includes("/download")) return "bin";
  return "bin";
}

// Replace Canvas image URLs in HTML with local archive paths.
// relRoot = path prefix to reach ZIP root from current file, e.g. "../../"
export function rewriteCanvasImages(
  html: string,
  urlToHash: Map<string, string>,
  relRoot: string
): string {
  CANVAS_IMG_RE.lastIndex = 0;
  return html.replace(CANVAS_IMG_RE, (match, _quote, rawUrl) => {
    const attr = match.startsWith("src") ? "src" : "data-src";
    const clean = rawUrl.replace(/[?&](verifier|rand)=[^&"']+/g, "");
    const hash = urlToHash.get(clean);
    if (!hash) return match;
    const ext = extFromUrl(clean);
    return `${attr}="${relRoot}assets/images/${hash}.${ext}"`;
  });
}
