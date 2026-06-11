import { execSync } from "child_process";
const h = execSync("git show 7ca3b47:src/content/header.html", {
  encoding: "utf8",
  maxBuffer: 10e6,
});
const i = h.indexOf("assets-site-header__menu-account-wrap");
console.log(h.slice(i, i + 4500));
