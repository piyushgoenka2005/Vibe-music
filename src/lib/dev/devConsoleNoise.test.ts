import { describe, expect, it } from "vitest";
import { formatConsoleArgs, isSuppressedDevConsoleMessage } from "./devConsoleNoise";

describe("devConsoleNoise", () => {
  it("suppresses extension and Next dev forward-log noise", () => {
    expect(
      isSuppressedDevConsoleMessage(
        "MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 close listeners added.",
      ),
    ).toBe(true);
    expect(
      isSuppressedDevConsoleMessage(
        'ObjectMultiplex - orphaned data for stream "app-init-liveness"',
      ),
    ).toBe(true);
    expect(
      isSuppressedDevConsoleMessage(
        "%cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools",
      ),
    ).toBe(true);
    expect(isSuppressedDevConsoleMessage("[HMR] connected")).toBe(true);
  });

  it("keeps normal application logs", () => {
    expect(isSuppressedDevConsoleMessage("Order placed successfully")).toBe(false);
    expect(isSuppressedDevConsoleMessage("[Vibe Music] checkout error")).toBe(false);
  });

  it("formats mixed console args", () => {
    expect(formatConsoleArgs(["hello", 42])).toBe("hello 42");
  });
});
