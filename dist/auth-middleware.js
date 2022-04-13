"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
var jwt = require("jsonwebtoken");
var config_1 = require("./config");
var authorization = function (req, res, next) {
    var _a;
    var token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.access_token;
    if (!token) {
        return res.sendStatus(403);
    }
    try {
        var data = jwt.verify(token, config_1.JWT_SECRET_KEY);
        var user = data.user;
        if (user != config_1.ADMIN_USERNAME) {
            return res.sendStatus(403);
        }
        req.user = user;
        return next();
    }
    catch (_b) {
        return res.sendStatus(403);
    }
};
exports.authorization = authorization;
