import * as db from "./db";
import { generateBanner } from "./banner";
import {
  downloadBanner,
  downloadFile,
  normalizeExternalUrl,
  saveImage,
} from "./helpers";
import * as path from "path";

export async function approveRequest(id: string) {
  // Let Sequelize manage commit/rollback — do not call t.rollback() inside
  // the callback (that causes "Transaction cannot be committed… rollback").
  return db.sequelize.transaction(async (t) => {
    const request = await db.getRequest(id, t);

    const downloaded = await downloadBanner(request);

    const { description, email, name, url, isVintage, createdAt } = request;

    await db.addWebsite(
      {
        description,
        email,
        id,
        name,
        url,
        banner: downloaded,
        isVintage,
        approvalEmailed: false,
        // Keep original submission time as the site's createdAt when possible.
        ...(createdAt ? { createdAt: createdAt as Date } : {}),
      } as any,
      t
    );

    await db.removeRequest(id, t);
  });
}

export async function denyRequest(id: string) {
  return db.denyRequest(id);
}

export async function removeWebsite(id: string) {
  return db.removeWebsite(id);
}

export async function confirmBanner(id: string) {
  return db.confirmBanner(id);
}

export async function toggleRetro(id: string) {
  return db.toggleRetro(id);
}

export async function clearBanner(id: string) {
  return db.clearBanner(id);
}

export async function markApprovalEmailed(id: string, emailed: boolean = true) {
  return db.markApprovalEmailed(id, emailed);
}

export type WebsiteEditInput = {
  name: string;
  url: string;
  description: string;
  email: string;
  isVintage: boolean;
  bannerAction: "keep" | "url" | "regenerate";
  bannerUrl?: string;
};

export async function updateWebsiteEntry(
  id: string,
  input: WebsiteEditInput
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const errors: string[] = [];
  const existing = await db.getWebsite(id);
  if (!existing) {
    return { ok: false, errors: ["Website not found."] };
  }

  const name = String(input.name || "").trim();
  const description = String(input.description || "").trim();
  const email = String(input.email || "").trim();
  const url = normalizeExternalUrl(String(input.url || "").trim(), {
    preferHttp: input.isVintage,
  });

  if (!name) errors.push("Title is required.");
  if (!url) errors.push("URL is required.");
  if (description.length > 256) {
    errors.push("Description is too long (max 256 characters).");
  }
  if (await db.websiteUrlTakenByOther(url, id)) {
    errors.push("Another webring member already uses that URL.");
  }

  let banner = existing.banner;
  if (input.bannerAction === "url") {
    const bannerUrl = String(input.bannerUrl || "").trim();
    if (!bannerUrl) {
      errors.push("Banner URL is required when replacing the banner.");
    } else {
      try {
        const buffer = await downloadFile(bannerUrl);
        const filename = id + ".gif";
        const savePath = path.join(__dirname, "../assets/banners", filename);
        await saveImage(buffer, savePath);
        banner = filename;
      } catch (e) {
        errors.push(
          `Could not download banner: ${(e as Error).message || "unknown error"}`
        );
      }
    }
  } else if (input.bannerAction === "regenerate") {
    try {
      const buffer = await generateBanner({
        id,
        name,
        url,
        email,
        description,
        isVintage: input.isVintage,
      });
      const filename = id + ".gif";
      const savePath = path.join(__dirname, "../assets/banners", filename);
      await saveImage(buffer, savePath);
      banner = filename;
    } catch (e) {
      errors.push(
        `Could not regenerate banner: ${(e as Error).message || "unknown error"}`
      );
    }
  }

  if (errors.length) return { ok: false, errors };

  await db.updateWebsite(id, {
    name,
    url,
    description,
    email,
    isVintage: !!input.isVintage,
    banner,
  });

  return { ok: true };
}
