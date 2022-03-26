import { WebsiteAttributes } from "./types";
import { getHost } from "./helpers";

export function generateWidget(website: WebsiteAttributes) {
  const host = getHost();
  return `
  <a id="theoldnet-webring-href" href="${host}/widget/${website.id}/navigate" data-website-id="${website.id}"><img src="${host}/widget/${website.id}/image" alt="${website.name}" border="0"></a><br>
  <font size="-1">
    Proud member of <a href="${host}/"><b>TheOldNet</b></a> webring! Check some other cool websites!<br>
    [<a href="${host}/${website.id}/previous/navigate">Previous site</a>] -
    [<a href="${host}/${website.id}/random/navigate">Random site</a>] -
    [<a href="${host}/${website.id}/next/navigate">Next site</a>]
  </font>
  <script type="text/javascript" src="/widget/widget.js"></script>
  `;
}
