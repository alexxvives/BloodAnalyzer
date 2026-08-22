"use client";

import type { ExtractedMarker, ExtractionResult } from "@/lib/extraction/types";
import {
  CANONICAL_MARKER_NAMES,
  KNOWN_BIOMARKER_IDS,
} from "@/lib/extraction/name-map";
import { saveReportDraft } from "@/lib/report/draft";
import type { Demographic, DemographicSex } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

type Step = "upload" | "confirm";
type ProgressPhase = "idle" | "reading" | "uploading" | "analyzing" | "done";

const KNOWN_IDS = KNOWN_BIOMARKER_IDS;

const PHASE_LABEL: Record<Exclude<ProgressPhase, "idle" | "done">, string> = {
  reading: "Reading file…",
  uploading: "Uploading securely…",
  analyzing: "Extracting biomarkers…",
};

export function UploadFlow() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string>();
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<ProgressPhase>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [markers, setMarkers] = useState<ExtractedMarker[]>([]);
  const [uploadKey, setUploadKey] = useState<string | null>(null);
  const [sex, setSex] = useState<DemographicSex>("male");
  const [ageYears, setAgeYears] = useState(27);
  const [collectedDate, setCollectedDate] = useState("");

  const demographic: Demographic = useMemo(
    () => ({ sex, ageYears }),
    [sex, ageYears],
  );

  async function processFile(file: File) {
    setBusy(true);
    setError(null);
    setFileName(file.name);
    setPhase("reading");
    setProgress(12);

    try {
      await tick(180);
      setPhase("uploading");
      setProgress(35);

      const body = new FormData();
      body.set("file", file);

      setPhase("analyzing");
      setProgress(55);

      const res = await fetch("/api/extract", { method: "POST", body });
      setProgress(85);

      const data = (await res.json()) as {
        error?: string;
        extraction?: ExtractionResult;
        upload?: { key?: string };
      };
      if (res.status === 401) {
        throw new Error("Please log in to upload lab files.");
      }
      if (!res.ok || !data.extraction) {
        throw new Error(data.error ?? "Extraction failed");
      }

      setProgress(100);
      setPhase("done");
      setUploadKey(data.upload?.key ?? null);
      setMarkers(data.extraction.markers);
      setWarnings(data.extraction.warnings);
      setStep("confirm");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setPhase("idle");
      setProgress(0);
    } finally {
      setBusy(false);
    }
  }

  function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    void processFile(file);
  }

  function startManual() {
    setFileName(undefined);
    setWarnings([
      "Manual entry — fill in values you have from your lab report.",
    ]);
    setMarkers(
      KNOWN_IDS.map((id) => ({
        biomarkerId: id,
        name: id,
        value: null,
        unit: "",
        confidence: 1,
      })),
    );
    setStep("confirm");
  }

  function updateMarker(index: number, patch: Partial<ExtractedMarker>) {
    setMarkers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  }

  function addRow() {
    setMarkers((prev) => [
      ...prev,
      {
        biomarkerId: null,
        name: "",
        value: null,
        unit: "",
        confidence: 1,
      },
    ]);
  }

  function removeRow(index: number) {
    setMarkers((prev) => prev.filter((_, i) => i !== index));
  }

  async function confirm() {
    const cleaned = markers.filter(
      (m) => m.name.trim() || m.biomarkerId || m.value != null,
    );
    if (cleaned.length === 0) {
      setError("Add at least one marker before continuing.");
      return;
    }
    if (!collectedDate.trim()) {
      setError("Choose the date this blood test was collected.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const saveRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceFileKey: uploadKey,
          sourceFileName: fileName,
          collectedAt: collectedDate,
          demographic,
          markers: cleaned,
        }),
      });
      if (saveRes.status === 401) {
        throw new Error("Please log in to save your report.");
      }
      const saveData = (await saveRes.json()) as {
        error?: string;
        report?: { id?: string };
      };
      if (!saveRes.ok || !saveData.report?.id) {
        throw new Error(saveData.error ?? "Could not save report to your account.");
      }

      saveReportDraft({
        demographic,
        markers: cleaned,
        sourceFileName: fileName,
        confirmedAt: new Date().toISOString(),
      });
      router.push(`/report/${saveData.report.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save report. Draft was not opened.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (step === "confirm") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Confirm extracted values</h2>
          <p className="mt-1 text-sm text-muted">
            Extraction is imperfect. Correct anything wrong before the report is
            generated.
          </p>
        </div>

        {warnings.length > 0 ? (
          <ul className="space-y-1 rounded-xl border border-status-fair/40 bg-status-fair/10 px-4 py-3 text-sm text-foreground">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm sm:col-span-1">
            <span className="text-muted">Test date</span>
            <input
              type="date"
              required
              max={todayInputValue()}
              className="ba-field mt-1"
              value={collectedDate}
              onChange={(e) => setCollectedDate(e.target.value)}
            />
            <span className="mt-1 block text-xs text-muted">
              When was this blood test collected? (not the upload day)
            </span>
          </label>
          <label className="block text-sm">
            <span className="text-muted">Biological sex</span>
            <select
              className="ba-field ba-select mt-1"
              value={sex}
              onChange={(e) => setSex(e.target.value as DemographicSex)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-muted">Age (years)</span>
            <input
              type="number"
              min={1}
              max={120}
              className="ba-field mt-1"
              value={ageYears}
              onChange={(e) => setAgeYears(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Marker</th>
                <th className="px-3 py-2 font-medium">Mapped id</th>
                <th className="px-3 py-2 font-medium">Value</th>
                <th className="px-3 py-2 font-medium">Unit</th>
                <th className="px-3 py-2 font-medium">Confidence</th>
                <th className="px-3 py-2 font-medium">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {markers.map((marker, index) => (
                <tr key={index} className="border-b border-border/70">
                  <td className="px-3 py-2">
                    <input
                      className="ba-field ba-field-sm"
                      value={marker.name}
                      onChange={(e) =>
                        updateMarker(index, { name: e.target.value })
                      }
                    />
                  </td>
                  <td className="px-3 py-2 min-w-[11rem]">
                    <select
                      className="ba-field ba-field-sm ba-select"
                      value={marker.biomarkerId ?? ""}
                      onChange={(e) =>
                        updateMarker(index, {
                          biomarkerId: e.target.value || null,
                        })
                      }
                    >
                      <option value="">Unmapped</option>
                      {KNOWN_IDS.map((id) => (
                        <option key={id} value={id}>
                          {CANONICAL_MARKER_NAMES[id] ?? id}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="ba-field ba-field-sm w-28"
                      value={
                        marker.valueDisplay ??
                        (marker.value == null ? "" : String(marker.value))
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        const n = Number(raw);
                        updateMarker(index, {
                          valueDisplay: raw,
                          value: raw === "" || Number.isNaN(n) ? null : n,
                        });
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="ba-field ba-field-sm w-24"
                      value={marker.unit}
                      onChange={(e) =>
                        updateMarker(index, { unit: e.target.value })
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {Math.round(marker.confidence * 100)}%
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-xs font-medium text-muted underline-offset-2 hover:text-status-attention hover:underline"
                      onClick={() => removeRow(index)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error ? <p className="text-sm text-status-attention">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="ba-btn ba-btn-secondary"
            onClick={() => {
              setStep("upload");
              setError(null);
              setPhase("idle");
              setProgress(0);
            }}
          >
            Back
          </button>
          <button
            type="button"
            className="ba-btn ba-btn-secondary"
            onClick={addRow}
          >
            Add row
          </button>
          <button
            type="button"
            className="ba-btn ba-btn-primary"
            disabled={busy}
            onClick={() => void confirm()}
          >
            {busy ? "Saving…" : "Confirm & view report"}
          </button>
        </div>
      </div>
    );
  }

  const showProgress = busy || phase === "done";

  return (
    <div className="space-y-6">
      <label
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (busy) return;
          const file = e.dataTransfer.files?.[0];
          if (file) void processFile(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center transition ${
          dragOver
            ? "scale-[1.01] border-accent bg-accent/15 ring-2 ring-accent/30"
            : "border-accent/50 bg-accent-soft hover:border-accent"
        } ${busy ? "pointer-events-none opacity-90" : ""}`}
      >
        <span className="font-medium text-foreground">
          {dragOver
            ? "Release to drop file"
            : busy
              ? PHASE_LABEL[phase as keyof typeof PHASE_LABEL] ??
                "Working…"
              : "Drop a file or click to browse"}
        </span>
        <span className="mt-2 max-w-md text-sm text-muted">
          Prefer a text-based PDF — AI reads the text layer across varied lab
          layouts, then you confirm every value. CSV only works with name,
          value, unit columns. Images need OCR later.
        </span>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept="application/pdf,.pdf,image/*,.png,.jpg,.jpeg,.webp,.csv,text/csv"
          disabled={busy}
          onChange={(e) => {
            onFileChange(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {showProgress ? (
        <div className="space-y-2 rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {phase === "done"
                ? "Analysis complete"
                : (PHASE_LABEL[phase as keyof typeof PHASE_LABEL] ??
                  "Processing…")}
            </span>
            <span className="text-muted">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {fileName ? (
            <p className="truncate text-xs text-muted">File: {fileName}</p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-status-attention">{error}</p> : null}

      <button
        type="button"
        className="text-sm font-medium text-accent underline-offset-2 hover:underline"
        onClick={startManual}
      >
        Skip upload — enter values manually
      </button>
    </div>
  );
}

function tick(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function todayInputValue(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
