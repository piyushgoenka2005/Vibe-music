const fs = require("fs");
const html = fs.readFileSync("src/content/main.html", "utf8");
const re =
  /<span class="weight-demi text-gray600">([^<]+)<\/span>\s*([^<]+)<\/div>/g;
const products = [];
let m;
while ((m = re.exec(html)) !== null && products.length < 40) {
  products.push({
    brand: m[1].trim(),
    name: m[2].trim(),
  });
}
console.log(JSON.stringify(products, null, 2));
