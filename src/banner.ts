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

type Rgb = { r: number; g: number; b: number };

const BANNER_BG: Rgb = { r: 221, g: 221, b: 221 };
/** Top/left/bottom inset for favicon strip. */
const BORDER_PX = 2;
/** Leave room for the right-side WEBRING mark (text must not enter this zone). */
const TEXT_RIGHT_RESERVE = 120;
/** Vertical gap between title / description / bottom-anchored URL. */
const TEXT_ROW_GAP = 3;
/** URL row height + bottom padding — URL is pinned to the banner bottom. */
const URL_BOTTOM_PAD = 3;
const URL_LINE_H = 9;
/**
 * Relative luminance above this → black text; at/below → white text.
 * (WCAG relative luminance, mid-ish threshold for short banner type.)
 */
const TEXT_LUMINANCE_THRESHOLD = 0.55;

const BG_GLOBE = path.join(__dirname, "../assets/site-banner-background.png");
const BG_NOBG = path.join(__dirname, "../assets/site-banner-nobg.png");

function relativeLuminance({ r, g, b }: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function textColorForBg(bg: Rgb): string {
  return relativeLuminance(bg) > TEXT_LUMINANCE_THRESHOLD
    ? "#000000"
    : "#ffffff";
}

/** Most common opaque (quantized) color in the favicon — used as banner fill. */
async function sampleFaviconDominantColor(faviconBuffer: Buffer): Promise<Rgb> {
  const { data, info } = await sharp(faviconBuffer)
    .ensureAlpha()
    .resize(48, 48, { fit: "inside", kernel: sharp.kernel.nearest })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map<
    string,
    { count: number; r: number; g: number; b: number }
  >();
  let bestKey = "";
  let bestCount = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    const a = info.channels === 4 ? data[i + 3] : 255;
    if (a < 128) continue;
    // 16-level buckets keep “predominant” stable on tiny noisy icons.
    const r = data[i] & 0xf0;
    const g = data[i + 1] & 0xf0;
    const b = data[i + 2] & 0xf0;
    const key = `${r},${g},${b}`;
    const prev = buckets.get(key);
    const next = prev
      ? {
          count: prev.count + 1,
          r: prev.r + data[i],
          g: prev.g + data[i + 1],
          b: prev.b + data[i + 2],
        }
      : { count: 1, r: data[i], g: data[i + 1], b: data[i + 2] };
    buckets.set(key, next);
    if (next.count > bestCount) {
      bestCount = next.count;
      bestKey = key;
    }
  }

  if (!bestKey || bestCount === 0) return { ...BANNER_BG };
  const win = buckets.get(bestKey)!;
  return {
    r: Math.round(win.r / win.count),
    g: Math.round(win.g / win.count),
    b: Math.round(win.b / win.count),
  };
}

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
  bannerHeight: number,
  flattenBg: Rgb = BANNER_BG
): Promise<{ png: Buffer; width: number; left: number; top: number }> {
  const flattened = await sharp(faviconBuffer)
    .ensureAlpha()
    .flatten({ background: flattenBg })
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
  height?: number,
  fillStyle: string = "#000000"
): TextPositions {
  context.font = font;
  context.textAlign = textAlign;
  context.textBaseline = "top";
  context.fillStyle = fillStyle;

  if (width && context.measureText(text).width > width) {
    text = text.substring(0, text.length - 3) + "...";
    while (context.measureText(text + "...").width > width) {
      text = text.substring(0, text.length - 1);
    }
    text += "...";
  }
  const measure = context.measureText(text);
  const measuredWidth = width || measure.width + x;
  const measuredHeight = height || measure.actualBoundingBoxDescent;
  context.fillText(text, x, y);

  return {
    top: y,
    left: x,
    bottom: y + measuredHeight,
    right: x + measuredWidth,
  };
}

function ellipsizeToWidth(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (context.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && context.measureText(t + "...").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t.length ? t + "..." : "";
}

/** Word-wrap into up to maxLines; last line gets … if content remains. */
function layoutDescriptionLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length || maxLines < 1) return [];

  const lines: string[] = [];
  let i = 0;
  while (i < words.length && lines.length < maxLines) {
    let line = words[i++];
    while (i < words.length) {
      const trial = `${line} ${words[i]}`;
      if (context.measureText(trial).width <= maxWidth) {
        line = trial;
        i++;
      } else {
        break;
      }
    }
    const isLastSlot = lines.length === maxLines - 1;
    if (isLastSlot && i < words.length) {
      lines.push(
        ellipsizeToWidth(context, `${line} ${words.slice(i).join(" ")}`, maxWidth)
      );
      break;
    }
    lines.push(
      context.measureText(line).width > maxWidth
        ? ellipsizeToWidth(context, line, maxWidth)
        : line
    );
  }
  return lines;
}

/**
 * Description under the title (row 2). Short → one 8pt line; long → up to two
 * 7pt lines with ellipsis. `maxBottom` leaves room for the smaller URL row.
 */
function insertDescription(
  context: CanvasRenderingContext2D,
  description: string | undefined,
  x: number,
  y: number,
  maxWidth: number,
  maxBottom: number,
  fillStyle: string
): TextPositions {
  const empty: TextPositions = { top: y, left: x, bottom: y, right: x };
  const text = String(description || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || maxWidth < 20 || y >= maxBottom) return empty;

  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillStyle = fillStyle;

  context.font = "bold 8pt Montserrat Regular";
  if (context.measureText(text).width <= maxWidth) {
    context.fillText(text, x, y);
    return { top: y, left: x, bottom: y + 11, right: x + maxWidth };
  }

  const lineH = 10;
  const maxLines = y + lineH * 2 <= maxBottom + 1 ? 2 : 1;
  context.font = "bold 7pt Montserrat Regular";
  const lines = layoutDescriptionLines(context, text, maxWidth, maxLines);
  for (let i = 0; i < lines.length; i++) {
    context.fillText(lines[i], x, y + i * lineH);
  }
  return {
    top: y,
    left: x,
    bottom: y + Math.max(1, lines.length) * lineH,
    right: x + maxWidth,
  };
}

/**
 * New submissions: favicon → transparent plate + sampled bg; no favicon → classic globe.
 * Callers that regenerate existing members should skip saving when hasFavicon is false.
 */
export async function generateBanner(
  website: WebsiteRequestAttributes
): Promise<GeneratedBanner> {
  const width = 468;
  const height = 60;

  const faviconBuffer = await getFavicon(website.url);
  const bgColor = faviconBuffer
    ? await sampleFaviconDominantColor(faviconBuffer)
    : BANNER_BG;
  const textFill = faviconBuffer ? textColorForBg(bgColor) : "#000000";

  const favStrip = faviconBuffer
    ? await buildPixelFaviconStrip(faviconBuffer, height, bgColor)
    : null;

  const textLeft = favStrip ? favStrip.left + favStrip.width + 8 : 45;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = `rgb(${bgColor.r},${bgColor.g},${bgColor.b})`;
  context.fillRect(0, 0, width, height);

  // Favicon sites: transparent branding plate over sampled color; else classic globe.
  const img = await loadImage(favStrip ? BG_NOBG : BG_GLOBE);
  context.drawImage(img, 0, 0, img.width, img.height);

  const textMaxWidth = width - TEXT_RIGHT_RESERVE - textLeft;
  const urlTop = height - URL_BOTTOM_PAD - URL_LINE_H;

  const namePos = insertText(
    context,
    website.name,
    "bold 12pt Montserrat Regular",
    textLeft,
    4,
    "left",
    textMaxWidth,
    15,
    textFill
  );

  // Row 2: description — sits under the title; URL stays pinned below any leftover gap.
  insertDescription(
    context,
    website.description,
    textLeft,
    namePos.bottom + TEXT_ROW_GAP,
    textMaxWidth,
    urlTop - TEXT_ROW_GAP,
    textFill
  );

  // Row 3: URL anchored to the bottom (empty space above when description is short/missing).
  insertText(
    context,
    website.url,
    "bold 6pt Montserrat Regular",
    textLeft,
    urlTop,
    "left",
    textMaxWidth,
    URL_LINE_H,
    textFill
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
