interface GooeyLinkupFilterProps {
  id?: string;
}

/** SVG goo filter — merges adjacent pill blobs into liquid linkups on hover. */
export default function GooeyLinkupFilter({
  id = "gooey-linkup",
}: GooeyLinkupFilterProps) {
  return (
    <svg
      className="gooey-linkup-filter"
      aria-hidden
      focusable="false"
      width="0"
      height="0"
    >
      <defs>
        <filter
          id={id}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}
