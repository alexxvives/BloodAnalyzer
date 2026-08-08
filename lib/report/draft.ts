import type { ExtractedMarker } from "@/lib/extraction";
import type { Demographic } from "@/lib/types";

export type ReportDraft = {
  demographic: Demographic;
  markers: ExtractedMarker[];
  sourceFileName?: string;
  confirmedAt: string;
};

const STORAGE_KEY = "blood-analyzer.report-draft";

export function saveReportDraft(draft: ReportDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function loadReportDraft(): ReportDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReportDraft;
  } catch {
    return null;
  }
}

export function clearReportDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
