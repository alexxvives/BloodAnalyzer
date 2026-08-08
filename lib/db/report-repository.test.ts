import { beforeEach, describe, expect, it } from "vitest";
import { memoryReportRepository } from "./report-repository";

describe("memoryReportRepository", () => {
  beforeEach(async () => {
    // isolate by using unique user ids per test
  });

  it("never returns another user's report", async () => {
    const a = await memoryReportRepository.saveReport({
      userId: "user-a",
      markers: [
        {
          biomarkerId: "ldl-cholesterol",
          name: "LDL",
          value: 100,
          unit: "mg/dL",
        },
      ],
    });
    await memoryReportRepository.saveReport({
      userId: "user-b",
      markers: [
        {
          biomarkerId: "hdl-cholesterol",
          name: "HDL",
          value: 50,
          unit: "mg/dL",
        },
      ],
    });

    const stolen = await memoryReportRepository.getReportForUser(
      "user-b",
      a.id,
    );
    expect(stolen).toBeNull();

    const own = await memoryReportRepository.getReportForUser("user-a", a.id);
    expect(own?.markers).toHaveLength(1);
    expect(own?.markers[0].userId).toBe("user-a");
  });
});
