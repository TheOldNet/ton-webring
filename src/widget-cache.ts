import { DateTime } from "luxon";
import { getRandomWebsite } from "./db";
import { WebsiteAttributes } from "./types";

// Doing the widget cache in memory here for now,
// we can move it to redis eventually.
type CacheData = {
  time: DateTime;
  targetWebsiteId: string;
};

let retroCache: Record<string, CacheData> = {};
let modernCache: Record<string, CacheData> = {};

export async function updateCacheForSite(
  website: WebsiteAttributes,
  isVintage: boolean
) {
  let cachedSite = isVintage ? retroCache[website.id] : modernCache[website.id];
  if (!!cachedSite && cachedSite.time.diffNow().as("hours") < 2) {
    return;
  }

  const random = await getRandomWebsite(isVintage, website.id);
  if (isVintage) {
    cachedSite = retroCache[website.id] = {
      time: DateTime.local(),
      targetWebsiteId: random.id,
    };
  } else {
    cachedSite = modernCache[website.id] = {
      time: DateTime.local(),
      targetWebsiteId: random.id,
    };
  }
}

export async function getCachedWidgetData(
  website: WebsiteAttributes,
  isVintage: boolean
) {
  if (
    (isVintage && !retroCache[website.id]) ||
    (!isVintage && !retroCache[website.id])
  ) {
    await updateCacheForSite(website, isVintage);
  }

  if (isVintage) {
    return retroCache[website.id];
  }

  return modernCache[website.id];
}
