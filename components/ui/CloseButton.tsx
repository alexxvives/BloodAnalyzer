type CloseButtonProps = {
  onClick: () => void;
  /** Announced to screen readers, e.g. "Close action plan". */
  label?: string;
  className?: string;
};

/** Single close affordance for every modal, panel and popover. */
export function CloseButton({
  onClick,
  label = "Close",
  className = "",
}: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`ba-icon-btn ${className}`}
    >
      <XIcon />
    </button>
  );
}

function XIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
