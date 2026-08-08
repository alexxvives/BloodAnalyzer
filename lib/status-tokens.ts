import type { BiomarkerStatus, LabRangeStatus } from "@/lib/types";

/** CSS custom-property names — never inline hex in components */
export const STATUS_CSS_VAR: Record<BiomarkerStatus, string> = {
  optimal: "var(--status-optimal)",
  good: "var(--status-good)",
  fair: "var(--status-fair)",
  attention: "var(--status-attention)",
};

export const STATUS_LABEL: Record<BiomarkerStatus, string> = {
  optimal: "Optimal",
  good: "Good",
  fair: "Fair",
  attention: "Pay attention",
};

export const LAB_STATUS_LABEL: Record<LabRangeStatus, string> = {
  in_range: "Lab: In range",
  out_of_range: "Lab: Out of range",
  unknown: "Lab: Unknown",
};

export function statusTailwindBg(status: BiomarkerStatus): string {
  switch (status) {
    case "optimal":
      return "bg-status-optimal";
    case "good":
      return "bg-status-good";
    case "fair":
      return "bg-status-fair";
    case "attention":
      return "bg-status-attention";
  }
}
