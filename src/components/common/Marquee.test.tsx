import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Marquee from "@/components/common/Marquee";

describe("Marquee (L-01)", () => {
  it("marks duplicate sequence aria-hidden for screen readers", () => {
    const html = renderToStaticMarkup(
      <Marquee ariaLabel="Test strip">
        <span>Item</span>
      </Marquee>,
    );
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("marquee__sequence--clone");
  });
});
