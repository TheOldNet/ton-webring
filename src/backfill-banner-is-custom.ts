/**
 * One-time legacy backfill for bannerIsCustom.
 *
 * New column defaults to custom=1 (safe). This marks banners that still match
 * a stock template plate as generated (bannerIsCustom=0) so regen can touch them.
 *
 * Imperfect for already-regenerated colored/nobg GIFs that no longer match —
 * those stay custom=1 until an admin "Regenerate" sets the flag correctly.
 *
 * Run: npx ts-node --transpile-only ./src/backfill-banner-is-custom.ts
 */
import * as fs from "fs";
import * as path from "path";
import sharp = require("sharp");
import * as db from "./db";

const BANNERS_DIR = path.join(__dirname, "../assets/banners");
const STOCK_TEMPLATES = [
  path.join(__dirname, "../assets/site-banner-background.png"),
  path.join(__dirname, "../assets/site-banner-noglobe.png"),
  path.join(__dirname, "../assets/site-banner-nobg.png"),
];

async function matchesTemplate(
  bannerPath: string,
  templatePath: string
): Promise<boolean> {
  try {
    const bannerMeta = await sharp(bannerPath).metadata();
    const tmplMeta = await sharp(templatePath).metadata();
    const w = Math.min(bannerMeta.width || 0, tmplMeta.width || 0);
    const h = Math.min(bannerMeta.height || 0, tmplMeta.height || 0);
    if (w < 100 || h < 40) return false;

    const sampleW = 120;
    const sampleH = 18;
    const left = w - sampleW - 4;
    const top = h - sampleH - 4;

    const [bannerRaw, tmplRaw] = await Promise.all([
      sharp(bannerPath)
        .ensureAlpha()
        .extract({ left, top, width: sampleW, height: sampleH })
        .raw()
        .toBuffer(),
      sharp(templatePath)
        .ensureAlpha()
        .extract({ left, top, width: sampleW, height: sampleH })
        .raw()
        .toBuffer(),
    ]);

    if (bannerRaw.length !== tmplRaw.length) return false;

    let diff = 0;
    let n = 0;
    for (let i = 0; i < tmplRaw.length; i += 4) {
      if (tmplRaw[i + 3] < 200) continue;
      n += 3;
      diff += Math.abs(bannerRaw[i] - tmplRaw[i]);
      diff += Math.abs(bannerRaw[i + 1] - tmplRaw[i + 1]);
      diff += Math.abs(bannerRaw[i + 2] - tmplRaw[i + 2]);
    }
    if (n < 50) {
      diff = 0;
      n = 0;
      for (let i = 0; i < bannerRaw.length; i += 4) {
        n += 3;
        diff += Math.abs(bannerRaw[i] - tmplRaw[i]);
        diff += Math.abs(bannerRaw[i + 1] - tmplRaw[i + 1]);
        diff += Math.abs(bannerRaw[i + 2] - tmplRaw[i + 2]);
      }
    }
    // Looser than the old regen gate — GIF quantization drifts colors.
    return n > 0 && diff / n < 40;
  } catch {
    return false;
  }
}

async function looksLikeGenerated(bannerPath: string): Promise<boolean> {
  for (const template of STOCK_TEMPLATES) {
    if (!(await fs.promises.stat(template).catch(() => null))) continue;
    if (await matchesTemplate(bannerPath, template)) return true;
  }
  return false;
}

(async () => {
  await db.connect();
  const sites = await db.getAllWebsites();
  let markedGenerated = 0;
  let leftCustom = 0;
  let missing = 0;

  for (const site of sites) {
    const filename = site.banner || `${site.id}.gif`;
    const bannerPath = path.join(BANNERS_DIR, filename);
    if (!fs.existsSync(bannerPath)) {
      missing++;
      console.log(`MISSING ${site.name}`);
      continue;
    }

    if (await looksLikeGenerated(bannerPath)) {
      await db.updateWebsite(site.id, {
        name: site.name,
        url: site.url,
        description: site.description,
        email: site.email,
        isVintage: !!site.isVintage,
        banner: site.banner,
        bannerIsCustom: false,
      });
      markedGenerated++;
      console.log(`GENERATED ${site.name}`);
    } else {
      leftCustom++;
      console.log(`CUSTOM    ${site.name}`);
    }
  }

  console.log(
    JSON.stringify({ markedGenerated, leftCustom, missing }, null, 2)
  );
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
