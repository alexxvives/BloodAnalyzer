"use client";

import { CloseButton } from "@/components/ui/CloseButton";
import { ActionPlanCardSkeleton } from "@/components/ui/Skeleton";
import {
  type ActionPlanBlock,
  type ActionPlanFoodItem,
  type ActionPlanMarkerInput,
  type ActionPlanResult,
} from "@/lib/report/action-plan";
import {
  givenMarkerPhrase,
  plainMarkerCue,
} from "@/lib/report/action-plan-language";
import type { Demographic } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type ActionPlanCardProps = {
  demographic: Demographic;
  markers: ActionPlanMarkerInput[];
};

export function ActionPlanCard({ demographic, markers }: ActionPlanCardProps) {
  const [plan, setPlan] = useState<ActionPlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const priorityMarkers = useMemo(
    () =>
      markers.filter(
        (m) =>
          m.status === "attention" ||
          m.status === "fair" ||
          m.labStatus === "out_of_range",
      ),
    [markers],
  );

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        demographic,
        markers: markers.map((m) => [
          m.id,
          m.value,
          m.valueDisplay,
          m.status,
          m.labStatus,
        ]),
      }),
    [demographic, markers],
  );

  useEffect(() => {
    if (markers.length === 0) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setPlan(null);

    void fetch("/api/action-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demographic, markers }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          plan?: ActionPlanResult;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "Could not generate action plan");
        }
        if (!data.plan) throw new Error("Empty action plan");
        setPlan(data.plan);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setPlan(null);
        setError(err instanceof Error ? err.message : "Action plan failed");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [demographic, markers, requestKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div
        id="action-plan"
        className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm"
      >
        <h3 className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight">
          Action plan
        </h3>
        <p className="mt-1 text-xs text-muted">
          Lifestyle ideas shaped by your flagged biomarkers — not medical
          advice.
        </p>

        {loading ? <ActionPlanCardSkeleton /> : null}

        {!loading && error ? (
          <div className="mt-4 flex flex-1 flex-col">
            <p className="text-sm leading-relaxed text-muted">{error}</p>
            <p className="mt-2 text-xs text-muted">
              Lifestyle suggestions only — not medical advice.
            </p>
          </div>
        ) : null}

        {plan ? (
          <div className="mt-4 flex flex-1 flex-col">
            <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
              <MarkedSummary
                text={plan.summary}
                markers={priorityMarkers}
              />
            </p>
            {plan.focus.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {plan.focus.slice(0, 3).map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-border bg-surface-muted/50 px-2.5 py-0.5 text-[11px] text-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-auto pt-5 text-left text-sm font-medium text-accent transition hover:underline"
            >
              View daily routine →
            </button>
          </div>
        ) : null}
      </div>

      {open && plan ? (
        <ActionPlanModal
          plan={plan}
          priorityMarkers={priorityMarkers}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function ActionPlanModal({
  plan,
  priorityMarkers,
  onClose,
}: {
  plan: ActionPlanResult;
  priorityMarkers: ActionPlanMarkerInput[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-sidebar/40 p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close action plan"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-plan-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <p className="ba-eyebrow">Daily routine</p>
            <h2
              id="action-plan-title"
              className="mt-1 font-[family-name:var(--font-fraunces)] text-2xl tracking-tight"
            >
              Your action plan
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">
              <MarkedSummary text={plan.summary} markers={priorityMarkers} />
            </p>
          </div>
          <CloseButton onClick={onClose} label="Close action plan" />
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <ol className="relative space-y-0 border-l border-border pl-5">
            {plan.routine.map((block) => (
              <RoutineBlock
                key={`${block.time}-${block.title}`}
                block={block}
                markers={priorityMarkers}
              />
            ))}
          </ol>

          {plan.focus.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-border bg-surface-muted/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Focus areas
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                {plan.focus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RoutineBlock({
  block,
  markers,
}: {
  block: ActionPlanBlock;
  markers: ActionPlanMarkerInput[];
}) {
  return (
    <li className="relative pb-6 last:pb-0">
      <span
        className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-accent bg-surface"
        aria-hidden
      />
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-mono text-xs font-semibold tabular-nums text-accent">
          {block.time}
        </span>
        <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
          {block.title}
        </span>
      </div>
      <ul className="mt-2 space-y-2.5">
        {block.items.map((item) => (
          <PlanFoodLine
            key={`${item.food}-${item.marker ?? ""}-${item.why}`}
            item={item}
            markers={markers}
          />
        ))}
      </ul>
      {block.note ? (
        <p className="mt-1.5 text-xs italic text-muted">{block.note}</p>
      ) : null}
    </li>
  );
}

function PlanFoodLine({
  item,
  markers,
}: {
  item: ActionPlanFoodItem;
  markers: ActionPlanMarkerInput[];
}) {
  const tip =
    item.why ||
    (item.marker
      ? tipForMarkerLabel(item.marker, markers)
      : undefined);
  const action = item.food.replace(/[.!?]\s*$/, "");

  return (
    <li className="text-sm leading-relaxed text-foreground">
      <span className="font-medium">{action}</span>
      {item.marker ? (
        <>
          {" — "}
          <WordTip label={item.marker} tip={tip} />
        </>
      ) : null}
      <span aria-hidden>.</span>
    </li>
  );
}

function tipForMarkerLabel(
  label: string,
  markers: ActionPlanMarkerInput[],
): string | undefined {
  const lower = label.toLowerCase();
  const hit = markers.find((m) => {
    const cue = plainMarkerCue(m).toLowerCase();
    const given = givenMarkerPhrase(m).toLowerCase();
    return (
      lower === cue ||
      lower === given ||
      lower.includes(cue) ||
      lower.includes(m.name.toLowerCase())
    );
  });
  if (!hit) return undefined;
  const cue = plainMarkerCue(hit);
  if (hit.status === "attention" || hit.labStatus === "out_of_range") {
    return `Paired with ${cue} — a lifestyle idea to discuss with your clinician, not a diagnosis.`;
  }
  if (hit.status === "fair") {
    return `Paired with ${cue} — small daily choices people often use while aiming toward optimal.`;
  }
  if (hit.status === "optimal" || hit.status === "good") {
    return `Paired with ${cue} — keep supporting habits while this marker looks steady.`;
  }
  return `Paired with ${cue}.`;
}

/** Hoverable marker word — tip appears only for that word */
function WordTip({ label, tip }: { label: string; tip?: string }) {
  if (!tip) {
    return (
      <span className="font-medium text-accent/90">{label}</span>
    );
  }

  return (
    <span className="group/tip relative inline-block">
      <span className="cursor-help font-medium text-accent underline decoration-accent/40 decoration-dotted underline-offset-4 transition hover:decoration-accent">
        {label}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-max max-w-[16rem] -translate-x-1/2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-left text-[11px] font-normal leading-snug text-foreground opacity-0 shadow-lg transition group-hover/tip:opacity-100"
      >
        {tip}
      </span>
    </span>
  );
}

/** Highlight plain-language marker cues inside summary for word-level hover */
function MarkedSummary({
  text,
  markers,
}: {
  text: string;
  markers: ActionPlanMarkerInput[];
}) {
  const refs = markers
    .flatMap((m) => [givenMarkerPhrase(m), plainMarkerCue(m)])
    .filter(Boolean);
  if (refs.length === 0) return <>{text}</>;

  const sorted = [...new Set(refs)].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `(${sorted.map(escapeRegExp).join("|")})`,
    "gi",
  );
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const match = sorted.find(
          (r) => r.toLowerCase() === part.toLowerCase(),
        );
        if (!match) return <span key={`${part}-${i}`}>{part}</span>;
        return (
          <WordTip
            key={`${part}-${i}`}
            label={part}
            tip={tipForMarkerLabel(match, markers)}
          />
        );
      })}
    </>
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
