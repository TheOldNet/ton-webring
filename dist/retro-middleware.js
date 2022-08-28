"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retroMiddleware = void 0;
var old_browser_1 = require("./old-browser");
function retroMiddleware(req, _, next) {
    req.isOldBrowser = (0, old_browser_1.isOldBrowser)(req);
    next();
}
exports.retroMiddleware = retroMiddleware;
