const BRANCH_COLOR = "var(--brand-primary, #1253ed)";
const BRANCH_STROKE = 1.45;
const COLUMN_XS = [10, 30, 50, 70, 90] as const;
const RAIL_Y = 24;

export default function HeroMarqueeBranchSvg() {
  return (
    <svg
      aria-hidden
      className="hero_marquee_branch-svg"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <line
        stroke={BRANCH_COLOR}
        strokeLinecap="round"
        strokeWidth={BRANCH_STROKE}
        vectorEffect="non-scaling-stroke"
        x1="50"
        x2="50"
        y1="0"
        y2={RAIL_Y}
      />
      <line
        stroke={BRANCH_COLOR}
        strokeLinecap="round"
        strokeWidth={BRANCH_STROKE}
        vectorEffect="non-scaling-stroke"
        x1={COLUMN_XS[0]}
        x2={COLUMN_XS[COLUMN_XS.length - 1]}
        y1={RAIL_Y}
        y2={RAIL_Y}
      />
      {COLUMN_XS.map((x, index) => (
        <line
          key={x}
          className={`hero_marquee_branch-drop hero_marquee_branch-drop--${index}`}
          stroke={BRANCH_COLOR}
          strokeLinecap="round"
          strokeWidth={BRANCH_STROKE}
          vectorEffect="non-scaling-stroke"
          x1={x}
          x2={x}
          y1={RAIL_Y}
          y2="100"
        />
      ))}
    </svg>
  );
}
