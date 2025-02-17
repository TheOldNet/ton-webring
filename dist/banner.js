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
exports.generateBanner = void 0;
var axios_1 = require("axios");
var canvas_1 = require("canvas");
var sharp = require("sharp");
(0, canvas_1.registerFont)(__dirname + "/../assets/fonts/Montserrat-Regular.ttf", {
    family: "Montserrat Regular",
});
(0, canvas_1.registerFont)(__dirname + "/../assets/fonts/W95FA.otf", { family: "win95fa" });
function getFavicon(url) {
    return __awaiter(this, void 0, void 0, function () {
        var response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4, axios_1.default.get("https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=".concat(url, "&size=16"), { responseType: "arraybuffer" })];
                case 1:
                    response = _b.sent();
                    return [2, Buffer.from(response.data, "binary")];
                case 2:
                    _a = _b.sent();
                    return [2, undefined];
                case 3: return [2];
            }
        });
    });
}
function insertText(context, text, font, x, y, textAlign, width, height) {
    if (textAlign === void 0) { textAlign = "left"; }
    context.font = font;
    context.textAlign = textAlign;
    context.textBaseline = "top";
    context.fillStyle = "#000000";
    if (width && context.measureText(text).width > width) {
        text = text.substring(0, text.length - 3) + "...";
        while (context.measureText(text + "...").width > width) {
            text = text.substring(0, text.length - 1);
        }
        text += "...";
    }
    var measure = context.measureText(text);
    var nw = width || measure.width + x;
    var nh = height || measure.actualBoundingBoxDescent;
    context.fillText(text, x, y);
    return {
        top: y,
        left: x,
        bottom: y + nh,
        right: x + nw,
    };
}
function generateBanner(website) {
    return __awaiter(this, void 0, void 0, function () {
        var width, height, canvas, context, img, faviconBuffer, x, favicon, nw, namePos, rawBuffer, buffer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    width = 468;
                    height = 60;
                    canvas = (0, canvas_1.createCanvas)(width, height);
                    context = canvas.getContext("2d");
                    context.fillStyle = "#DDDDDD";
                    context.fillRect(0, 0, width, height);
                    return [4, (0, canvas_1.loadImage)(__dirname + "/../assets/site-banner-background.png")];
                case 1:
                    img = _a.sent();
                    context.drawImage(img, 0, 0, img.width, img.height);
                    return [4, getFavicon(website.url)];
                case 2:
                    faviconBuffer = _a.sent();
                    x = 45;
                    if (!faviconBuffer) return [3, 4];
                    return [4, (0, canvas_1.loadImage)(faviconBuffer)];
                case 3:
                    favicon = _a.sent();
                    context.drawImage(favicon, x, 8, favicon.width, favicon.height);
                    x += favicon.width;
                    _a.label = 4;
                case 4:
                    nw = width - 20 - x;
                    namePos = insertText(context, website.name, "bold 12pt Montserrat Regular", x + 5, 5, "left", nw, 18);
                    insertText(context, website.url, "bold 8pt Montserrat Regular", x + 5, namePos.bottom);
                    rawBuffer = canvas.toBuffer("image/png");
                    return [4, sharp(rawBuffer).gif().toBuffer()];
                case 5:
                    buffer = _a.sent();
                    return [2, buffer];
            }
        });
    });
}
exports.generateBanner = generateBanner;
