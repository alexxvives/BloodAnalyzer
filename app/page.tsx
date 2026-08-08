import { listReferenceRanges } from "@/data/reference-ranges";
import { HeroPreview } from "@/components/marketing/HeroPreview";
import { Reveal } from "@/components/marketing/Reveal";
import { PANEL_CATALOG } from "@/lib/report/panel-catalog";
import { SECTION_TITLES } from "@/lib/report/build-report";
import { authHref } from "@/lib/auth/paths";
import Link from "next/link";

const STEPS = [
  {
    title: "Upload your lab file",
    body: "Drop in a PDF, image or CSV from your lab. Text-layer PDFs from a digital lab download work best, and Spanish and English labels are both recognised.",
  },
  {
    title: "Check what we extracted",
    body: "Extraction is imperfect, so it never goes straight to a report. You see every value we read, mapped to a canonical marker, and you can correct or add rows before anything is saved.",
  },
  {
    title: "Read your sectioned report",
    body: "Markers are grouped into health sections with a gauge showing where each result sits in its range, plus expandable detail on what the marker measures.",
  },
];

const FEATURES = [
  {
    title: "Position in range, not just a flag",
    body: "A segmented gauge shows where your value falls across attention, fair, good and optimal — so a result just inside the lab cutoff does not read the same as a comfortably central one.",
  },
  {
    title: "Two badges per marker",
    body: "Your lab's own in/out-of-range verdict is kept separate from the optimization grade, because they answer different questions and often disagree.",
  },
  {
    title: "Compared with your demographic",
    body: "Where benchmark data exists for your age and sex, the report plots your value against the population average and names the dataset it came from.",
  },
  {
    title: "Section scores and an age estimate",
    body: "Each section gets an optimization score, and graded markers roll up into an educational biological-age estimate in whole years.",
  },
  {
    title: "A daily routine you can act on",
    body: "Flagged markers drive a lifestyle-level action plan laid out as a daily routine, with each suggestion traceable to the result that prompted it.",
  },
  {
    title: "History and trends",
    body: "Upload again later and each marker builds a trend line, so you can see which numbers actually moved between tests.",
  },
];

export default function Home() {
  const ranges = listReferenceRanges();
  const sourcedCount = ranges.filter((r) => r.sourced).length;
  const sectionIds = [...new Set(PANEL_CATALOG.map((m) => m.sectionId))];
  const sections = sectionIds.map((id) => ({
    id,
    title: SECTION_TITLES[id] ?? id,
    count: PANEL_CATALOG.filter((m) => m.sectionId === id).length,
  }));

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[46rem] bg-[radial-gradient(ellipse_70%_55%_at_15%_0%,var(--accent-soft),transparent_60%),linear-gradient(180deg,var(--surface),var(--background)_60%)]"
      />

      {/* Hero */}
      <section className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 pb-20 pt-10 sm:px-6 md:px-10 md:pb-28 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs text-muted animate-[fadeUp_0.6s_ease-out_both]">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            Educational bloodwork reports
          </p>
          <h1 className="mt-5 max-w-[13ch] font-[family-name:var(--font-fraunces)] text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl animate-[fadeUp_0.6s_ease-out_0.06s_both]">
            See your bloodwork clearly.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg animate-[fadeUp_0.6s_ease-out_0.12s_both]">
            Upload a lab report and get every marker plotted against its
            reference range and the population average for your age and sex —
            with plain-language explanations for anything out of range.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 animate-[fadeUp_0.6s_ease-out_0.18s_both]">
            <Link
              href={authHref("signup")}
              className="ba-btn ba-btn-primary ba-btn-lg"
            >
              Upload a blood test
            </Link>
            <Link
              href={authHref("login")}
              className="ba-btn ba-btn-secondary ba-btn-lg"
            >
              Log in
            </Link>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6 animate-[fadeUp_0.6s_ease-out_0.24s_both]">
            <Stat value={String(sourcedCount)} label="Source-cited ranges" />
            <Stat value={String(sections.length)} label="Health sections" />
            <Stat value={String(PANEL_CATALOG.length)} label="Panel markers" />
          </dl>
        </div>

        <div className="flex min-w-0 justify-center lg:justify-end animate-[fadeUp_0.7s_ease-out_0.2s_both]">
          <HeroPreview />
        </div>
      </section>

      {/* How it works */}
      <section className="relative border-y border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-20">
          <Reveal>
            <p className="ba-eyebrow">How it works</p>
            <h2 className="mt-2 max-w-2xl font-[family-name:var(--font-fraunces)] text-3xl tracking-tight md:text-4xl">
              Three steps, and you stay in control of the data
            </h2>
          </Reveal>

          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 90}>
                <li className="relative list-none">
                  <span className="font-[family-name:var(--font-fraunces)] text-5xl leading-none text-accent/25">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* What's inside */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <Reveal>
          <p className="ba-eyebrow">Inside the report</p>
          <h2 className="mt-2 max-w-2xl font-[family-name:var(--font-fraunces)] text-3xl tracking-tight md:text-4xl">
            More than a red or green dot next to a number
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 80}>
              <article className="h-full rounded-2xl border border-border bg-surface p-6 transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_16px_40px_-28px_rgba(26,34,38,0.6)]">
                <h3 className="font-[family-name:var(--font-fraunces)] text-xl tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {feature.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Coverage */}
      <section className="relative border-y border-border bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 md:grid-cols-[0.9fr_1.1fr] md:px-10 md:py-20">
          <Reveal>
            <p className="ba-eyebrow">Coverage</p>
            <h2 className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl tracking-tight md:text-4xl">
              Sections your report is built from
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Markers your lab did not measure still appear as empty slots, so
              you can see what a panel is missing rather than assuming it was
              fine.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <ul className="grid gap-2 sm:grid-cols-2">
              {sections.map((section) => (
                <li
                  key={section.id}
                  className="flex items-baseline justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
                >
                  <span className="truncate text-sm text-foreground">
                    {section.title}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {section.count} marker{section.count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Honesty */}
      <section className="relative mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-24">
        <Reveal>
          <div className="grid gap-10 rounded-3xl border border-border bg-surface p-8 md:grid-cols-3 md:p-12">
            <div className="md:col-span-1">
              <p className="ba-eyebrow">Ground rules</p>
              <h2 className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl tracking-tight">
                What this is, and is not
              </h2>
            </div>
            <dl className="grid gap-6 md:col-span-2 sm:grid-cols-2">
              <Rule
                term="Not a diagnosis"
                detail="The report explains what a marker measures and general lifestyle-level context. It never tells you what condition you have — that conversation belongs with a clinician."
              />
              <Rule
                term="No invented numbers"
                detail="Every range and population average is versioned and source-cited. Where we have no sourced figure, the report says so instead of filling the gap."
              />
              <Rule
                term="You confirm the extraction"
                detail="Nothing reaches a report until you have reviewed the values read from your file and fixed anything that came through wrong."
              />
              <Rule
                term="Your data stays yours"
                detail="Uploads and parsed results are treated as sensitive health data, scoped to your account, and never used to build a report for anyone else."
              />
            </dl>
          </div>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="relative border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 text-center md:px-10 md:py-28">
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-fraunces)] text-3xl tracking-tight md:text-5xl">
              Turn your last blood test into something you can actually read
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
              Free to try. Bring the most recent lab PDF you have.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={authHref("signup")}
                className="ba-btn ba-btn-primary ba-btn-lg"
              >
                Get started
              </Link>
              <Link
                href={authHref("login")}
                className="ba-btn ba-btn-secondary ba-btn-lg"
              >
                I already have an account
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block font-[family-name:var(--font-fraunces)] text-3xl tracking-tight text-foreground">
          {value}
        </span>
        <span className="mt-1 block text-xs leading-snug text-muted">
          {label}
        </span>
      </dd>
    </div>
  );
}

function Rule({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="border-l-2 border-accent/30 pl-4">
      <dt className="text-sm font-semibold text-foreground">{term}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-muted">{detail}</dd>
    </div>
  );
}
