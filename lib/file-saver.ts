/**
 * Browser-compatible file saver utility.
 * Replaces external file-saver package to ensure reliable bundling in Docker and ESM environments.
 */
export function saveAs(blob: Blob | MediaSource, filename: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}

export default saveAs;
