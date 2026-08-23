import { describe, expect, it } from "vitest";
import { extractMarkersFromLabText } from "./text-lab-extractor";

describe("extractMarkersFromLabText", () => {
  it("parses common English lab lines and maps ids", () => {
    const text = `
      Patient Name: Example
      Total Cholesterol 134 mg/dL
      LDL Cholesterol 67.6 mg/dL
      HDL Cholesterol: 56 mg/dL
      Fasting Glucose .... 92 mg/dL
      ALT (SGPT) 28 U/L
      Hemoglobin 15.2 g/dL
    `;
    const result = extractMarkersFromLabText(text);
    expect(result.method).toBe("text-lab");
    const byId = Object.fromEntries(
      result.markers
        .filter((m) => m.biomarkerId)
        .map((m) => [m.biomarkerId, m]),
    );
    expect(byId["total-cholesterol"]?.value).toBe(134);
    expect(byId["ldl-cholesterol"]?.value).toBe(67.6);
    expect(byId["hdl-cholesterol"]?.value).toBe(56);
    expect(byId["glucose-fasting"]?.value).toBe(92);
    expect(byId.alt?.value).toBe(28);
    expect(byId.hemoglobin?.value).toBe(15.2);
  });

  it("parses Spanish clinic Resultado + dotted CBC lines", () => {
    const text = `
      ANALISIS DE SANGRE
      HEMATIES .................................................. 4.950.000 /mmc [ 3800000 - 5700000 ]
      Hemoglobina ........................................... 14,70 g/dL [ 11,5 - 18 ]
      Hb Corpuscular Media (HCM) ................. 29,7 pg [ 25 - 35 ]
      C. Hb Corpuscular Media (CHCM) .......... 33,4 g/dL [ 28,5 - 37 ]
      SIDEREMIA [ Srm-Hierro (II+III); c.sust. ]
      Método Cromóforo Ferene
      Resultado ..................................... 107 μg/100mL [ 35 - 150 ]
      Valores de referencia : Niños
      Hombres de 35 a 150 μg/100mL
      Mujeres de 31 a 144 μg/100mL
      COLESTEROL TOTAL [ Srm -Colesterol; c.sust. ]
      Resultado ...................................... 119 mg/100mL [ < 200 ]
      ALT, GPT [ Srm-Alanina-aminotransferasa; c.cat. (37 ºC) ]
      Resultado ...................................... 23 U/L [ 7 - 33 ]
      Hombres de 7 a 33 U/L
    `;
    const result = extractMarkersFromLabText(text);
    const byId = Object.fromEntries(
      result.markers
        .filter((m) => m.biomarkerId)
        .map((m) => [m.biomarkerId, m]),
    );

    expect(byId.rbc?.value).toBe(4950000);
    expect(byId.rbc?.unit).toBe("/uL");
    expect(byId.hemoglobin?.value).toBe(14.7);
    expect(byId.mch?.value).toBeCloseTo(29.7, 1);
    expect(byId.mchc?.value).toBeCloseTo(33.4, 1);
    expect(byId["serum-iron"]?.value).toBe(107);
    expect(byId["total-cholesterol"]?.value).toBe(119);
    expect(byId.alt?.value).toBe(23);
    // Reference-range prose must not become markers
    expect(result.markers.every((m) => !/hombres|mujeres/i.test(m.name))).toBe(
      true,
    );
  });
});
