/**
 * Canonical biomarker schema — every card is driven by this type.
 * Ranges and population stats must come from /data/* — never invented in UI.
 */

export type BiomarkerStatus = "optimal" | "good" | "fair" | "attention";

export type LabRangeStatus = "in_range" | "out_of_range" | "unknown";

export type SourceRef = {
  label: string;
  citation?: string;
  url?: string;
  /** ISO date the citation was last verified; null = not yet verified */
  verifiedAt?: string | null;
};

export type ReferenceRangeBand = {
  status: BiomarkerStatus;
  /** Inclusive lower bound in the biomarker's unit; null = unbounded */
  min: number | null;
  /** Inclusive upper bound; null = unbounded */
  max: number | null;
};

export type DemographicSex = "male" | "female" | "other";

export type DemographicSlice = {
  sex?: DemographicSex | "any";
  ageMin?: number;
  ageMax?: number;
};

export type Demographic = {
  sex: DemographicSex;
  ageYears: number;
};

export type ReferenceRange = {
  biomarkerId: string;
  /** Display name from the data layer (optional on score results) */
  name?: string;
  subtitle?: string;
  sectionId?: string;
  unit: string;
  /** LOINC or other coding system id when available */
  loincCode?: string;
  bands: ReferenceRangeBand[];
  /** Standard lab low/high when distinct from optimization bands */
  labLow?: number | null;
  labHigh?: number | null;
  sourceRefs: SourceRef[];
  /** When false, UI must show "range not available" */
  sourced: boolean;
  /** Optional demographic applicability (e.g. sex-specific HDL / hemoglobin) */
  demographic?: DemographicSlice;
};

export type PopulationStat = {
  biomarkerId: string;
  demographic: {
    sex: "male" | "female" | "other";
    ageMin: number;
    ageMax: number;
  };
  mean?: number;
  median?: number;
  unit: string;
  dataset: string;
  sourceRefs: SourceRef[];
  sourced: boolean;
};

export type Biomarker = {
  id: string;
  name: string;
  /** Plain-language subtitle, e.g. "'Bad' cholesterol indicator" */
  subtitle?: string;
  unit: string;
  value: number | null;
  /** Display string when value is a censored lab result, e.g. "<6.2" */
  valueDisplay?: string;
  range: ReferenceRange | null;
  status: BiomarkerStatus | null;
  labStatus: LabRangeStatus;
  explanation?: string;
  recommendedAction?: string;
  sourceRefs: SourceRef[];
  sectionId: string;
  /**
   * True when this marker is part of the expected panel but was not present
   * in the uploaded analytic — shown gray as "not tested".
   */
  notTested?: boolean;
  /**
   * When notTested, true if a measured fair/attention/out-of-range marker
   * commonly co-occurs with this slot (educational suggestion only).
   */
  suggestedTest?: boolean;
  /** Non-diagnostic copy explaining why this untested slot is highlighted */
  suggestedTestReason?: string;
};
