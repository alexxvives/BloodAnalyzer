import { readFileSync } from "fs";
import { extractMarkersFromBandStyleText } from "../../lib/extraction/band-style-extractor.ts";

const text = readFileSync(".firecrawl/results-raw.txt", "utf8");
const r = extractMarkersFromBandStyleText(text);
console.log("count", r.markers.length);
console.log("mapped", r.markers.filter((m) => m.biomarkerId).length);
for (const m of r.markers) {
  console.log(
    (m.biomarkerId ?? "?") + " | " + m.name + " = " + (m.valueDisplay ?? m.value) + " " + m.unit,
  );
}
