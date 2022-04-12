import axios from "axios";
import * as fs from "fs";
import * as path from "path";
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
