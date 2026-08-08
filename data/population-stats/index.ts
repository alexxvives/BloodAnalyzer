import type { Demographic, PopulationStat } from "@/lib/types";
import statsJson from "./v1/stats.json";

type PopulationDataset = {
  version: string;
  reviewStatus: string;
  notes: string;
  stats: PopulationStat[];
};

const dataset = statsJson as PopulationDataset;

export function getPopulationDataset(): PopulationDataset {
  return dataset;
}

export function getPopulationStat(
  biomarkerId: string,
  demographic: Demographic,
): PopulationStat | undefined {
  return dataset.stats.find((stat) => {
    if (stat.biomarkerId !== biomarkerId) return false;
    if (stat.demographic.sex !== demographic.sex) return false;
    if (demographic.ageYears < stat.demographic.ageMin) return false;
    if (demographic.ageYears > stat.demographic.ageMax) return false;
    return true;
  });
}
