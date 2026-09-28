/**
 * k6 smoke test for staging/production (L-25).
 *
 * Usage:
 *   k6 run scripts/k6/smoke.js
 *   k6 run -e BASE_URL=https://staging.vibemusic.in scripts/k6/smoke.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = (__ENV.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const VUS = Number(__ENV.VUS || "10");
const DURATION = __ENV.DURATION || "30s";

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
  },
};

const paths = [
  "/",
  "/deals",
  "/api/healthz",
  "/api/readyz",
  "/api/search?q=guitar&mode=suggest",
  "/api/catalog/categories",
];

export default function smoke() {
  const path = paths[Math.floor(Math.random() * paths.length)];
  const response = http.get(`${BASE_URL}${path}`);
  check(response, {
    "status is 2xx or 3xx": (r) => r.status >= 200 && r.status < 400,
  });
  sleep(0.3);
}
