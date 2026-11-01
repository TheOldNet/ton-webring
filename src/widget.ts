import { WebsiteAttributes } from "./types";
import { bannerPublicUrl, getHost } from "./helpers";

export function generateBannerWidget(website: WebsiteAttributes) {
  const host = getHost();
  // Modern browsers: widget.js intercepts .theoldnet-webring-nav clicks and swaps
  // banner + main link in place. hrefs remain for no-JS / vintage fallbacks.
  return `
  <a id="theoldnet-webring-href" href="${host}/widget/${website.id}/navigate" data-website-id="${website.id}"><img src="${host}/widget/${website.id}/image" alt="${website.name}" border="0"></a><br>
  <font size="-1">
    Proud member of TheOldNet <a href="${host}/"><b>Webring</b></a>! Check some other cool websites!<br>
    [<a class="theoldnet-webring-nav" data-nav="previous" href="${host}/member/${website.id}/previous/navigate">Previous site</a>] -
    [<a class="theoldnet-webring-nav" data-nav="random" href="${host}/member/${website.id}/random/navigate">Random site</a>] -
    [<a class="theoldnet-webring-nav" data-nav="next" href="${host}/member/${website.id}/next/navigate">Next site</a>]
  </font>
  <script type="text/javascript" src="${host}/widget/widget.js"></script>
  `;
}

/** Admin/preview only — shows this member's own banner so the /widget page isn't confusing. */
export function generateBannerWidgetPreview(website: WebsiteAttributes) {
  const host = getHost();
  const bannerSrc =
    bannerPublicUrl(website.banner, website.updatedAt) ||
    `${host}/widget/${website.id}/image`;
  return `
  <a href="${host}/"><img src="${bannerSrc}" alt="${website.name}" border="0"></a><br>
  <font size="-1">
    Proud member of TheOldNet <a href="${host}/"><b>Webring</b></a>! Check some other cool websites!<br>
    [<a href="${host}/member/${website.id}/previous/navigate">Previous site</a>] -
    [<a href="${host}/member/${website.id}/random/navigate">Random site</a>] -
    [<a href="${host}/member/${website.id}/next/navigate">Next site</a>]
  </font>
  `;
}

export function generateTextOnlyWidget(website: WebsiteAttributes) {
  const host = getHost();
  return `
  <font size="-1">
    Proud member of TheOldNet <a href="${host}/"><b>Webring</b></a>! Check some other cool websites!<br>
    [<a href="${host}/member/${website.id}/previous/navigate">Previous site</a>] -
    [<a href="${host}/member/${website.id}/random/navigate">Random site</a>] -
    [<a href="${host}/member/${website.id}/next/navigate">Next site</a>]
  </font>
  `;
}
