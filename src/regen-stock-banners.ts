/**
 * Regenerate auto-generated (stock-template) member banners.
 * Leaves custom uploaded banners alone.
 *
 * Run: npx ts-node --transpile-only ./src/regen-stock-banners.ts
 */
import * as fs from "fs";
import * as path from "path";
import sharp = require("sharp");
import * as db from "./db";
import { generateBanner } from "./banner";

const BANNERS_DIR = path.join(__dirname, "../assets/banners");
const TEMPLATE = path.join(__dirname, "../assets/site-banner-background.png");

/** Sample the "Proud member / Webring" branding area — unique to stock banners. */
async function looksLikeStockBanner(bannerPath: string): Promise<boolean> {
  try {
    const bannerMeta = await sharp(bannerPath).metadata();
    const tmplMeta = await sharp(TEMPLATE).metadata();
    const w = Math.min(bannerMeta.width || 0, tmplMeta.width || 0);
    const h = Math.min(bannerMeta.height || 0, tmplMeta.height || 0);
    if (w < 100 || h < 40) return false;

    // Bottom-right branding strip on the stock template.
    const sampleW = 120;
    const sampleH = 18;
    const left = w - sampleW - 4;
    const top = h - sampleH - 4;

    const [a, b] = await Promise.all([
      sharp(bannerPath)
        .extract({ left, top, width: sampleW, height: sampleH })
        .raw()
        .toBuffer(),
      sharp(TEMPLATE)
        .extract({ left, top, width: sampleW, height: sampleH })
        .raw()
        .toBuffer(),
    ]);

    if (a.length !== b.length) return false;

    // Mean absolute difference — stock banners stay close to the template art.
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff += Math.abs(a[i] - b[i]);
    const mad = diff / a.length;
    return mad < 18;
  } catch {
    return false;
  }
}

(async () => {
  await db.connect();
  const sites = await db.getAllWebsites();
  console.log(`Sites: ${sites.length}`);

  let stock = 0;
  let custom = 0;
  let updated = 0;
  let withFav = 0;
  let withoutFav = 0;
  let failed = 0;

  for (const site of sites) {
    const filename = site.banner || `${site.id}.gif`;
    const bannerPath = path.join(BANNERS_DIR, filename);

    if (!fs.existsSync(bannerPath)) {
      console.log(`MISSING ${site.name} (${site.id}) — generating`);
      try {
        const generated = await generateBanner({
          id: site.id,
          name: site.name,
          url: site.url,
          email: site.email || "",
          description: site.description || "",
          isVintage: !!site.isVintage,
        });
        fs.writeFileSync(bannerPath, generated.buffer);
        if (!site.banner) {
          await db.updateWebsite(site.id, {
            name: site.name,
            url: site.url,
            description: site.description,
            email: site.email,
            isVintage: !!site.isVintage,
            banner: path.basename(bannerPath),
          });
        }
        updated++;
        if (generated.hasFavicon) withFav++;
        else withoutFav++;
      } catch (e) {
        failed++;
        console.error(`FAIL ${site.name}:`, (e as Error).message);
      }
      continue;
    }

    const isStock = await looksLikeStockBanner(bannerPath);
    if (!isStock) {
      custom++;
      console.log(`CUSTOM  skip ${site.name}`);
      continue;
    }

    stock++;
    try {
      const generated = await generateBanner({
        id: site.id,
        name: site.name,
        url: site.url,
        email: site.email || "",
        description: site.description || "",
        isVintage: !!site.isVintage,
      });
      fs.writeFileSync(bannerPath, generated.buffer);
      updated++;
      if (generated.hasFavicon) {
        withFav++;
        console.log(`OK favicon ${site.name}`);
      } else {
        withoutFav++;
        console.log(`OK stock   ${site.name}`);
      }
    } catch (e) {
      failed++;
      console.error(`FAIL ${site.name}:`, (e as Error).message);
    }
  }

  console.log(
    JSON.stringify(
      { stock, custom, updated, withFav, withoutFav, failed },
      null,
      2
    )
  );
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
