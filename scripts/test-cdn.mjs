import https from "https";

function head(url) {
  return new Promise((resolve) => {
    https
      .get(url, { method: "HEAD" }, (res) => {
        resolve({ url, status: res.statusCode, type: res.headers["content-type"] });
      })
      .on("error", (err) => resolve({ url, error: err.message }));
  });
}

const tests = [
  "https://media.sweetwater.com/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png",
  "https://media.sweetwater.com/m/home/cats/LPR59VOWCSNH.png",
  "https://media.sweetwater.com/m/header/logo/sweetwater-logo__new.svg",
];

for (const url of tests) {
  console.log(await head(url));
}
