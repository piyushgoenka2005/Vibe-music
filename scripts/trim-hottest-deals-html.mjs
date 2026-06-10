import fs from "fs";
import path from "path";

const contentDir = path.join(process.cwd(), "src", "content");
const tailPath = path.join(contentDir, "main-tail.html");
const lines = fs.readFileSync(tailPath, "utf8").split(/\r?\n/);

// Remove Hottest Deals block (lines 1-331) and sales-events close (line 646, index 645).
const newNotable = lines.slice(331, 645).join("\n");
const remainder = lines.slice(646).join("\n");

fs.writeFileSync(path.join(contentDir, "main-tail-new-notable.html"), newNotable);
fs.writeFileSync(tailPath, remainder);

console.log("Wrote main-tail-new-notable.html", newNotable.split("\n").length, "lines");
console.log("Updated main-tail.html", remainder.split("\n").length, "lines");
