"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.confirmBanner = exports.removeWebsite = exports.denyRequest = exports.removeRequest = exports.addWebsite = exports.getAllRequests = exports.checkIfWebsiteExists = exports.registerWebsiteRequest = exports.getPreviousWebsite = exports.getNextWebsite = exports.getRandomWebsite = exports.getRandomSiteList = exports.getAllWebsites = exports.getRequest = exports.getWebsite = exports.connect = exports.moveFromYaml = exports.Requests = exports.Websites = exports.sequelize = void 0;
var fs = require("fs");
var yaml = require("yaml");
var path = require("path");
var sequelize_1 = require("sequelize");
var md5 = require("md5");
var sequelize_2 = require("sequelize");
var helpers_1 = require("./helpers");
var websitesYaml = fs.readFileSync(path.join(__dirname, "..", "websites.yaml"), { encoding: "utf-8" });
var ymlWebsites = yaml.parse(websitesYaml);
var dataFolder = path.join(__dirname, "../data");
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
}
exports.sequelize = new sequelize_1.Sequelize({
    dialect: "sqlite",
    storage: path.join(dataFolder, "webring.sqlite"),
    logging: false,
});
exports.Websites = exports.sequelize.define("websites", {
    id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    url: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    banner: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    isVintage: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    hasWidget: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    order: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    indexes: [{ unique: true, fields: ["order"] }],
});
exports.Requests = exports.sequelize.define("requests", {
    id: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    url: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    banner: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    isVintage: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    denied: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
});
function moveFromYaml() {
    return __awaiter(this, void 0, void 0, function () {
        var webSitesCount, _i, ymlWebsites_1, site, id, order;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, exports.Websites.count()];
                case 1:
                    webSitesCount = _a.sent();
                    if (webSitesCount > 0) {
                        return [2];
                    }
                    _i = 0, ymlWebsites_1 = ymlWebsites;
                    _a.label = 2;
                case 2:
                    if (!(_i < ymlWebsites_1.length)) return [3, 6];
                    site = ymlWebsites_1[_i];
                    id = md5(site.url);
                    return [4, exports.Websites.max("order")];
                case 3:
                    order = (_a.sent()) || 0;
                    return [4, exports.Websites.create({
                            id: id,
                            name: site.name,
                            url: site.url,
                            banner: site.banner,
                            description: site.description,
                            email: site.email,
                            order: order + 1,
                        })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3, 2];
                case 6: return [2];
            }
        });
    });
}
exports.moveFromYaml = moveFromYaml;
function fixPng() {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var websites, _i, websites_1, w, website, data, newData, filename;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, exports.Websites.findAll()];
                case 1:
                    websites = _b.sent();
                    _i = 0, websites_1 = websites;
                    _b.label = 2;
                case 2:
                    if (!(_i < websites_1.length)) return [3, 6];
                    w = websites_1[_i];
                    website = w.toJSON();
                    if (!((_a = website.banner) === null || _a === void 0 ? void 0 : _a.endsWith(".png"))) return [3, 5];
                    if (!fs.existsSync(path.join(__dirname, "../assets/banners", website.banner))) {
                        return [3, 5];
                    }
                    data = fs.readFileSync(path.join(__dirname, "../assets/banners", website.banner));
                    return [4, (0, helpers_1.convertPng)(data)];
                case 3:
                    newData = _b.sent();
                    filename = website.id + ".gif";
                    fs.writeFileSync(path.join(__dirname, "../assets/banners", filename), newData);
                    website.banner = filename;
                    return [4, exports.Websites.update(website, { where: { id: website.id } })];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3, 2];
                case 6: return [2];
            }
        });
    });
}
function connect() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4, exports.sequelize.authenticate()];
                case 1:
                    _a.sent();
                    return [4, exports.sequelize.sync()];
                case 2:
                    _a.sent();
                    return [4, moveFromYaml()];
                case 3:
                    _a.sent();
                    return [4, fixPng()];
                case 4:
                    _a.sent();
                    console.log("Connection has been established successfully.");
                    return [3, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error("Unable to connect to the database:", error_1);
                    return [3, 6];
                case 6: return [2];
            }
        });
    });
}
exports.connect = connect;
function getWebsite(id) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, exports.Websites.findOne({ where: { id: id } })];
                case 1:
                    result = _a.sent();
                    return [2, result.toJSON()];
            }
        });
    });
}
exports.getWebsite = getWebsite;
function getRequest(id, t) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, exports.Requests.findOne({ where: { id: id }, transaction: t })];
                case 1:
                    result = _a.sent();
                    return [2, result.toJSON()];
            }
        });
    });
}
exports.getRequest = getRequest;
function getAllWebsites() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, exports.Websites.findAll()];
                case 1:
                    result = _a.sent();
                    return [2, result.map(function (o) { return o.toJSON(); })];
            }
        });
    });
}
exports.getAllWebsites = getAllWebsites;
function getRandomSiteList(total) {
    if (total === void 0) { total = 5; }
    return __awaiter(this, void 0, void 0, function () {
        var websites, indexes, len, index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, getAllWebsites()];
                case 1:
                    websites = _a.sent();
                    indexes = new Array(total);
                    len = websites.length;
                    if (total > len)
                        throw new RangeError("getRandomSites: more elements taken than available");
                    while (total > 0) {
                        index = Math.floor(Math.random() * len);
                        if (!indexes.includes(index)) {
                            indexes[--total] = index;
                        }
                    }
                    return [2, indexes.map(function (i) { return websites[i]; })];
            }
        });
    });
}
exports.getRandomSiteList = getRandomSiteList;
function getRandomWebsite(currentId) {
    if (currentId === void 0) { currentId = ""; }
    return __awaiter(this, void 0, void 0, function () {
        var filtered, index;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, exports.Websites.findAll({
                        where: {
                            id: (_a = {},
                                _a[sequelize_2.Op.not] = currentId,
                                _a),
                        },
                    })];
                case 1:
                    filtered = (_b.sent()).map(function (o) { return o.toJSON(); });
                    index = Math.floor(Math.random() * filtered.length);
                    return [2, filtered[index]];
            }
        });
    });
}
exports.getRandomWebsite = getRandomWebsite;
function getNextWebsite(id) {
    return __awaiter(this, void 0, void 0, function () {
        var websites, index, next;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, exports.Websites.findAll({ order: [["id", "ASC"]] })];
                case 1:
                    websites = (_a.sent()).map(function (o) { return o.toJSON(); });
                    index = websites.findIndex(function (w) { return w.id === id; });
                    next = index + 1;
                    if (next >= websites.length) {
                        next = 0;
                    }
                    return [2, websites[next]];
            }
        });
    });
}
exports.getNextWebsite = getNextWebsite;
function getPreviousWebsite(id) {
    return __awaiter(this, void 0, void 0, function () {
        var websites, index, previous;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, exports.Websites.findAll({ order: [["id", "ASC"]] })];
                case 1:
                    websites = (_a.sent()).map(function (o) { return o.toJSON(); });
                    index = websites.findIndex(function (w) { return w.id === id; });
                    previous = index - 1;
                    if (previous < 0) {
                        previous = websites.length - 1;
                    }
                    return [2, websites[previous]];
            }
        });
    });
}
exports.getPreviousWebsite = getPreviousWebsite;
function registerWebsiteRequest(data) {
    return __awaiter(this, void 0, void 0, function () {
        var id;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = md5(data.url);
                    return [4, exports.Requests.create(__assign({ id: id }, data))];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.registerWebsiteRequest = registerWebsiteRequest;
function checkIfWebsiteExists(url) {
    return __awaiter(this, void 0, void 0, function () {
        var id, reqCount, siteCount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = md5(url);
                    return [4, exports.Requests.count({ where: { id: id } })];
                case 1:
                    reqCount = _a.sent();
                    return [4, exports.Websites.count({ where: { id: id } })];
                case 2:
                    siteCount = _a.sent();
                    return [2, reqCount > 0 || siteCount > 0];
            }
        });
    });
}
exports.checkIfWebsiteExists = checkIfWebsiteExists;
function getAllRequests() {
    return __awaiter(this, void 0, void 0, function () {
        var all;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, exports.Requests.findAll({ where: { denied: (_a = {}, _a[sequelize_2.Op.not] = true, _a) } })];
                case 1:
                    all = _b.sent();
                    return [2, all.map(function (o) { return o.toJSON(); })];
            }
        });
    });
}
exports.getAllRequests = getAllRequests;
function addWebsite(website, t) {
    return __awaiter(this, void 0, void 0, function () {
        var order;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, exports.Websites.max("order")];
                case 1:
                    order = (_a.sent()) || 0;
                    return [2, exports.Websites.create(__assign(__assign({}, website), { order: order + 1 }), { transaction: t })];
            }
        });
    });
}
exports.addWebsite = addWebsite;
function removeRequest(id, t) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, exports.Requests.destroy({ where: { id: id }, transaction: t })];
        });
    });
}
exports.removeRequest = removeRequest;
function denyRequest(id, t) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, exports.Requests.update({ denied: true }, { where: { id: id }, transaction: t, returning: true })];
        });
    });
}
exports.denyRequest = denyRequest;
function removeWebsite(id, t) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, exports.Websites.destroy({ where: { id: id }, transaction: t })];
        });
    });
}
exports.removeWebsite = removeWebsite;
function confirmBanner(id, t) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, exports.Websites.update({ hasWidget: true }, { where: { id: id }, transaction: t, returning: true })];
        });
    });
}
exports.confirmBanner = confirmBanner;
