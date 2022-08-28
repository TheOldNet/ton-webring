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
  });
  const buffer = Buffer.from(response.data, "binary");

  const sImage = sharp(buffer);
  const metadata = await sImage.metadata();

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
    buffer = await downloadFile(request.banner);
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
