/**
 * Regenerate tool-generated member banners (bannerIsCustom === false).
 * Leaves member/admin-supplied custom banners alone.
 *
 * Run: npx ts-node --transpile-only ./src/regen-stock-banners.ts
 */
import * as fs from "fs";
import * as path from "path";
import * as db from "./db";
import { generateBanner } from "./banner";

const BANNERS_DIR = path.join(__dirname, "../assets/banners");

(async () => {
  await db.connect();
  const sites = await db.getAllWebsites();
  console.log(`Sites: ${sites.length}`);

  let custom = 0;
  let updated = 0;
  let withFav = 0;
  let withoutFav = 0;
  let failed = 0;

  for (const site of sites) {
    const filename = site.banner || `${site.id}.gif`;
    const bannerPath = path.join(BANNERS_DIR, filename);

    // Permanent record: skip anything marked as member/admin-supplied.
    if (site.bannerIsCustom) {
      custom++;
      console.log(`CUSTOM  skip ${site.name}`);
      continue;
    }

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
      await db.updateWebsite(site.id, {
        name: site.name,
        url: site.url,
        description: site.description,
        email: site.email,
        isVintage: !!site.isVintage,
        banner: path.basename(bannerPath),
        bannerIsCustom: false,
      });
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
      { custom, updated, withFav, withoutFav, failed },
      null,
      2
    )
  );
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
