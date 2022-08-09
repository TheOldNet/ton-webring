"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTextOnlyWidget = exports.generateBannerWidget = void 0;
var helpers_1 = require("./helpers");
function generateBannerWidget(website) {
    var host = (0, helpers_1.getHost)();
    return "\n  <a id=\"theoldnet-webring-href\" href=\"".concat(host, "/widget/").concat(website.id, "/navigate\" data-website-id=\"").concat(website.id, "\"><img src=\"").concat(host, "/widget/").concat(website.id, "/image\" alt=\"").concat(website.name, "\" border=\"0\"></a><br>\n  <font size=\"-1\">\n    Proud member of <a href=\"").concat(host, "/\"><b>TheOldNet</b></a> webring! Check some other cool websites!<br>\n    [<a href=\"").concat(host, "/member/").concat(website.id, "/previous/navigate\">Previous site</a>] -\n    [<a href=\"").concat(host, "/member/").concat(website.id, "/random/navigate\">Random site</a>] -\n    [<a href=\"").concat(host, "/member/").concat(website.id, "/next/navigate\">Next site</a>]\n  </font>\n  <script type=\"text/javascript\" src=\"").concat(host, "/widget/widget.js\"></script>\n  ");
}
exports.generateBannerWidget = generateBannerWidget;
function generateTextOnlyWidget(website) {
    var host = (0, helpers_1.getHost)();
    return "\n  <font size=\"-1\">\n    Proud member of <a href=\"".concat(host, "/\"><b>TheOldNet</b></a> webring! Check some other cool websites!<br>\n    [<a href=\"").concat(host, "/member/").concat(website.id, "/previous/navigate\">Previous site</a>] -\n    [<a href=\"").concat(host, "/member/").concat(website.id, "/random/navigate\">Random site</a>] -\n    [<a href=\"").concat(host, "/member/").concat(website.id, "/next/navigate\">Next site</a>]\n  </font>\n  ");
}
exports.generateTextOnlyWidget = generateTextOnlyWidget;
