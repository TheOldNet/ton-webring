// import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { createCanvas, loadImage, registerFont } from "canvas";
import { WebsiteRequestAttributes } from "./types";
import sharp = require("sharp");
registerFont(__dirname + "/../assets/fonts/Montserrat-Regular.ttf", {
  family: "Montserrat Regular",
});
registerFont(__dirname + "/../assets/fonts/W95FA.otf", { family: "win95fa" });

type TextPositions = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export type GeneratedBanner = {
  buffer: Buffer;
  /** True when a live site favicon was found and drawn (new template). */
  hasFavicon: boolean;
};

const BANNER_BG = { r: 221, g: 221, b: 221 };
/** Top/left/bottom frame is 2px — icon height = banner − 4, inset 2px. */
const BORDER_PX = 2;
const BG_GLOBE = path.join(__dirname, "../assets/site-banner-background.png");
const BG_NOGLOBE = path.join(__dirname, "../assets/site-banner-noglobe.png");

async function tryLoadImageBuffer(url: string): Promise<Buffer | undefined> {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      validateStatus: () => true,
      timeout: 8000,
      headers: {
        "User-Agent": "TheOldNet-Webring/1.0",
        Accept: "image/*,*/*",
      },
      maxRedirects: 5,
    });
    // Ignore non-200 (Google's 404 body is a generic globe, not the site icon).
    if (response.status !== 200) return undefined;
    const buf = Buffer.from(response.data);
    if (!buf.length) return undefined;
    const ct = String(response.headers["content-type"] || "").toLowerCase();
    if (ct.includes("text/html")) return undefined;
    try {
      await sharp(buf).metadata();
    } catch {
      return undefined;
    }
    return buf;
  } catch {
    return undefined;
  }
}

function siteOrigin(rawUrl: string): string | undefined {
  try {
    const u = new URL(
      /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
    );
    return u.origin;
  } catch {
    return undefined;
  }
}

function absolutizeUrl(href: string, base: string): string | undefined {
  try {
    return new URL(href, base).href;
  } catch {
    return undefined;
  }
}

async function faviconUrlsFromHtml(pageUrl: string): Promise<string[]> {
  try {
    const response = await axios.get(pageUrl, {
      timeout: 8000,
      validateStatus: (s) => s >= 200 && s < 400,
      headers: {
        "User-Agent": "TheOldNet-Webring/1.0",
        Accept: "text/html,*/*",
      },
      maxRedirects: 5,
      responseType: "text",
      maxContentLength: 1_500_000,
    });
    const html = String(response.data || "");
    const base =
      typeof response.request?.res?.responseUrl === "string"
        ? response.request.res.responseUrl
        : pageUrl;
    const out: string[] = [];
    const re = /<link\b[^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
      const tag = m[0];
      if (!/\brel\s*=\s*["'][^"']*icon/i.test(tag)) continue;
      const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
      if (!href) continue;
      const abs = absolutizeUrl(href[1].trim(), base);
      if (abs) out.push(abs);
    }
    return out;
  } catch {
    return [];
  }
}

/** Live site favicon only (HTML link, common paths, then Google if HTTP 200). */
export async function getFavicon(url: string): Promise<Buffer | undefined> {
  const pageUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const origin = siteOrigin(pageUrl);
  const candidates: string[] = [];

  candidates.push(...(await faviconUrlsFromHtml(pageUrl)));
  if (origin) {
    candidates.push(
      `${origin}/favicon.ico`,
      `${origin}/favicon.png`,
      `${origin}/favicon.gif`,
      `${origin}/apple-touch-icon.png`
    );
  }
  candidates.push(
    `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
      pageUrl
    )}&size=16`
  );

  const seen = new Set<string>();
  for (const src of candidates) {
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const buf = await tryLoadImageBuffer(src);
    if (buf) return buf;
  }
  return undefined;
}

async function buildPixelFaviconStrip(
  faviconBuffer: Buffer,
  bannerHeight: number
): Promise<{ png: Buffer; width: number; left: number; top: number }> {
  const flattened = await sharp(faviconBuffer)
    .ensureAlpha()
    .flatten({ background: BANNER_BG })
    .png()
    .toBuffer();

  let trimmed: Buffer;
  try {
    trimmed = await sharp(flattened)
      .trim({ threshold: 12 })
      .png()
      .toBuffer();
  } catch {
    trimmed = flattened;
  }

  const meta = await sharp(trimmed).metadata();
  const srcW = Math.max(1, meta.width || 16);
  const srcH = Math.max(1, meta.height || 16);

  // Height minus 2px top + 2px bottom; placed at left/top = 2.
  const drawH = Math.max(1, bannerHeight - BORDER_PX * 2);
  const drawW = Math.max(1, Math.round(srcW * (drawH / srcH)));
  const intScale = Math.max(1, Math.round(drawH / srcH));

  const mid = await sharp(trimmed)
    .resize(srcW * intScale, srcH * intScale, {
      kernel: sharp.kernel.nearest,
      fit: "fill",
    })
    .png()
    .toBuffer();

  const png =
    srcH * intScale === drawH
      ? mid
      : await sharp(mid)
          .resize(drawW, drawH, {
            kernel: sharp.kernel.nearest,
            fit: "fill",
          })
          .png()
          .toBuffer();

  return {
    png,
    width: drawW,
    left: BORDER_PX,
    top: BORDER_PX,
  };
}

function insertText(
  context: CanvasRenderingContext2D,
  text: string,
  font: string,
  x: number,
  y: number,
  textAlign: CanvasTextAlign = "left",
  width?: number,
  height?: number
): TextPositions {
  context.font = font;
  context.textAlign = textAlign;
  context.textBaseline = "top";
  context.fillStyle = "#000000";

  if (width && context.measureText(text).width > width) {
    text = text.substring(0, text.length - 3) + "...";
    while (context.measureText(text + "...").width > width) {
      text = text.substring(0, text.length - 1);
    }
    text += "...";
  }
  const measure = context.measureText(text);
  const nw = width || measure.width + x;
  const nh = height || measure.actualBoundingBoxDescent;
  context.fillText(text, x, y);

  return {
    top: y,
    left: x,
    bottom: y + nh,
    right: x + nw,
  };
}

/**
 * New submissions: favicon → new left-icon template; no favicon → old stock template.
 * Callers that regenerate existing members should skip saving when hasFavicon is false.
 */
export async function generateBanner(
  website: WebsiteRequestAttributes
): Promise<GeneratedBanner> {
  const width = 468;
  const height = 60;

  const faviconBuffer = await getFavicon(website.url);
  const favStrip = faviconBuffer
    ? await buildPixelFaviconStrip(faviconBuffer, height)
    : null;

  const textLeft = favStrip ? favStrip.left + favStrip.width + 8 : 45;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = `rgb(${BANNER_BG.r},${BANNER_BG.g},${BANNER_BG.b})`;
  context.fillRect(0, 0, width, height);

  // Favicon sites use the noglobe plate; others keep the classic globe template.
  const img = await loadImage(favStrip ? BG_NOGLOBE : BG_GLOBE);
  context.drawImage(img, 0, 0, img.width, img.height);

  const nameMaxWidth = width - 20 - textLeft;
  const namePos = insertText(
    context,
    website.name,
    "bold 12pt Montserrat Regular",
    textLeft,
    5,
    "left",
    nameMaxWidth,
    18
  );

  insertText(
    context,
    website.url,
    "bold 8pt Montserrat Regular",
    textLeft,
    namePos.bottom
  );

  const rawBuffer = canvas.toBuffer("image/png");
  let composed = sharp(rawBuffer);
  if (favStrip) {
    composed = composed.composite([
      {
        input: favStrip.png,
        left: favStrip.left,
        top: favStrip.top,
      },
    ]);
  }

  const buffer = await composed.gif().toBuffer();
  return { buffer, hasFavicon: !!favStrip };
}
