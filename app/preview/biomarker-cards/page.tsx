import { Page, PageBody, PageHeader } from "@/components/layout/Page";
import { BiomarkerCard } from "@/components/report/BiomarkerCard";
import {
  PopulationComparisonView,
  RangeBar,
} from "@/components/ui/BiomarkerChart";
import { compareToPopulation } from "@/lib/scoring";
import { getDemoBiomarkers } from "@/lib/mock/demo-biomarkers";

const DEMO_DEMOGRAPHIC = { sex: "male" as const, ageYears: 27 };

export default function BiomarkerCardsPreviewPage() {
  const biomarkers = getDemoBiomarkers(DEMO_DEMOGRAPHIC);
  const hdl = biomarkers.find((b) => b.id === "hdl-cholesterol");
  const withPopulation = biomarkers.map((biomarker) => ({
    biomarker,
    population: compareToPopulation({
      biomarkerId: biomarker.id,
      value: biomarker.value,
      demographic: DEMO_DEMOGRAPHIC,
    }),
  }));

  return (
    <Page>
      <PageHeader
        eyebrow="Preview"
        title="Biomarker cards"
        description={
          <>
            Cards from scoring + seeded ranges. Lipid population comparisons use
            cited NHANES means from{" "}
            <code className="text-foreground">/data/population-stats</code>.
          </>
        }
      />

      <PageBody>
        <div className="flex flex-col gap-10">
        <section className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Population benchmarks
          </h2>
          <p className="mt-1 text-sm text-muted">
            Demographic slice: male, age 27. Lipid means are NHANES-sourced;
            markers without a cited average still show the empty state.
          </p>
          <div className="mt-4">
            <PopulationComparisonView
              comparison={withPopulation[0].population}
              unit={withPopulation[0].biomarker.unit}
              value={withPopulation[0].biomarker.value}
            />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {withPopulation.map(({ biomarker }) => (
            <BiomarkerCard key={biomarker.id} biomarker={biomarker} />
          ))}
        </section>

        {hdl?.range?.sourced ? (
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Horizontal gauge (detail)</h2>
            <p className="mt-1 text-sm text-muted">
              Same shared <code className="text-foreground">RangeBar</code> used
              in the detail panel later.
            </p>
            <div className="mt-6">
              <RangeBar
                bands={hdl.range.bands}
                value={hdl.value}
                orientation="horizontal"
                label={hdl.name}
                size={72}
              />
            </div>
          </section>
        ) : null}

        <p className="text-xs text-muted">
          Not medical advice. Provisional ranges — see{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5">
            data/SOURCES.md
          </code>
          .
        </p>
        </div>
      </PageBody>
    </Page>
  );
}
