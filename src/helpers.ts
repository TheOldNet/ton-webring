import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import sharp = require("sharp");
import { generateBanner } from "./banner";
import { HOST } from "./config";
import { WebsiteRequestAttributes } from "./types";

// An actual domain
export function getHost() {
  return HOST;
}

/**
 * Public banner URL with cache-buster. Banner files keep a stable name (`{id}.gif`);
 * without ?v=, browsers keep showing the pre-edit image after admin replaces the file.
 */
export function bannerPublicPath(
  bannerFile: string | null | undefined,
  version?: string | number | Date | null
): string {
  const file = String(bannerFile || "").trim();
  if (!file) return "";
  let v = "";
  if (version instanceof Date) {
    v = String(version.getTime());
  } else if (version != null && String(version).trim() !== "") {
    const d = new Date(String(version));
    v = Number.isFinite(d.getTime()) ? String(d.getTime()) : String(version);
  }
  const pathOnly = `/assets/banners/${file}`;
  return v ? `${pathOnly}?v=${encodeURIComponent(v)}` : pathOnly;
}

export function bannerPublicUrl(
  bannerFile: string | null | undefined,
  version?: string | number | Date | null
): string {
  const pathOnly = bannerPublicPath(bannerFile, version);
  return pathOnly ? `${getHost()}${pathOnly}` : "";
}

/**
 * Ensure member/site URLs are absolute so href/redirect never treat
 * "pavelsoftware.neocities.org" as a path on webring.theoldnet.com.
 */
export function normalizeExternalUrl(
  raw: string,
  opts?: { preferHttp?: boolean }
): string {
  let url = String(raw || "").trim();
  if (!url) return url;

  // Strip accidental leading slashes that aren't scheme-relative ("//host")
  if (url.startsWith("/") && !url.startsWith("//")) {
    url = url.replace(/^\/+/, "");
  }

  if (/^https?:\/\//i.test(url)) return url;

  const scheme = opts?.preferHttp ? "http:" : "https:";
  if (url.startsWith("//")) return scheme + url;

  return `${scheme}//${url}`;
}

export function getWebringUrl(
  path: string,
  websiteUrl: string,
  isRetro: boolean
) {
  const host = getHost();

  let url = `${host}${path}`;

  if (websiteUrl.startsWith("https:")) {
    url = `https:` + url;
  } else if (websiteUrl.startsWith("http:")) {
    url = `http:` + url;
  } else if (websiteUrl.startsWith("//") && isRetro) {
    url = `http:` + url;
  } else if (
    /^[\w]+?/gim.exec(websiteUrl) &&
    !websiteUrl.startsWith("//") &&
    !websiteUrl.startsWith("http")
  ) {
    url = (isRetro ? "http:" : "https:") + url;
  }

  if (host.includes("192.168.1.") || host.includes("localhost:")) {
    const begining = /^((.+)?\/\/)?/gim.exec(url);
    url = url.replace("https", "http") + "?type=" + encodeURI(begining[0]);
  }

  return url;
}

export async function saveImage(buff: Buffer, path: string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, buff, {}, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(null);
    });
  });
}

export async function downloadFile(fileUrl: string): Promise<Buffer> {
  const response = await axios({
    method: "GET",
    url: fileUrl,
    responseType: "arraybuffer",
    timeout: 15000,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
  });
  const buffer = Buffer.from(response.data);

  // Reject obvious non-images (error HTML pages, etc.) before sharp blows up.
  const ct = String(response.headers["content-type"] || "").toLowerCase();
  if (ct.includes("text/html") || ct.includes("application/json")) {
    throw new Error(`Banner URL returned non-image content-type: ${ct || "(empty)"}`);
  }
  if (buffer.length >= 15 && buffer.slice(0, 15).toString("utf8").toUpperCase().includes("<!DOCTYPE")) {
    throw new Error("Banner URL returned HTML instead of an image");
  }

  const sImage = sharp(buffer);
  const metadata = await sImage.metadata();

  if (!metadata.format) {
    throw new Error("Banner URL was not a recognizable image");
  }

  if (metadata.format === "gif") {
    return buffer;
  }

  return sImage.gif().toBuffer();
}

export async function downloadBanner(request: WebsiteRequestAttributes) {
  const filename = request.id + ".gif";
  let buffer: Buffer;
  if (!request.banner) {
    buffer = await generateBanner(request);
  } else {
    try {
      buffer = await downloadFile(request.banner);
    } catch (e) {
      console.error(
        `Banner download failed for ${request.id} (${request.banner}), generating fallback:`,
        (e as Error).message || e
      );
      buffer = await generateBanner(request);
    }
  }
  const savePath = path.join(__dirname, "../assets/banners", filename);
  await saveImage(buffer, savePath);

  return filename;
}

export async function convertPng(buffer: Buffer) {
  const img = sharp(buffer);
  const metadata = await img.metadata();
  if (metadata.format !== "png") {
    return buffer;
  }
  return img.toFormat(sharp.format.gif).toBuffer();
}

export async function isValidBanner(url: string) {
  try {
    const response = await axios({
      method: "GET",
      url,
      responseType: "arraybuffer",
    });

    if (response.status !== 200) {
      return false;
    }

    const img = sharp(response.data);

    const metadata = await img.metadata();

    if (
      metadata.format !== "jpeg" &&
      metadata.format !== "jpg" &&
      metadata.format !== "gif"
    ) {
      return false;
    }

    if (metadata.width != 468 && metadata.height != 60) {
      return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}
