import { allowInMemoryDataStores } from "@/lib/cloudflare/bindings";
import type {
  BiomarkerResultRow,
  ReportRow,
  SaveReportInput,
} from "@/lib/db/types";

export type ReportWithMarkers = {
  report: ReportRow;
  markers: BiomarkerResultRow[];
};

export type ReportRepository = {
  saveReport(input: SaveReportInput): Promise<ReportRow>;
  listReportsForUser(userId: string): Promise<ReportRow[]>;
  listReportsWithMarkersForUser(userId: string): Promise<ReportWithMarkers[]>;
  getReportForUser(
    userId: string,
    reportId: string,
  ): Promise<ReportWithMarkers | null>;
};

type MemoryState = {
  reports: ReportRow[];
  markers: BiomarkerResultRow[];
};

const memory: MemoryState = { reports: [], markers: [] };

function id(): string {
  return crypto.randomUUID();
}

/**
 * In-memory repository mirroring the D1 access pattern:
 * every read/write is scoped by userId (no cross-user access).
 */
export const memoryReportRepository: ReportRepository = {
  async saveReport(input) {
    const now = new Date().toISOString();
    const report: ReportRow = {
      id: id(),
      userId: input.userId,
      sourceFileKey: input.sourceFileKey ?? null,
      sourceFileName: input.sourceFileName ?? null,
      collectedAt: null,
      demographicSex: input.demographic?.sex ?? null,
      demographicAgeYears: input.demographic?.ageYears ?? null,
      createdAt: now,
      updatedAt: now,
    };
    memory.reports.push(report);

    for (const marker of input.markers) {
      memory.markers.push({
        id: id(),
        reportId: report.id,
        userId: input.userId,
        biomarkerId: marker.biomarkerId,
        name: marker.name,
        value: marker.value,
        valueDisplay: marker.valueDisplay ?? null,
        unit: marker.unit,
        createdAt: now,
      });
    }

    return report;
  },

  async listReportsForUser(userId) {
    return memory.reports
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listReportsWithMarkersForUser(userId) {
    const reports = await this.listReportsForUser(userId);
    return reports.map((report) => ({
      report,
      markers: memory.markers.filter(
        (m) => m.reportId === report.id && m.userId === userId,
      ),
    }));
  },

  async getReportForUser(userId, reportId) {
    const report = memory.reports.find(
      (r) => r.id === reportId && r.userId === userId,
    );
    if (!report) return null;
    const markers = memory.markers.filter(
      (m) => m.reportId === reportId && m.userId === userId,
    );
    return { report, markers };
  },
};

export async function getReportRepository(): Promise<ReportRepository> {
  const { getOptionalDb } = await import("@/lib/cloudflare/bindings");
  const { createD1ReportRepository } = await import(
    "@/lib/db/d1-report-repository"
  );
  const db = await getOptionalDb();
  if (db) return createD1ReportRepository(db);
  if (allowInMemoryDataStores()) return memoryReportRepository;
  throw new Error(
    "D1 database binding is required in production. Bind DB in wrangler.jsonc or set ALLOW_MEMORY_STORE=1 for an explicit override.",
  );
}
