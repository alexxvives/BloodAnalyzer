import {
  LAB_STATUS_LABEL,
  STATUS_LABEL,
  statusTailwindBg,
} from "@/lib/status-tokens";
import type { BiomarkerStatus, LabRangeStatus } from "@/lib/types";

export function LabBadge({ status }: { status: LabRangeStatus }) {
  const emphasis =
    status === "out_of_range"
      ? "border-status-attention/40 text-status-attention"
      : "border-border text-muted";

  return (
    <span
      className={`inline-flex items-center rounded-full border bg-surface px-2.5 py-1 text-xs font-medium ${emphasis}`}
    >
      {LAB_STATUS_LABEL[status]}
    </span>
  );
}

export function GradeBadge({ status }: { status: BiomarkerStatus | null }) {
  if (status == null) {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
        Grade: range not available
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white ${statusTailwindBg(status)}`}
    >
      <span className="size-1.5 rounded-full bg-white/90" aria-hidden />
      Grade: {STATUS_LABEL[status]}
    </span>
  );
}
