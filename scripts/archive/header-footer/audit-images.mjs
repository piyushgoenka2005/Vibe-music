import http from "http";
import https from "https";

const BASE = "http://localhost:3000";

function fetchUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      })
      .on("error", () => resolve("ERR"));
  });
}

function fetchHtml() {
  return new Promise((resolve, reject) => {
    http
      .get(`${BASE}/`, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

const html = await fetchHtml();
const srcs = [...new Set([...html.matchAll(/\bsrc="([^"]+)"/g)].map((m) => m[1]))];
const failures = [];

for (const src of srcs) {
  const full = src.startsWith("http") ? src : `${BASE}${src}`;
  const status = await fetchUrl(full);
  if (status !== 200) {
    failures.push({ src, full, status });
  }
}

console.log(
  JSON.stringify(
    { total: srcs.length, failed: failures.length, failures: failures.slice(0, 25) },
    null,
    2
  )
);
