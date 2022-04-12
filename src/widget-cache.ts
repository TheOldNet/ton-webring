import { DateTime } from "luxon";
import { getRandomWebsite } from "./db";
import { WebsiteAttributes } from "./types";

// Doing the widget cache in memory here for now,
// we can move it to redis eventually.
type CacheData = {
  time: DateTime;
  targetWebsiteId: string;
};

let cache: Record<string, CacheData> = {};

export async function updateCacheForSite(website: WebsiteAttributes) {
  let cachedSite = cache[website.id];
  if (!!cachedSite && cachedSite.time.diffNow().as("hours") < 1) {
    return;
  }

  const random = await getRandomWebsite(website.id);
  cachedSite = cache[website.id] = {
    time: DateTime.local(),
    targetWebsiteId: random.id,
  };
}

export async function getCachedWidgetData(website: WebsiteAttributes) {
  if (!cache[website.id]) {
    await updateCacheForSite(website);
  }

  return cache[website.id];
}
