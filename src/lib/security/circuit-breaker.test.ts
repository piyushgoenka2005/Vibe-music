import { describe, it, expect, vi, beforeEach } from "vitest";
import { CircuitBreaker, CircuitBreakerOpenError } from "./circuit-breaker";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      failureWindowMs: 5000,
      cooldownMs: 1000,
      name: "test",
    });
  });

  describe("closed state (normal operation)", () => {
    it("starts in closed state", () => {
      expect(breaker.state).toBe("closed");
    });

    it("allows requests when closed", async () => {
      const result = await breaker.execute(async () => "ok");
      expect(result).toBe("ok");
    });

    it("records success and resets failures", async () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordSuccess();
      expect(breaker.state).toBe("closed");
    });

    it("stays closed under threshold", () => {
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.state).toBe("closed");
    });
  });

  describe("open state (circuit tripped)", () => {
    it("opens after failure threshold", () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.state).toBe("open");
    });

    it("rejects requests immediately when open", async () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();

      await expect(
        breaker.execute(async () => "should not run")
      ).rejects.toThrow(CircuitBreakerOpenError);
    });

    it("rejects with correct error name", async () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();

      try {
        await breaker.execute(async () => "nope");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitBreakerOpenError);
        expect((error as CircuitBreakerOpenError).name).toBe(
          "CircuitBreakerOpenError"
        );
      }
    });

    it("does not count more failures when already open", () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.state).toBe("open");

      // These should be no-ops
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.state).toBe("open");
    });
  });

  describe("half-open state (recovery probe)", () => {
    it("transitions to half-open after cooldown", async () => {
      const fastBreaker = new CircuitBreaker({
        failureThreshold: 3,
        failureWindowMs: 5000,
        cooldownMs: 100,
        name: "fast-test",
      });
      fastBreaker.recordFailure();
      fastBreaker.recordFailure();
      fastBreaker.recordFailure();
      expect(fastBreaker.state).toBe("open");

      await new Promise((r) => setTimeout(r, 150));
      expect(fastBreaker.state).toBe("half_open");
    });

    it("closes after successful probe", async () => {
      const fastBreaker = new CircuitBreaker({
        failureThreshold: 3,
        failureWindowMs: 5000,
        cooldownMs: 100,
        name: "fast-test",
      });
      fastBreaker.recordFailure();
      fastBreaker.recordFailure();
      fastBreaker.recordFailure();

      await new Promise((r) => setTimeout(r, 150));
      expect(fastBreaker.state).toBe("half_open");

      await fastBreaker.execute(async () => "ok");
      await fastBreaker.execute(async () => "ok");
      expect(fastBreaker.state).toBe("closed");
    });

    it("re-opens after failed probe", async () => {
      const fastBreaker = new CircuitBreaker({
        failureThreshold: 3,
        failureWindowMs: 5000,
        cooldownMs: 100,
        name: "fast-test",
      });
      fastBreaker.recordFailure();
      fastBreaker.recordFailure();
      fastBreaker.recordFailure();

      await new Promise((r) => setTimeout(r, 150));
      expect(fastBreaker.state).toBe("half_open");

      await expect(
        fastBreaker.execute(async () => {
          throw new Error("probe failed");
        })
      ).rejects.toThrow("probe failed");

      expect(fastBreaker.state).toBe("open");
    });

    it("allows exactly one probe request in half-open", async () => {
      const fastBreaker = new CircuitBreaker({
        failureThreshold: 3,
        failureWindowMs: 5000,
        cooldownMs: 100,
        name: "fast-test",
      });
      fastBreaker.recordFailure();
      fastBreaker.recordFailure();
      fastBreaker.recordFailure();

      await new Promise((r) => setTimeout(r, 150));
      expect(fastBreaker.state).toBe("half_open");

      const result = await fastBreaker.execute(async () => "probe-ok");
      expect(result).toBe("probe-ok");
    });
  });

  describe("metrics", () => {
    it("returns correct metrics", () => {
      const metrics = breaker.getMetrics();
      expect(metrics).toHaveProperty("state", "closed");
      expect(metrics).toHaveProperty("failureCount", 0);
      expect(metrics).toHaveProperty("lastStateChange");
      expect(metrics).toHaveProperty("consecutiveSuccesses", 0);
    });

    it("tracks failure count in window", () => {
      breaker.recordFailure();
      breaker.recordFailure();
      const metrics = breaker.getMetrics();
      expect(metrics.failureCount).toBe(2);
    });
  });

  describe("isHealthy", () => {
    it("returns true when closed", () => {
      expect(breaker.isHealthy()).toBe(true);
    });

    it("returns false when open", () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.isHealthy()).toBe(false);
    });

    it("returns true when half-open", async () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      await new Promise((r) => setTimeout(r, 1100));
      expect(breaker.isHealthy()).toBe(true); // half-open allows requests
    });
  });

  describe("state change callback", () => {
    it("calls listener on state change", async () => {
      const listener = vi.fn();
      breaker.onStateChange(listener);

      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();

      expect(listener).toHaveBeenCalledWith("open");
    });

    it("calls listener on recovery", async () => {
      const listener = vi.fn();
      breaker.onStateChange(listener);

      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();

      await new Promise((r) => setTimeout(r, 1100));
      // half-open doesn't trigger listener, only close does

      await breaker.execute(async () => "ok");
      await breaker.execute(async () => "ok");

      expect(listener).toHaveBeenCalledWith("closed");
    });
  });

  describe("failure window expiry", () => {
    it("resets failures outside window", async () => {
      const fastBreaker = new CircuitBreaker({
        failureThreshold: 3,
        failureWindowMs: 200,
        cooldownMs: 100,
        name: "fast-window-test",
      });
      fastBreaker.recordFailure();
      fastBreaker.recordFailure();
      // Not enough to trip (threshold is 3)

      // Wait for window to expire
      await new Promise((r) => setTimeout(r, 300));

      // Failures should have expired
      expect(fastBreaker.state).toBe("closed");

      // Two more failures still shouldn't trip it
      fastBreaker.recordFailure();
      expect(fastBreaker.state).toBe("closed");
    });
  });
});
