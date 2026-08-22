import { describe, expect, it } from "vitest";
import {
  givenMarkerPhrase,
  plainMarkerCue,
  stripLabValues,
} from "./action-plan-language";

describe("action-plan-language", () => {
  it("describes high LDL without numbers", () => {
    const cue = plainMarkerCue({
      id: "ldl-cholesterol",
      name: "LDL Cholesterol",
      section: "Lipids",
      value: 160,
      unit: "mg/dL",
      status: "attention",
      labStatus: "out_of_range",
    });
    expect(cue).toMatch(/higher LDL/i);
    expect(cue).not.toMatch(/160|mg/);
    expect(givenMarkerPhrase({
      id: "ldl-cholesterol",
      name: "LDL",
      section: "Lipids",
      value: 160,
      unit: "mg/dL",
      status: "attention",
      labStatus: "out_of_range",
    })).toMatch(/^given /i);
  });

  it("describes low HDL as below-optimal / lower", () => {
    const cue = plainMarkerCue({
      id: "hdl-cholesterol",
      name: "HDL",
      section: "Lipids",
      value: 38,
      unit: "mg/dL",
      status: "fair",
      labStatus: "in_range",
    });
    expect(cue).toMatch(/below-optimal HDL|lower HDL/i);
    expect(cue).not.toMatch(/38|mg/);
  });

  it("strips lab values from free text", () => {
    expect(stripLabValues("HDL Cholesterol 56 mg/dL supports heart health")).toBe(
      "HDL Cholesterol supports heart health",
    );
  });

  it("describes kidney markers without numbers", () => {
    expect(
      plainMarkerCue({
        id: "urea",
        name: "Urea",
        section: "Kidney",
        value: 52,
        unit: "mg/dL",
        status: "attention",
        labStatus: "out_of_range",
      }),
    ).toMatch(/higher urea/i);

    expect(
      plainMarkerCue({
        id: "egfr",
        name: "eGFR",
        section: "Kidney",
        value: 58,
        unit: "mL/min/1.73m2",
        status: "attention",
        labStatus: "out_of_range",
      }),
    ).toMatch(/lower eGFR|eGFR/i);
  });

  it("never returns a bare marker name without grade/direction", () => {
    const optimal = plainMarkerCue({
      id: "creatinine",
      name: "Creatinine",
      section: "Kidney",
      value: 0.9,
      unit: "mg/dL",
      status: "optimal",
      labStatus: "in_range",
    });
    expect(optimal).toMatch(/optimal creatinine/i);
    expect(givenMarkerPhrase({
      id: "creatinine",
      name: "Creatinine",
      section: "Kidney",
      value: 0.9,
      unit: "mg/dL",
      status: "optimal",
      labStatus: "in_range",
    })).toBe("given your optimal creatinine");
  });
});
