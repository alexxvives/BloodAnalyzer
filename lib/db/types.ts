import type { Demographic, DemographicSex } from "@/lib/types";

export type ProfileRow = {
  userId: string;
  ageYears: number | null;
  sex: DemographicSex | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportRow = {
  id: string;
  userId: string;
  sourceFileKey: string | null;
  sourceFileName: string | null;
  collectedAt: string | null;
  /** Snapshot at save time — used for scoring saved/history views */
  demographicSex: DemographicSex | null;
  demographicAgeYears: number | null;
  createdAt: string;
  updatedAt: string;
};

export type BiomarkerResultRow = {
  id: string;
  reportId: string;
  userId: string;
  biomarkerId: string | null;
  name: string;
  value: number | null;
  valueDisplay: string | null;
  unit: string;
  createdAt: string;
};

export type SaveReportInput = {
  userId: string;
  sourceFileKey?: string | null;
  sourceFileName?: string | null;
  /** ISO date/time when the lab sample was collected (not upload time). */
  collectedAt?: string | null;
  demographic?: Demographic | null;
  markers: Array<{
    biomarkerId: string | null;
    name: string;
    value: number | null;
    valueDisplay?: string;
    unit: string;
  }>;
};

/** Prefer persisted snapshot; null when legacy rows predate migration. */
export function demographicFromReport(
  report: Pick<ReportRow, "demographicSex" | "demographicAgeYears">,
): Demographic | null {
  if (
    report.demographicSex == null ||
    report.demographicAgeYears == null ||
    !Number.isFinite(report.demographicAgeYears)
  ) {
    return null;
  }
  return {
    sex: report.demographicSex,
    ageYears: report.demographicAgeYears,
  };
}
