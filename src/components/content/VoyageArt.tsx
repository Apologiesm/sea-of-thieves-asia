const base = {
  viewBox: "0 0 200 140",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Original decorative line art. Not an icon set and not copied from any game. */
export function VoyageArt({ kind }: { kind: string }) {
  if (kind === "crew") {
    return (
      <svg {...base}>
        <path d="M24 102 L176 102" />
        <path d="M46 96 L154 96 L142 112 L58 112 Z" />
        <path d="M100 94 L100 34" />
        <path d="M104 42 L142 82 L104 82 Z" />
        <path d="M96 50 L64 82 L96 82 Z" />
        <path d="M36 118 Q68 108 100 118 T164 118" />
        <circle cx="100" cy="28" r="4" />
      </svg>
    );
  }

  if (kind === "events") {
    return (
      <svg {...base}>
        <rect x="46" y="24" width="108" height="96" rx="6" />
        <path d="M46 48 H154" />
        <path d="M72 18 V34 M128 18 V34" />
        <path d="M68 70 H132 M68 84 H116" />
        <path d="M96 62 L110 76 L96 90 L82 76 Z" />
        <path d="M56 108 Q78 100 100 108 T144 108" />
      </svg>
    );
  }

  if (kind === "guides") {
    return (
      <svg {...base}>
        <path d="M100 42 C82 30 58 30 40 42 L40 108 C58 96 82 96 100 108 C118 96 142 96 160 108 L160 42 C142 30 118 30 100 42 Z" />
        <path d="M100 42 V108" />
        <path d="M56 60 H84 M56 74 H84 M116 60 H144 M116 74 H144" />
        <circle cx="100" cy="92" r="8" />
        <path d="M100 84 V100 M92 92 H108" />
      </svg>
    );
  }

  return (
    <svg {...base}>
      <rect x="34" y="24" width="132" height="94" rx="6" />
      <circle cx="136" cy="52" r="12" />
      <path d="M44 104 L78 70 L102 90 L126 64 L156 104" />
      <path d="M44 88 L66 74 L82 86" />
      <path d="M58 38 H96" />
    </svg>
  );
}
