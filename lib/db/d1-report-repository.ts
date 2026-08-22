import type {
  BiomarkerResultRow,
  ReportRow,
  SaveReportInput,
} from "@/lib/db/types";
import type { DemographicSex } from "@/lib/types";
import type { ReportRepository } from "@/lib/db/report-repository";

function id(): string {
  return crypto.randomUUID();
}

/** D1-backed reports — every query filters by user_id. */
export function createD1ReportRepository(db: D1Database): ReportRepository {
  return {
    async saveReport(input) {
      const now = new Date().toISOString();
      const reportId = id();
      const sex = input.demographic?.sex ?? null;
      const ageYears = input.demographic?.ageYears ?? null;
      const collectedAt = input.collectedAt ?? null;

      await db
        .prepare(
          `INSERT INTO reports (
             id, user_id, source_file_key, source_file_name, collected_at,
             demographic_sex, demographic_age_years, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          reportId,
          input.userId,
          input.sourceFileKey ?? null,
          input.sourceFileName ?? null,
          collectedAt,
          sex,
          ageYears,
          now,
          now,
        )
        .run();

      if (input.demographic) {
        await db
          .prepare(
            `UPDATE profiles
             SET age_years = ?, sex = ?, updated_at = ?
             WHERE user_id = ?`,
          )
          .bind(ageYears, sex, now, input.userId)
          .run();
      }

      if (input.markers.length > 0) {
        const stmt = db.prepare(
          `INSERT INTO biomarker_results
            (id, report_id, user_id, biomarker_id, name, value, value_display, unit, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        await db.batch(
          input.markers.map((marker) =>
            stmt.bind(
              id(),
              reportId,
              input.userId,
              marker.biomarkerId,
              marker.name,
              marker.value,
              marker.valueDisplay ?? null,
              marker.unit,
              now,
            ),
          ),
        );
      }

      return {
        id: reportId,
        userId: input.userId,
        sourceFileKey: input.sourceFileKey ?? null,
        sourceFileName: input.sourceFileName ?? null,
        collectedAt,
        demographicSex: sex,
        demographicAgeYears: ageYears,
        createdAt: now,
        updatedAt: now,
      };
    },

    async listReportsForUser(userId) {
      const { results } = await db
        .prepare(
          `SELECT id, user_id, source_file_key, source_file_name, collected_at,
                  demographic_sex, demographic_age_years, created_at, updated_at
           FROM reports WHERE user_id = ?
           ORDER BY COALESCE(collected_at, created_at) DESC`,
        )
        .bind(userId)
        .all<D1ReportRow>();

      return (results ?? []).map(mapReport);
    },

    async listReportsWithMarkersForUser(userId) {
      const reports = await this.listReportsForUser(userId);
      if (reports.length === 0) return [];

      const { results } = await db
        .prepare(
          `SELECT id, report_id, user_id, biomarker_id, name, value, value_display, unit, created_at
           FROM biomarker_results WHERE user_id = ?`,
        )
        .bind(userId)
        .all<{
          id: string;
          report_id: string;
          user_id: string;
          biomarker_id: string | null;
          name: string;
          value: number | null;
          value_display: string | null;
          unit: string;
          created_at: string;
        }>();

      const byReport = new Map<string, BiomarkerResultRow[]>();
      for (const row of results ?? []) {
        const list = byReport.get(row.report_id) ?? [];
        list.push({
          id: row.id,
          reportId: row.report_id,
          userId: row.user_id,
          biomarkerId: row.biomarker_id,
          name: row.name,
          value: row.value,
          valueDisplay: row.value_display,
          unit: row.unit,
          createdAt: row.created_at,
        });
        byReport.set(row.report_id, list);
      }

      return reports.map((report) => ({
        report,
        markers: byReport.get(report.id) ?? [],
      }));
    },

    async getReportForUser(userId, reportId) {
      const report = await db
        .prepare(
          `SELECT id, user_id, source_file_key, source_file_name, collected_at,
                  demographic_sex, demographic_age_years, created_at, updated_at
           FROM reports WHERE id = ? AND user_id = ?`,
        )
        .bind(reportId, userId)
        .first<D1ReportRow>();

      if (!report) return null;

      const { results } = await db
        .prepare(
          `SELECT id, report_id, user_id, biomarker_id, name, value, value_display, unit, created_at
           FROM biomarker_results WHERE report_id = ? AND user_id = ?`,
        )
        .bind(reportId, userId)
        .all<{
          id: string;
          report_id: string;
          user_id: string;
          biomarker_id: string | null;
          name: string;
          value: number | null;
          value_display: string | null;
          unit: string;
          created_at: string;
        }>();

      return {
        report: mapReport(report),
        markers: (results ?? []).map(
          (row): BiomarkerResultRow => ({
            id: row.id,
            reportId: row.report_id,
            userId: row.user_id,
            biomarkerId: row.biomarker_id,
            name: row.name,
            value: row.value,
            valueDisplay: row.value_display,
            unit: row.unit,
            createdAt: row.created_at,
          }),
        ),
      };
    },

    async deleteReportForUser(userId, reportId) {
      const existing = await db
        .prepare(
          `SELECT id, user_id, source_file_key, source_file_name, collected_at,
                  demographic_sex, demographic_age_years, created_at, updated_at
           FROM reports WHERE id = ? AND user_id = ?`,
        )
        .bind(reportId, userId)
        .first<D1ReportRow>();

      if (!existing) return null;

      // biomarker_results cascade via FK; still scope by user_id explicitly.
      await db
        .prepare(`DELETE FROM biomarker_results WHERE report_id = ? AND user_id = ?`)
        .bind(reportId, userId)
        .run();
      await db
        .prepare(`DELETE FROM reports WHERE id = ? AND user_id = ?`)
        .bind(reportId, userId)
        .run();

      return mapReport(existing);
    },

    async updateCollectedAtForUser(userId, reportId, collectedAt) {
      const now = new Date().toISOString();
      const existing = await db
        .prepare(
          `SELECT id, user_id, source_file_key, source_file_name, collected_at,
                  demographic_sex, demographic_age_years, created_at, updated_at
           FROM reports WHERE id = ? AND user_id = ?`,
        )
        .bind(reportId, userId)
        .first<D1ReportRow>();

      if (!existing) return null;

      await db
        .prepare(
          `UPDATE reports
           SET collected_at = ?, updated_at = ?
           WHERE id = ? AND user_id = ?`,
        )
        .bind(collectedAt, now, reportId, userId)
        .run();

      return mapReport({
        ...existing,
        collected_at: collectedAt,
        updated_at: now,
      });
    },
  };
}

type D1ReportRow = {
  id: string;
  user_id: string;
  source_file_key: string | null;
  source_file_name: string | null;
  collected_at: string | null;
  demographic_sex: string | null;
  demographic_age_years: number | null;
  created_at: string;
  updated_at: string;
};

function mapReport(row: D1ReportRow): ReportRow {
  const sex = row.demographic_sex;
  const demographicSex: DemographicSex | null =
    sex === "male" || sex === "female" || sex === "other" ? sex : null;

  return {
    id: row.id,
    userId: row.user_id,
    sourceFileKey: row.source_file_key,
    sourceFileName: row.source_file_name,
    collectedAt: row.collected_at,
    demographicSex,
    demographicAgeYears: row.demographic_age_years,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
