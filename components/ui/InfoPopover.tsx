"use client";

import { CloseButton } from "@/components/ui/CloseButton";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type InfoPopoverProps = {
  label: string;
  children: React.ReactNode;
};

/**
 * Portal-based popover so content always stacks above cards/grids.
 */
export function InfoPopover({ label, children }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 288;
      const pad = 12;
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
      const below = rect.bottom + 8;
      const approxHeight = panelRef.current?.offsetHeight ?? 160;
      const top =
        below + approxHeight > window.innerHeight - pad
          ? Math.max(pad, rect.top - approxHeight - 8)
          : below;
      setCoords({ top, left });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const t = event.target as Node;
      if (buttonRef.current?.contains(t) || panelRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex size-5 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-muted transition hover:border-accent hover:text-accent"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        i
      </button>
      {mounted && open && coords
        ? createPortal(
            <div
              ref={panelRef}
              id={id}
              role="dialog"
              aria-label={label}
              className="fixed z-[200] w-72 rounded-xl border border-border bg-surface p-3 text-left text-xs leading-relaxed text-foreground shadow-xl"
              style={{ top: coords.top, left: coords.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="pt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {label}
                </p>
                <CloseButton
                  onClick={() => setOpen(false)}
                  label="Close info"
                  className="!h-6 !w-6"
                />
              </div>
              <div className="mt-2">{children}</div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
