import * as db from "./db";
import { isAnonymousWidgetId } from "./widget";
import { AnalyticsEventType } from "./types";

const MAX_REFERER = 1024;

/** Best-effort embedding page from the request Referer header. */
export function sanitizeReferer(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) return null;
  return s.length > MAX_REFERER ? s.slice(0, MAX_REFERER) : s;
}

/**
 * Fire-and-forget: update member last-seen from a widget image load.
 * Skips the anonymous share widget (no website row).
 */
export function recordEmbedImageLoad(
  websiteId: string,
  refererHeader: unknown
): void {
  if (isAnonymousWidgetId(websiteId)) return;
  const referer = sanitizeReferer(refererHeader);
  void db.touchEmbedSeen(websiteId, referer).catch((err) => {
    console.error("analytics touchEmbedSeen failed:", err);
  });
}

export function recordClick(opts: {
  type: AnalyticsEventType;
  fromWebsiteId: string;
  toWebsiteId?: string | null;
  toUrl?: string | null;
  referer?: unknown;
  isOldBrowser?: boolean;
}): void {
  const referer = sanitizeReferer(opts.referer);
  void db
    .createAnalyticsEvent({
      type: opts.type,
      fromWebsiteId: opts.fromWebsiteId,
      toWebsiteId: opts.toWebsiteId || null,
      toUrl: opts.toUrl
        ? opts.toUrl.length > MAX_REFERER
          ? opts.toUrl.slice(0, MAX_REFERER)
          : opts.toUrl
        : null,
      referer,
      isOldBrowser: !!opts.isOldBrowser,
    })
    .catch((err) => {
      console.error("analytics createEvent failed:", err);
    });
}
