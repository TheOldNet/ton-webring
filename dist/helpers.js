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
exports.isValidBanner = exports.convertPng = exports.downloadBanner = exports.downloadFile = exports.saveImage = exports.getWebringUrl = exports.getHost = void 0;
var axios_1 = require("axios");
var fs = require("fs");
var path = require("path");
var sharp = require("sharp");
var banner_1 = require("./banner");
var config_1 = require("./config");
function getHost() {
    return config_1.HOST;
}
exports.getHost = getHost;
function getWebringUrl(path, websiteUrl, isRetro) {
    var host = getHost();
    var url = "".concat(host).concat(path);
    if (websiteUrl.startsWith("https:")) {
        url = "https:" + url;
    }
    else if (websiteUrl.startsWith("http:")) {
        url = "http:" + url;
    }
    else if (websiteUrl.startsWith("//") && isRetro) {
        url = "http:" + url;
    }
    else if (/^[\w]+?/gim.exec(websiteUrl) &&
        !websiteUrl.startsWith("//") &&
        !websiteUrl.startsWith("http")) {
        url = (isRetro ? "http:" : "https:") + url;
    }
    if (host.includes("192.168.1.") || host.includes("localhost:")) {
        var begining = /^((.+)?\/\/)?/gim.exec(url);
        url = url.replace("https", "http") + "?type=" + encodeURI(begining[0]);
    }
    return url;
}
exports.getWebringUrl = getWebringUrl;
function saveImage(buff, path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) {
                    fs.writeFile(path, buff, {}, function (err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve(null);
                    });
                })];
        });
    });
}
exports.saveImage = saveImage;
function downloadFile(fileUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var response, buffer, sImage, metadata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, (0, axios_1.default)({
                        method: "GET",
                        url: fileUrl,
                        responseType: "arraybuffer",
                    })];
                case 1:
                    response = _a.sent();
                    buffer = Buffer.from(response.data, "binary");
                    sImage = sharp(buffer);
                    return [4, sImage.metadata()];
                case 2:
                    metadata = _a.sent();
                    if (metadata.format === "gif") {
                        return [2, buffer];
                    }
                    return [2, sImage.gif().toBuffer()];
            }
        });
    });
}
exports.downloadFile = downloadFile;
function downloadBanner(request) {
    return __awaiter(this, void 0, void 0, function () {
        var filename, buffer, savePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filename = request.id + ".gif";
                    if (!!request.banner) return [3, 2];
                    return [4, (0, banner_1.generateBanner)(request)];
                case 1:
                    buffer = _a.sent();
                    return [3, 4];
                case 2: return [4, downloadFile(request.banner)];
                case 3:
                    buffer = _a.sent();
                    _a.label = 4;
                case 4:
                    savePath = path.join(__dirname, "../assets/banners", filename);
                    return [4, saveImage(buffer, savePath)];
                case 5:
                    _a.sent();
                    return [2, filename];
            }
        });
    });
}
exports.downloadBanner = downloadBanner;
function convertPng(buffer) {
    return __awaiter(this, void 0, void 0, function () {
        var img, metadata;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    img = sharp(buffer);
                    return [4, img.metadata()];
                case 1:
                    metadata = _a.sent();
                    if (metadata.format !== "png") {
                        return [2, buffer];
                    }
                    return [2, img.toFormat(sharp.format.gif).toBuffer()];
            }
        });
    });
}
exports.convertPng = convertPng;
function isValidBanner(url) {
    return __awaiter(this, void 0, void 0, function () {
        var response, img, metadata, _1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4, (0, axios_1.default)({
                            method: "GET",
                            url: url,
                            responseType: "arraybuffer",
                        })];
                case 1:
                    response = _a.sent();
                    if (response.status !== 200) {
                        return [2, false];
                    }
                    img = sharp(response.data);
                    return [4, img.metadata()];
                case 2:
                    metadata = _a.sent();
                    if (metadata.format !== "jpeg" &&
                        metadata.format !== "jpg" &&
                        metadata.format !== "gif") {
                        return [2, false];
                    }
                    if (metadata.width != 468 && metadata.height != 60) {
                        return [2, false];
                    }
                    return [2, true];
                case 3:
                    _1 = _a.sent();
                    return [2, false];
                case 4: return [2];
            }
        });
    });
}
exports.isValidBanner = isValidBanner;
