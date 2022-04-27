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
exports.confirmBanner = exports.removeWebsite = exports.denyRequest = exports.approveRequest = void 0;
var db = require("./db");
var helpers_1 = require("./helpers");
function approveRequest(id) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2, db.sequelize.transaction(function (t) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, description, email, name_1, url, banner, isVintage, downloaded, ex_1;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 5, , 6]);
                                return [4, db.getRequest(id, t)];
                            case 1:
                                _a = _b.sent(), description = _a.description, email = _a.email, name_1 = _a.name, url = _a.url, banner = _a.banner, isVintage = _a.isVintage;
                                return [4, (0, helpers_1.downloadBanner)(id, banner)];
                            case 2:
                                downloaded = _b.sent();
                                return [4, db.addWebsite({
                                        description: description,
                                        email: email,
                                        id: id,
                                        name: name_1,
                                        url: url,
                                        banner: downloaded,
                                        isVintage: isVintage,
                                    }, t)];
                            case 3:
                                _b.sent();
                                return [4, db.removeRequest(id, t)];
                            case 4:
                                _b.sent();
                                return [3, 6];
                            case 5:
                                ex_1 = _b.sent();
                                console.error(ex_1);
                                t.rollback();
                                return [2];
                            case 6: return [2];
                        }
                    });
                }); })];
        });
    });
}
exports.approveRequest = approveRequest;
function denyRequest(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, db.denyRequest(id)];
        });
    });
}
exports.denyRequest = denyRequest;
function removeWebsite(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, db.removeWebsite(id)];
        });
    });
}
exports.removeWebsite = removeWebsite;
function confirmBanner(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, db.confirmBanner(id)];
        });
    });
}
exports.confirmBanner = confirmBanner;
