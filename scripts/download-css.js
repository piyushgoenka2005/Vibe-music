const https = require("https");
const fs = require("fs");
const path = require("path");

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(dest)));
      })
      .on("error", (err) => {
        fs.unlink(dest, () => reject(err));
      });
  });
}

async function main() {
  const publicDir = path.join("public");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
  await download(
    "https://www.sweetwater.com/home/build/assets/app-Bcfdfi4d.css",
    path.join(publicDir, "sweetwater-app.css")
  );
  await download(
    "https://assets.sweetwater.com/dist/templates/footer.css",
    path.join(publicDir, "sweetwater-footer.css")
  );
  console.log("Downloaded CSS files");
}

main().catch(console.error);
