/**
 * Circuit Breaker — prevents cascading failures under 2K+ concurrent load.
 *
 * States:
 *   CLOSED   → Normal operation. Failures counted.
 *   OPEN     → Circuit tripped. All calls rejected immediately (no DB/Redis timeout).
 *   HALF_OPEN→ After cooldown, allow ONE probe call. If it succeeds → CLOSED; if fails → OPEN.
 *
 * Why this matters at 2K concurrent:
 *   Without a circuit breaker, if PostgreSQL goes down:
 *   - All 2K requests wait 10s (pool_timeout) each
 *   - Node.js event loop is blocked, all workers freeze
 *   - Nginx retries multiply the load
 *   - Total recovery time: 10s × 2000 = 20,000s of wasted work
 *
 *   With a circuit breaker:
 *   - After 5 failures in 30s → circuit opens
 *   - Remaining 1,995 requests fail in <1ms (no DB wait)
 *   - After 30s cooldown → one probe succeeds → circuit closes
 *   - Total recovery time: ~30s
 */

import { logInfo, logWarn } from "@/lib/server/logger";

export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit. Default: 5 */
  failureThreshold: number;
  /** Time window (ms) to count failures. Default: 30000 (30s) */
  failureWindowMs: number;
  /** Time (ms) to wait before trying again. Default: 30000 (30s) */
  cooldownMs: number;
  /** Name for logging */
  name: string;
}

type CircuitState = "closed" | "open" | "half_open";

interface CircuitStateData {
  state: CircuitState;
  failures: number[];
  lastStateChange: number;
  consecutiveSuccesses: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  failureWindowMs: 30_000,
  cooldownMs: 30_000,
  name: "default",
};

export class CircuitBreaker {
  private options: CircuitBreakerOptions;
  private stateData: CircuitStateData;
  private listener?: (state: CircuitState) => void;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.stateData = {
      state: "closed",
      failures: [],
      lastStateChange: Date.now(),
      consecutiveSuccesses: 0,
    };
  }

  /** Register a callback for state changes (used by metrics endpoint) */
  onStateChange(listener: (state: CircuitState) => void): void {
    this.listener = listener;
  }

  get state(): CircuitState {
    return this.evaluateState();
  }

  private evaluateState(): CircuitState {
    const { state, failures, lastStateChange } = this.stateData;
    const now = Date.now();

    if (state === "open") {
      // Check if cooldown has elapsed → move to half-open
      if (now - lastStateChange >= this.options.cooldownMs) {
        this.setState("half_open");
        return "half_open";
      }
      return "open";
    }

    if (state === "half_open") {
      return "half_open";
    }

    // Closed: check if failure window has rolled over
    const windowStart = now - this.options.failureWindowMs;
    const recentFailures = failures.filter((t) => t > windowStart);
    this.stateData.failures = recentFailures;

    return "closed";
  }

  private setState(newState: CircuitState): void {
    const prevState = this.stateData.state;
    if (prevState === newState) return;

    this.stateData.state = newState;
    this.stateData.lastStateChange = Date.now();

    if (newState === "open") {
      logWarn(`Circuit breaker [${this.options.name}] OPENED after ${this.options.failureThreshold} failures`, "circuit-breaker");
    } else if (newState === "closed") {
      logInfo(`Circuit breaker [${this.options.name}] CLOSED — recovered`, "circuit-breaker");
      this.stateData.consecutiveSuccesses = 0;
    }

    this.listener?.(newState);
  }

  /** Record a successful call. Resets failure count in closed state. */
  recordSuccess(): void {
    const current = this.evaluateState();
    if (current === "half_open") {
      this.stateData.consecutiveSuccesses++;
      // Require 2 consecutive successes to fully close
      if (this.stateData.consecutiveSuccesses >= 2) {
        this.setState("closed");
      }
    } else if (current === "closed") {
      // Reset failures on success (streak-based reset)
      this.stateData.failures = [];
      this.stateData.consecutiveSuccesses++;
    }
  }

  /** Record a failure. May trip the circuit. */
  recordFailure(): void {
    const now = Date.now();
    const current = this.evaluateState();

    if (current === "half_open") {
      // Probe failed → re-open circuit
      this.setState("open");
      return;
    }

    if (current === "open") {
      return; // Already open, nothing to do
    }

    // Closed: add failure and check threshold
    this.stateData.failures.push(now);
    const windowStart = now - this.options.failureWindowMs;
    const recentFailures = this.stateData.failures.filter((t) => t > windowStart);
    this.stateData.failures = recentFailures;

    if (recentFailures.length >= this.options.failureThreshold) {
      this.setState("open");
    }
  }

  /**
   * Execute a function with circuit breaker protection.
   * If circuit is open, throws CircuitBreakerOpenError immediately.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const current = this.evaluateState();
    if (current === "open") {
      throw new CircuitBreakerOpenError(this.options.name);
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /** Check if the circuit is allowing requests */
  isHealthy(): boolean {
    return this.evaluateState() !== "open";
  }

  /** Get metrics for the monitoring endpoint */
  getMetrics(): {
    state: CircuitState;
    failureCount: number;
    lastStateChange: number;
    consecutiveSuccesses: number;
  } {
    const windowStart = Date.now() - this.options.failureWindowMs;
    const recentFailures = this.stateData.failures.filter((t) => t > windowStart);
    return {
      state: this.evaluateState(),
      failureCount: recentFailures.length,
      lastStateChange: this.stateData.lastStateChange,
      consecutiveSuccesses: this.stateData.consecutiveSuccesses,
    };
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(serviceName: string) {
    super(`Circuit breaker [${serviceName}] is OPEN — service temporarily unavailable`);
    this.name = "CircuitBreakerOpenError";
  }
}

// ─── Singleton circuit breakers ──────────────────────────────────────────

/** Database circuit breaker — trips after 5 failures in 30s, recovers after 30s cooldown */
export const dbCircuitBreaker = new CircuitBreaker({
  name: "postgresql",
  failureThreshold: 5,
  failureWindowMs: 30_000,
  cooldownMs: 30_000,
});

/** Redis circuit breaker — trips after 3 failures in 20s, recovers after 15s cooldown */
export const redisCircuitBreaker = new CircuitBreaker({
  name: "redis",
  failureThreshold: 3,
  failureWindowMs: 20_000,
  cooldownMs: 15_000,
});
