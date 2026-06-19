# Invoice generator (standalone)

This small module produces a self-contained HTML invoice string from an `order` object. It's designed to be copied into another codebase for migration.

Usage (Node / TypeScript):

```ts
import { generateInvoiceHtml } from './invoice-generator/index';

const html = generateInvoiceHtml(order);
// write to file or serve as response
```

Generate PDF (optional): use Puppeteer or Playwright to render and print to PDF:

```bash
# npm i puppeteer -D
node -e "(async()=>{const puppeteer=require('puppeteer');const fs=require('fs');const {generateInvoiceHtml}=require('./invoice-generator/index');const html=generateInvoiceHtml(order);const browser=await puppeteer.launch();const page=await browser.newPage();await page.setContent(html,{waitUntil:'networkidle0'});await page.pdf({path:'invoice.pdf',format:'A4',printBackground:true});await browser.close();})();"
```

Notes:
- The module is dependency-free and uses simple helpers for formatting and amount-in-words in INR.
- Adjust styles in `index.ts` to match your app's look.
