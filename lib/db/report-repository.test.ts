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

  it("deletes only the owner's report", async () => {
    const a = await memoryReportRepository.saveReport({
      userId: "user-del-a",
      markers: [
        {
          biomarkerId: "ldl-cholesterol",
          name: "LDL",
          value: 100,
          unit: "mg/dL",
        },
      ],
    });

    const stolen = await memoryReportRepository.deleteReportForUser(
      "user-del-b",
      a.id,
    );
    expect(stolen).toBeNull();
    expect(
      await memoryReportRepository.getReportForUser("user-del-a", a.id),
    ).not.toBeNull();

    const removed = await memoryReportRepository.deleteReportForUser(
      "user-del-a",
      a.id,
    );
    expect(removed?.id).toBe(a.id);
    expect(
      await memoryReportRepository.getReportForUser("user-del-a", a.id),
    ).toBeNull();
  });

  it("updates collectedAt only for the owner", async () => {
    const report = await memoryReportRepository.saveReport({
      userId: "user-date-a",
      collectedAt: "2026-01-01T12:00:00.000Z",
      markers: [
        {
          biomarkerId: "ldl-cholesterol",
          name: "LDL",
          value: 100,
          unit: "mg/dL",
        },
      ],
    });

    const stolen = await memoryReportRepository.updateCollectedAtForUser(
      "user-date-b",
      report.id,
      "2026-02-02T12:00:00.000Z",
    );
    expect(stolen).toBeNull();

    const updated = await memoryReportRepository.updateCollectedAtForUser(
      "user-date-a",
      report.id,
      "2026-02-02T12:00:00.000Z",
    );
    expect(updated?.collectedAt).toBe("2026-02-02T12:00:00.000Z");
  });
});
