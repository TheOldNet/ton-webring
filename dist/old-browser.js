"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOldBrowser = void 0;
function isOldBrowser(req) {
    var userAgent = req.useragent;
    var major = parseFloat(userAgent.version);
    if ((userAgent.isFirefox || userAgent.isChrome) && major < 50) {
        return true;
    }
    if (userAgent.isSafari && major < 4) {
        return true;
    }
    if (userAgent.isOpera && major < 60) {
        return true;
    }
    if (userAgent.isIE ||
        userAgent.browser.toLowerCase().includes("netscape") ||
        userAgent.browser.toLowerCase().includes("other") ||
        userAgent.browser.toLowerCase() === "mozilla") {
        return true;
    }
    return false;
}
exports.isOldBrowser = isOldBrowser;
