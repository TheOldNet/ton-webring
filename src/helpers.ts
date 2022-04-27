import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import sharp = require("sharp");
import { HOST } from "./config";

// An actual domain
export function getHost() {
  return HOST;
}

export async function downloadFile(
  fileUrl: string,
  outputLocationPath: string
): Promise<boolean> {
  const response = await axios({
    method: "GET",
    url: fileUrl,
    responseType: "stream",
  });
  return new Promise((resolve) => {
    const w = response.data.pipe(fs.createWriteStream(outputLocationPath));
    w.on("finish", () => {
      resolve(true);
    });
  });
}

export async function downloadBanner(id: string, fileUrl?: string) {
  if (!fileUrl) {
    return undefined;
  }
  const filename = id + path.extname(fileUrl);
  const savePath = path.join(__dirname, "../assets/banners", filename);
  await downloadFile(fileUrl, savePath);
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
