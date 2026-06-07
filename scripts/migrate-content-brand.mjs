import fs from "fs";
import path from "path";

const dirs = [
  path.join(process.cwd(), "src", "content"),
  path.join(process.cwd(), "scripts"),
];

const EXTRA = [
  ["sweetwater-exclusive", "vibemusic-exclusive"],
  ["sweetwater-card", "vibemusic-card"],
  ["/myaccount/vibemusic-card/", "/financing/"],
  ["Sales Engineer", "Gear Advisor"],
  ["Sales Engineers", "Gear Advisors"],
  ["Sweetwater Sound", "Vibe Music"],
  ["Sweetwater", "Vibe Music"],
  ["sweetwater.com", "vibemusic.in"],
  ["media.sweetwater.com", "cdn.vibemusic.in"],
  ["assets.sweetwater.com", "assets.vibemusic.in"],
  ["sweetwater", "vibemusic"],
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;

  for (const entry of fs.readdirSync(dir)) {
    if (!entry.endsWith(".html")) continue;
    const filePath = path.join(dir, entry);
    let html = fs.readFileSync(filePath, "utf8");
    const before = html;
    for (const [from, to] of EXTRA) {
      html = html.split(from).join(to);
    }
    if (html !== before) {
      fs.writeFileSync(filePath, html, "utf8");
      console.log("Updated", path.relative(process.cwd(), filePath));
    }
  }
}
