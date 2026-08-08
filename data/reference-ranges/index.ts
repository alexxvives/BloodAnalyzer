import type { Demographic, ReferenceRange } from "@/lib/types";
import markersJson from "./v1/markers.json";
import type { ReferenceRangeDataset } from "./v1/schema";

const dataset = markersJson as ReferenceRangeDataset;

export function getReferenceRangeDataset(): ReferenceRangeDataset {
  return dataset;
}

export function listReferenceRanges(): ReferenceRange[] {
  return dataset.markers;
}

/**
 * Pick the best matching range row for a biomarker + demographic.
 * Prefers sex-specific rows over generic; returns undefined if none match.
 */
export function getReferenceRange(
  biomarkerId: string,
  demographic?: Demographic,
): ReferenceRange | undefined {
  const candidates = dataset.markers.filter((m) => m.biomarkerId === biomarkerId);
  if (candidates.length === 0) return undefined;

  if (!demographic) {
    return candidates.find((m) => !m.demographic?.sex || m.demographic.sex === "any")
      ?? candidates[0];
  }

  const sexMatch = candidates.find((m) => {
    const sex = m.demographic?.sex;
    if (!sex || sex === "any") return false;
    if (sex !== demographic.sex) return false;
    return matchesAge(m, demographic.ageYears);
  });
  if (sexMatch) return sexMatch;

  const anyMatch = candidates.find((m) => {
    const sex = m.demographic?.sex;
    if (sex && sex !== "any") return false;
    return matchesAge(m, demographic.ageYears);
  });
  return anyMatch;
}

function matchesAge(range: ReferenceRange, ageYears: number): boolean {
  const { ageMin, ageMax } = range.demographic ?? {};
  if (ageMin != null && ageYears < ageMin) return false;
  if (ageMax != null && ageYears > ageMax) return false;
  return true;
}
