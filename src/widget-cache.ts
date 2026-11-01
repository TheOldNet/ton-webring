import { DateTime } from "luxon";
import { getRandomWebsite } from "./db";
import { WebsiteAttributes } from "./types";

// In-memory pairing so /image and /navigate stay in sync for non-JS clients.
// Modern browsers force a new target on each image load; JS then syncs the href.
type CacheData = {
  time: DateTime;
  targetWebsiteId: string;
};

let retroCache: Record<string, CacheData> = {};
let modernCache: Record<string, CacheData> = {};

function cacheFor(isVintage: boolean) {
  return isVintage ? retroCache : modernCache;
}

export async function updateCacheForSite(
  website: WebsiteAttributes,
  isVintage: boolean,
  force: boolean = false
) {
  const cache = cacheFor(isVintage);
  const cachedSite = cache[website.id];

  // Vintage: keep the same pairing for ~2 hours so banner + click stay matched.
  // Modern: callers pass force=true on image load for a fresh banner each page view.
  if (!force && cachedSite) {
    const ageHours = DateTime.now().diff(cachedSite.time).as("hours");
    if (ageHours < 2) {
      return;
    }
  }

  const random = await getRandomWebsite(isVintage, website.id);
  cache[website.id] = {
    time: DateTime.local(),
    targetWebsiteId: random.id,
  };
}

export async function getCachedWidgetData(
  website: WebsiteAttributes,
  isVintage: boolean
) {
  const cache = cacheFor(isVintage);
  if (!cache[website.id]) {
    await updateCacheForSite(website, isVintage, true);
  }
  return cache[website.id];
}

/** Point the widget pairing at a known target (after in-place prev/next/random). */
export function setCachedWidgetTarget(
  websiteId: string,
  targetWebsiteId: string,
  isVintage: boolean
) {
  const cache = cacheFor(isVintage);
  cache[websiteId] = {
    time: DateTime.local(),
    targetWebsiteId,
  };
}
