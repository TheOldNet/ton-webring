import { WebsiteAttributes, WebsiteRequestAttributes } from "./types";
import { bannerPublicUrl, getHost } from "./helpers";

/** Shared embed id for non-members. Not a DB row — routes treat it specially. */
export const ANONYMOUS_WIDGET_ID = "anonymous";

export function isAnonymousWidgetId(id: string | undefined | null): boolean {
  return String(id || "").trim().toLowerCase() === ANONYMOUS_WIDGET_ID;
}

/** Synthetic owner for widget cache / pairing (image ↔ navigate). */
export function anonymousWidgetSite(): WebsiteAttributes {
  const host = getHost();
  return {
    id: ANONYMOUS_WIDGET_ID,
    name: "TheOldNet Webring",
    email: "",
    url: `${host}/`,
    description: "",
    isVintage: false,
  };
}

/** Pending submission → shape expected by generateBannerWidget / resolveWidgetOwner. */
export function websiteFromRequest(
  request: WebsiteRequestAttributes
): WebsiteAttributes {
  return {
    id: request.id,
    name: request.name,
    email: request.email,
    url: request.url,
    description: request.description,
    isVintage: !!request.isVintage,
    banner: undefined,
  };
}

/**
 * Banner image for a pending request preview: their submitted custom URL, or
 * on-the-fly generation (same as admin `/request-banner/:id`).
 */
export function pendingRequestBannerSrc(
  request: Pick<WebsiteRequestAttributes, "id" | "banner">
): string {
  const raw = String(request.banner || "").trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${getHost()}/request-banner/${request.id}`;
}

function memberNavHtml(websiteId: string, withNavClass: boolean): string {
  const host = getHost();
  if (withNavClass) {
    return `[<a class="theoldnet-webring-nav" data-nav="previous" href="${host}/member/${websiteId}/previous/navigate">Previous site</a>] -
    [<a class="theoldnet-webring-nav" data-nav="random" href="${host}/member/${websiteId}/random/navigate">Random site</a>] -
    [<a class="theoldnet-webring-nav" data-nav="next" href="${host}/member/${websiteId}/next/navigate">Next site</a>]`;
  }
  return `[<a href="${host}/member/${websiteId}/previous/navigate">Previous site</a>] -
    [<a href="${host}/member/${websiteId}/random/navigate">Random site</a>] -
    [<a href="${host}/member/${websiteId}/next/navigate">Next site</a>]`;
}

export function generateBannerWidget(website: WebsiteAttributes) {
  const host = getHost();
  // Modern browsers: widget.js intercepts .theoldnet-webring-nav clicks and swaps
  // banner + main link in place. hrefs remain for no-JS / vintage fallbacks.
  return `
  <a id="theoldnet-webring-href" href="${host}/widget/${website.id}/navigate" data-website-id="${website.id}"><img src="${host}/widget/${website.id}/image" alt="${website.name}" border="0" width="468" height="60"></a><br>
  <font size="-1">
    Proud member of TheOldNet <a href="${host}/"><b>Webring</b></a>! Check some other cool websites!<br>
    ${memberNavHtml(website.id, true)}
  </font>
  <script type="text/javascript" src="${host}/widget/widget.js"></script>
  `;
}

/** Admin/preview only — shows this member's own banner so the /widget page isn't confusing. */
export function generateBannerWidgetPreview(
  website: WebsiteAttributes,
  options?: { ownBannerSrc?: string }
) {
  const host = getHost();
  const override = String(options?.ownBannerSrc || "").trim();
  const bannerSrc =
    override ||
    bannerPublicUrl(website.banner, website.updatedAt) ||
    `${host}/widget/${website.id}/image`;
  return `
  <a href="${host}/"><img src="${bannerSrc}" alt="${website.name}" border="0" width="468" height="60"></a><br>
  <font size="-1">
    Proud member of TheOldNet <a href="${host}/"><b>Webring</b></a>! Check some other cool websites!<br>
    ${memberNavHtml(website.id, false)}
  </font>
  `;
}

export function generateTextOnlyWidget(website: WebsiteAttributes) {
  const host = getHost();
  return `
  <font size="-1">
    Proud member of TheOldNet <a href="${host}/"><b>Webring</b></a>! Check some other cool websites!<br>
    ${memberNavHtml(website.id, false)}
  </font>
  `;
}

/** Non-member share embed — same ring navigation, no site ID required. */
export function generateAnonymousBannerWidget() {
  const host = getHost();
  const id = ANONYMOUS_WIDGET_ID;
  return `
  <a id="theoldnet-webring-href" href="${host}/widget/${id}/navigate" data-website-id="${id}"><img src="${host}/widget/${id}/image" alt="TheOldNet Webring" border="0" width="468" height="60"></a><br>
  <font size="-1">
    Proud member of TheOldNet <a href="${host}/"><b>Webring</b></a>! Check some other cool websites!<br>
    ${memberNavHtml(id, true)}
  </font>
  <script type="text/javascript" src="${host}/widget/widget.js"></script>
  `;
}

export function generateAnonymousBannerWidgetPreview() {
  const host = getHost();
  const id = ANONYMOUS_WIDGET_ID;
  return `
  <a href="${host}/widget/${id}/navigate"><img src="${host}/widget/${id}/image" alt="TheOldNet Webring" border="0" width="468" height="60"></a><br>
  <font size="-1">
    Proud member of TheOldNet <a href="${host}/"><b>Webring</b></a>! Check some other cool websites!<br>
    ${memberNavHtml(id, false)}
  </font>
  `;
}

export function generateAnonymousTextOnlyWidget() {
  const host = getHost();
  const id = ANONYMOUS_WIDGET_ID;
  return `
  <font size="-1">
    Proud member of TheOldNet <a href="${host}/"><b>Webring</b></a>! Check some other cool websites!<br>
    ${memberNavHtml(id, false)}
  </font>
  `;
}
