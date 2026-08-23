"use client";

export function FilePreview({
  reportId,
  fileName,
}: {
  reportId: string;
  fileName: string | null;
}) {
  const href = `/api/reports/${reportId}/file`;
  const kind = fileKind(fileName);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block min-h-24 w-36 flex-1 overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-md hover:shadow-accent/15"
      title={fileName ? `Open ${fileName}` : "Open original file"}
      aria-label={fileName ? `Open ${fileName}` : "Open original file"}
    >
      {kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={href}
          alt=""
          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
        />
      ) : kind === "pdf" ? (
        <iframe
          src={`${href}#toolbar=0&navpanes=0&scrollbar=0`}
          title=""
          className="pointer-events-none h-[220%] w-[220%] origin-top-left scale-[0.455] border-0 bg-white"
          tabIndex={-1}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
          <span className="text-lg font-semibold text-accent">FILE</span>
          <span className="truncate text-[10px] text-muted">
            {fileName ?? "Original"}
          </span>
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-sidebar/70 to-transparent px-1.5 pb-1.5 pt-6 text-[10px] font-medium text-sidebar-foreground">
        {kind === "pdf" ? "PDF" : kind === "image" ? "Image" : "File"}
      </span>
    </a>
  );
}

export function fileKind(fileName: string | null): "pdf" | "image" | "other" {
  if (!fileName) return "other";
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(png|jpe?g|webp|gif)$/.test(lower)) return "image";
  return "other";
}
