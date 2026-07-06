const url = process.argv[2] ?? "https://www.instagram.com/reel/DY1irHzlrml/";
const res = await fetch(url, {
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
});
const html = await res.text();
const videoMatch = html.match(/"video_url":"([^"]+)"/);
const ogMatch = html.match(/property="og:video" content="([^"]+)"/);
console.log("status", res.status);
console.log("video_url", videoMatch?.[1]?.replace(/\\u0026/g, "&").slice(0, 200) ?? "none");
console.log("og:video", ogMatch?.[1] ?? "none");
