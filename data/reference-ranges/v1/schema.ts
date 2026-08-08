import type { ReferenceRange } from "@/lib/types";

export type ReferenceRangeDataset = {
  version: string;
  reviewStatus: "provisional" | "reviewed";
  notes: string;
  markers: ReferenceRange[];
};
