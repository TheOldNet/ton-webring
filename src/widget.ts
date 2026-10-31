import { WebsiteAttributes } from "./types";
import { getHost } from "./helpers";

export function generateBannerWidget(website: WebsiteAttributes) {
  const host = getHost();
  return `
  <a id="theoldnet-webring-href" href="${host}/widget/${website.id}/navigate" data-website-id="${website.id}"><img src="${host}/widget/${website.id}/image" alt="${website.name}" border="0"></a><br>
  <font size="-1">
    Proud member of <a href="${host}/"><b>TheOldNet</b></a> webring! Check some other cool websites!<br>
    [<a href="${host}/member/${website.id}/previous/navigate">Previous site</a>] -
    [<a href="${host}/member/${website.id}/random/navigate">Random site</a>] -
    [<a href="${host}/member/${website.id}/next/navigate">Next site</a>]
  </font>
  <script type="text/javascript" src="${host}/widget/widget.js"></script>
  `;
}

/** Admin/preview only — shows this member's own banner so the /widget page isn't confusing. */
export function generateBannerWidgetPreview(website: WebsiteAttributes) {
  const host = getHost();
  const bannerFile = website.banner || "";
  const bannerSrc = bannerFile
    ? `${host}/assets/banners/${bannerFile}`
    : `${host}/widget/${website.id}/image`;
  return `
  <a href="${host}/"><img src="${bannerSrc}" alt="${website.name}" border="0"></a><br>
  <font size="-1">
    Proud member of <a href="${host}/"><b>TheOldNet</b></a> webring! Check some other cool websites!<br>
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
    Proud member of <a href="${host}/"><b>TheOldNet</b></a> webring! Check some other cool websites!<br>
    [<a href="${host}/member/${website.id}/previous/navigate">Previous site</a>] -
    [<a href="${host}/member/${website.id}/random/navigate">Random site</a>] -
    [<a href="${host}/member/${website.id}/next/navigate">Next site</a>]
  </font>
  `;
}
