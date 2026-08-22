/**
 * Shared page chrome for every authenticated app route so upload, history and
 * report screens share one header band, container width and rhythm.
 */

const CONTAINER = "mx-auto w-full max-w-6xl px-5 sm:px-6 md:px-10";

export function Page({ children }: { children: React.ReactNode }) {
  return <main className="flex flex-1 flex-col">{children}</main>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-border bg-surface">
      <div className={`${CONTAINER} py-7`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            {eyebrow ? <p className="ba-eyebrow">{eyebrow}</p> : null}
            <h1 className="mt-1 font-[family-name:var(--font-fraunces)] text-3xl tracking-tight md:text-4xl">
              {title}
            </h1>
            {description ? (
              <div className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                {description}
              </div>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function PageBody({
  children,
  width = "wide",
}: {
  children: React.ReactNode;
  /** "narrow" for form/list screens; "wide" for report grids. */
  width?: "wide" | "narrow";
}) {
  return (
    <div className={`${CONTAINER} flex-1 py-8`}>
      <div className={width === "narrow" ? "mx-auto max-w-3xl" : undefined}>
        {children}
      </div>
    </div>
  );
}
