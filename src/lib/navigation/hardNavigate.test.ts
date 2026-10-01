import { describe, expect, it, vi } from "vitest";
import { hardNavigateToHref, isPrimarySameTabClick } from "@/lib/navigation/hardNavigate";

function click(partial: Partial<MouseEvent<HTMLElement>> = {}): MouseEvent<HTMLElement> {
  return {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    defaultPrevented: false,
    preventDefault: vi.fn(),
    ...partial,
  } as MouseEvent<HTMLElement>;
}

describe("hardNavigate", () => {
  it("detects primary same-tab clicks", () => {
    expect(isPrimarySameTabClick(click())).toBe(true);
    expect(isPrimarySameTabClick(click({ ctrlKey: true }))).toBe(false);
    expect(isPrimarySameTabClick(click({ button: 1 }))).toBe(false);
  });

  it("assigns product paths on primary click", () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { assign } });

    const event = click();
    hardNavigateToHref(event, "/product/demo-slug");

    expect(event.preventDefault).toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith("/product/demo-slug");

    vi.unstubAllGlobals();
  });

  it("skips modified clicks", () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { assign } });

    const event = click({ metaKey: true });
    hardNavigateToHref(event, "/product/demo-slug");

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
