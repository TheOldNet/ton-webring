// import * as fs from "fs";
import axios from "axios";
import { createCanvas, loadImage, registerFont } from "canvas";
import { WebsiteRequest } from "./types";
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

async function getFavicon(url: string): Promise<Buffer | undefined> {
  try {
    const response = await axios.get(
      `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=16`,
      { responseType: "arraybuffer" }
    );
    return Buffer.from(response.data, "binary");
  } catch {
    return undefined;
  }
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

export async function generateBanner(website: WebsiteRequest) {
  const width = 468;
  const height = 60;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = "#DDDDDD";
  context.fillRect(0, 0, width, height);

  const img = await loadImage(
    __dirname + "/../assets/site-banner-background.png"
  );
  context.drawImage(img, 0, 0, img.width, img.height);

  const faviconBuffer = await getFavicon(website.url);
  let x = 45;
  if (faviconBuffer) {
    const favicon = await loadImage(faviconBuffer);
    context.drawImage(favicon, x, 8, favicon.width, favicon.height);
    x += favicon.width;
  }

  const nw = width - 20 - x;
  const namePos = insertText(
    context,
    website.name,
    "bold 12pt Montserrat Regular",
    x + 5,
    5,
    "left",
    nw,
    18
  );

  insertText(
    context,
    website.url,
    "bold 8pt Montserrat Regular",
    x + 5,
    namePos.bottom
  );

  const rawBuffer = canvas.toBuffer("image/png");
  const buffer = await sharp(rawBuffer).gif().toBuffer();

  return buffer;
}
