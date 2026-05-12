// Runs in the page's main world — can read window.ENV directly.
// Dispatches it as a custom event so the isolated-world content script can relay it.
const env = (window as unknown as { ENV?: unknown }).ENV;
window.dispatchEvent(
  new CustomEvent("canvasdl:env", { detail: env ?? null })
);
