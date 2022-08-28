"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOldBrowser = void 0;
function isOldBrowser(req) {
    var userAgent = req.useragent;
    var major = parseFloat(userAgent.version);
    if ((userAgent.isIE && major < 11) ||
        (userAgent.isOpera && major < 60) ||
        (userAgent.isChrome && major < 50) ||
        (userAgent.isFirefox && major < 50) ||
        (userAgent.isSafari && major < 4) ||
        userAgent.browser.toLowerCase().includes("mosaic") ||
        userAgent.browser.toLowerCase().includes("ncsa") ||
        userAgent.browser.toLowerCase().includes("netpositive") ||
        userAgent.browser.toLowerCase().includes("arachne") ||
        userAgent.browser.toLowerCase().includes("netscape") ||
        userAgent.browser.toLowerCase().includes("planetweb") ||
        userAgent.browser.toLowerCase().includes("dreamkey") ||
        userAgent.browser.toLowerCase().includes("xdp") ||
        userAgent.browser.toLowerCase().includes("dreampassport") ||
        userAgent.browser.toLowerCase().includes("unknown")) {
        return true;
    }
    return false;
}
exports.isOldBrowser = isOldBrowser;
