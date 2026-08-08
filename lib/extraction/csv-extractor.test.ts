import { describe, expect, it } from "vitest";
import { csvExtractor, parseLabValue } from "./csv-extractor";

describe("parseLabValue", () => {
  it("parses plain and inequality values", () => {
    expect(parseLabValue("67.6")).toEqual({ value: 67.6 });
    expect(parseLabValue("<6.2")).toEqual({
      value: 6.2,
      valueDisplay: "<6.2",
    });
  });
});

describe("csvExtractor", () => {
  it("maps known marker names to ids", async () => {
    const csv = [
      "name,value,unit",
      "LDL Cholesterol,67.6,mg/dL",
      "HDL,56,mg/dL",
      "Mystery Marker,1,u",
    ].join("\n");

    const result = await csvExtractor.extract(
      new Blob([csv], { type: "text/csv" }),
      { name: "labs.csv", type: "text/csv" },
    );

    expect(result.method).toBe("csv");
    expect(result.markers[0].biomarkerId).toBe("ldl-cholesterol");
    expect(result.markers[1].biomarkerId).toBe("hdl-cholesterol");
    expect(result.markers[2].biomarkerId).toBeNull();
    expect(result.warnings.some((w) => w.includes("Mystery Marker"))).toBe(
      true,
    );
  });
});
