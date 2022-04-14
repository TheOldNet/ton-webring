"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var bodyParser = require("body-parser");
var express = require("express");
var express_recaptcha_1 = require("express-recaptcha");
var useragent = require("express-useragent");
var fs = require("fs");
var jwt = require("jsonwebtoken");
var path = require("path");
var UglifyJs = require("uglify-js");
var admin_actions_1 = require("./admin-actions");
var auth_middleware_1 = require("./auth-middleware");
var config_1 = require("./config");
var db_1 = require("./db");
var old_browser_1 = require("./old-browser");
var widget_1 = require("./widget");
var widget_cache_1 = require("./widget-cache");
var cookieParser = require("cookie-parser");
var app = express();
(0, db_1.connect)();
var recaptcha = new express_recaptcha_1.RecaptchaV2(config_1.RECAPTCHA_SITE_KEY, config_1.RECAPTCHA_SECRET_KEY, {
    callback: "cb",
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "vash");
app.set("etag", false);
app.use(useragent.express());
app.use(cookieParser());
app.use("/assets", express.static("assets"));
app.get("/member/:website/next/navigate", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var website, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                website = req.params.website;
                return [4, (0, db_1.getNextWebsite)(website)];
            case 1:
                result = _a.sent();
                res.redirect(result.url);
                return [2];
        }
    });
}); });
app.get("/member/:website/previous/navigate", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var website, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                website = req.params.website;
                return [4, (0, db_1.getPreviousWebsite)(website)];
            case 1:
                result = _a.sent();
                res.redirect(result.url);
                return [2];
        }
    });
}); });
app.get("/member/:website/random/navigate", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var website, random;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                website = req.params.website;
                return [4, (0, db_1.getRandomWebsite)(website)];
            case 1:
                random = _a.sent();
                res.redirect(random.url);
                return [2];
        }
    });
}); });
app.get("/api/member/:website/next", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var website, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                website = req.params.website;
                return [4, (0, db_1.getNextWebsite)(website)];
            case 1:
                result = _a.sent();
                res.send(result);
                return [2];
        }
    });
}); });
app.get("/api/member/:website/previous", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var website, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                website = req.params.website;
                return [4, (0, db_1.getPreviousWebsite)(website)];
            case 1:
                result = _a.sent();
                res.send(result);
                return [2];
        }
    });
}); });
app.get("/api/member/:website/random", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var website, random;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                website = req.params.website;
                return [4, (0, db_1.getRandomWebsite)(website)];
            case 1:
                random = _a.sent();
                res.send(random);
                return [2];
        }
    });
}); });
app.get("/random", function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var random;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, (0, db_1.getRandomWebsite)()];
            case 1:
                random = _a.sent();
                res.send(random);
                return [2];
        }
    });
}); });
app.get("/random/navigate", function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var random;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, (0, db_1.getRandomWebsite)()];
            case 1:
                random = _a.sent();
                res.redirect(random.url);
                return [2];
        }
    });
}); });
app.get("/random/list", function (_, res) {
    var randomSites = (0, db_1.getRandomSiteList)(10);
    res.send(randomSites);
});
app.get("/widget/widget.js", function (req, res) {
    if ((0, old_browser_1.isOldBrowser)(req)) {
        res.type("text/javascript");
        res.send("// nothing");
        return;
    }
    var js = fs.readFileSync(path.join(__dirname, "../assets/widget.js"), {
        encoding: "utf-8",
    });
    var script = UglifyJs.minify(js);
    res.type("text/javascript");
    res.send(script.code);
});
app.get("/widget/:website", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, current, target, website;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                id = req.params.website;
                return [4, (0, db_1.getWebsite)(id)];
            case 1:
                current = _a.sent();
                (0, widget_cache_1.updateCacheForSite)(current);
                return [4, (0, widget_cache_1.getCachedWidgetData)(current)];
            case 2:
                target = _a.sent();
                return [4, (0, db_1.getWebsite)(target.targetWebsiteId)];
            case 3:
                website = _a.sent();
                if (!website.banner) {
                    res.sendStatus(404);
                    return [2];
                }
                res.send(website);
                return [2];
        }
    });
}); });
app.get("/widget/:website/navigate", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, current, target, website;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                res.setHeader("Pragma", "no-cache");
                res.setHeader("Expires", 0);
                id = req.params.website;
                return [4, (0, db_1.getWebsite)(id)];
            case 1:
                current = _a.sent();
                return [4, (0, widget_cache_1.getCachedWidgetData)(current)];
            case 2:
                target = _a.sent();
                return [4, (0, db_1.getWebsite)(target.targetWebsiteId)];
            case 3:
                website = _a.sent();
                res.redirect(website.url);
                return [2];
        }
    });
}); });
app.get("/widget/:website/image", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, current, target, website;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                res.setHeader("Pragma", "no-cache");
                res.setHeader("Expires", 0);
                id = req.params.website;
                return [4, (0, db_1.getWebsite)(id)];
            case 1:
                current = _a.sent();
                return [4, (0, widget_cache_1.updateCacheForSite)(current)];
            case 2:
                _a.sent();
                return [4, (0, widget_cache_1.getCachedWidgetData)(current)];
            case 3:
                target = _a.sent();
                return [4, (0, db_1.getWebsite)(target.targetWebsiteId)];
            case 4:
                website = _a.sent();
                if (!website.banner) {
                    res.sendStatus(404);
                    return [2];
                }
                fs.readFile(path.join(__dirname, "../assets/banners", website.banner), function (err, data) {
                    if (err) {
                        console.log("Got error: " + err.message, err);
                        res.sendStatus(500);
                        return;
                    }
                    res.type(path.extname(website.banner).substring(1));
                    res.send(data);
                });
                return [2];
        }
    });
}); });
app.get("/submit", recaptcha.middleware.render, function (_, res) {
    res.render("submit-website", { captcha: res.recaptcha });
});
app.post("/submit", recaptcha.middleware.verify, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, _a, email, description, bannerurl, sitename, siteurl, isEmailValid, isURLValid, exists, captcha, ex_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                errors = [];
                if (!!req.recaptcha.error) {
                    errors.push("Invalid captcha!");
                }
                _a = req.body, email = _a.email, description = _a.description, bannerurl = _a.bannerurl, sitename = _a.sitename, siteurl = _a.siteurl;
                if (!email) {
                    errors.push("The email is required.");
                }
                isEmailValid = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gm.exec(email);
                if (!isEmailValid) {
                    errors.push("The email address provided is invalid.");
                }
                if (!sitename) {
                    errors.push("The site name is mandatory.");
                }
                if (!siteurl) {
                    errors.push("The site URL is mandatory.");
                }
                isURLValid = /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gm.exec(siteurl);
                if (!!isURLValid) return [3, 1];
                errors.push("The website URL is invalid.");
                return [3, 3];
            case 1: return [4, (0, db_1.checkIfWebsiteExists)(siteurl)];
            case 2:
                exists = _b.sent();
                if (!!exists) {
                    errors.push("This website has already been submitted.");
                }
                _b.label = 3;
            case 3:
                if (!!description && description.length > 256) {
                    errors.push("Description is too long, try to keep it under 256 characters");
                }
                if (errors && errors.length) {
                    captcha = recaptcha.render();
                    res.render("submit-website", {
                        errors: errors,
                        email: email,
                        description: description,
                        bannerurl: bannerurl,
                        sitename: sitename,
                        captcha: captcha,
                    });
                    return [2];
                }
                _b.label = 4;
            case 4:
                _b.trys.push([4, 6, , 7]);
                return [4, (0, db_1.registerWebsiteRequest)({
                        description: description,
                        email: email,
                        name: sitename.trim(),
                        url: siteurl.trim(),
                        banner: bannerurl.trim(),
                        isVintage: false,
                    })];
            case 5:
                _b.sent();
                res.render("submit-website", { success: true });
                return [3, 7];
            case 6:
                ex_1 = _b.sent();
                console.log(ex_1);
                res.sendStatus(500);
                return [3, 7];
            case 7: return [2];
        }
    });
}); });
app.get("/widget", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var websiteId, website, generatedWidget;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                websiteId = req.query.websiteId;
                if (!websiteId) {
                    res.render("widget", {});
                    return [2];
                }
                return [4, (0, db_1.getWebsite)(websiteId)];
            case 1:
                website = _a.sent();
                if (!website) {
                    res.render("widget", {
                        error: "The website provided wasn't found.",
                    });
                    return [2];
                }
                generatedWidget = (0, widget_1.generateWidget)(website);
                res.render("widget", {
                    generatedWidget: generatedWidget,
                    website: website,
                    websiteId: websiteId,
                });
                return [2];
        }
    });
}); });
app.get("/", function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var randomSites;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, (0, db_1.getRandomSiteList)(5)];
            case 1:
                randomSites = _a.sent();
                res.render("home", { randomSites: randomSites });
                return [2];
        }
    });
}); });
app.get("/login", recaptcha.middleware.render, function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        res.render("login", { captcha: res.recaptcha });
        return [2];
    });
}); });
app.post("/login", recaptcha.middleware.verify, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, username, password, captcha, token;
    return __generator(this, function (_b) {
        _a = req.body, username = _a.username, password = _a.password;
        if (username !== config_1.ADMIN_USERNAME ||
            password !== config_1.ADMIN_PASSWORD ||
            !!req.recaptcha.error) {
            captcha = recaptcha.render();
            return [2, res.status(403).render("login", { captcha: captcha, failed: true })];
        }
        token = jwt.sign({ user: config_1.ADMIN_USERNAME }, config_1.JWT_SECRET_KEY);
        return [2, res
                .cookie("access_token", token, {
                httpOnly: true,
            })
                .redirect("/admin")];
    });
}); });
app.get("/logout", auth_middleware_1.authorization, function (_, res) {
    res
        .clearCookie("access_token")
        .status(200)
        .json({ message: "Successfully logged out" });
});
app.get("/admin", auth_middleware_1.authorization, function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requests, current;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, (0, db_1.getAllRequests)()];
            case 1:
                requests = _a.sent();
                return [4, (0, db_1.getAllWebsites)()];
            case 2:
                current = _a.sent();
                return [2, res.render("admin", { requests: requests, current: current })];
        }
    });
}); });
app.post("/admin_action", auth_middleware_1.authorization, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var body;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                body = req.body;
                if (!(typeof body.approve === "string" && body.approve)) return [3, 2];
                return [4, (0, admin_actions_1.approveRequest)(body.id)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2:
                if (!(typeof body.deny === "string" && body.deny)) return [3, 4];
                return [4, (0, admin_actions_1.denyRequest)(body.id)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                if (!(typeof body.remove === "string" && body.remove)) return [3, 6];
                return [4, (0, admin_actions_1.removeWebsite)(body.id)];
            case 5:
                _a.sent();
                _a.label = 6;
            case 6:
                if (!(typeof body.confirm_banner === "string" && body.confirm_banner)) return [3, 8];
                return [4, (0, admin_actions_1.confirmBanner)(body.id)];
            case 7:
                _a.sent();
                _a.label = 8;
            case 8: return [2, res.redirect("/admin")];
        }
    });
}); });
app.listen(config_1.PORT, "0.0.0.0", function () {
    return console.log("Example app listening at http:".concat(config_1.HOST, ":").concat(config_1.PORT));
});
