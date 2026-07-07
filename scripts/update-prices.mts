import { join } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

interface FirestoreProduct {
  id: string;
  name?: string;
}

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

function normalizeName(name: string) {
  // Remove quotes, trim, lowercase, remove extra spaces
  return name
    .replace(/"/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

async function main() {
  console.log("Initializing...");
  const db = getFirestore(getAdminApp());
  const filePath = join(process.cwd(), "Vibe Musice 07-07-2026.csv");
  
  console.log(`Reading CSV from ${filePath}`);
  const csvContent = readFileSync(filePath, "utf-8");
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== "");
  const headers = lines[0].split(",");
  
  const data = lines.slice(1).map(line => {
    const row: any = {};
    let inQuotes = false;
    let currVal = "";
    let colIdx = 0;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row[headers[colIdx] || colIdx.toString()] = currVal;
        currVal = "";
        colIdx++;
      } else {
        currVal += char;
      }
    }
    row[headers[colIdx] || colIdx.toString()] = currVal;
    return row;
  });
  
  console.log(`Found ${data.length} rows in CSV.`);
  console.log("Fetching existing products from Firestore...");
  const productsSnapshot = await db.collection("products").get();
  const dbProducts: FirestoreProduct[] = productsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<FirestoreProduct, "id">),
  }));
  console.log(`Fetched ${dbProducts.length} products from DB.`);

  let updated = 0;
  const notFound: string[] = [];

  for (const row of data as any[]) {
    const rawName = row["Product"];
    if (!rawName) continue;
    
    const cleanName = normalizeName(rawName);
    
    // Find matching product in DB
    const match = dbProducts.find((p) => {
      if (!p.name) return false;
      const dbName = normalizeName(p.name);
      return dbName === cleanName || dbName.includes(cleanName) || cleanName.includes(dbName);
    });
    
    if (match) {
      const msrpRaw = row["Online MRP"];
      const priceRaw = row["Vibe Music Website"];
      
      const msrp = typeof msrpRaw === "string" ? parseFloat(msrpRaw.replace(/,/g, '')) : parseFloat(msrpRaw);
      const price = typeof priceRaw === "string" ? parseFloat(priceRaw.replace(/,/g, '')) : parseFloat(priceRaw);
      
      if (!isNaN(msrp) && !isNaN(price)) {
        await db.collection("products").doc(match.id).update({
          msrp: msrp,
          price: price,
          salePrice: price
        });
        updated++;
        console.log(`Updated: ${match.name} (Matched to: ${rawName}) | MSRP: ${msrp}, Price: ${price}`);
      } else {
        console.log(`Skipped ${rawName}: Invalid price format.`);
      }
    } else {
      notFound.push(rawName);
    }
  }

  console.log(`\nUpdated ${updated} products.`);
  if (notFound.length > 0) {
    console.log(`\nCould not find matches for ${notFound.length} products:`);
    notFound.forEach(name => console.log(`- ${name}`));
  }
}

main().catch(console.error);
