"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_PASSWORD = exports.ADMIN_USERNAME = exports.JWT_SECRET_KEY = exports.HOST = exports.RECAPTCHA_SECRET_KEY = exports.RECAPTCHA_SITE_KEY = exports.PORT = void 0;
var dotenv = require("dotenv");
var path = require("path");
var DEV_CONFIG = path.join(__dirname, "../conf-dev.env");
var PROD_CONFIG = path.join(__dirname, "../conf-prod.env");
var conf = dotenv.config({
    path: process.env.NODE_ENV === "production" ? PROD_CONFIG : DEV_CONFIG,
}).parsed;
exports.PORT = conf.PORT ? parseInt(conf.PORT) : 8007;
exports.RECAPTCHA_SITE_KEY = conf.RECAPTCHA_SITE_KEY;
exports.RECAPTCHA_SECRET_KEY = conf.RECAPTCHA_SECRET_KEY;
exports.HOST = conf.HOST;
exports.JWT_SECRET_KEY = conf.JWT_SECRET_KEY;
exports.ADMIN_USERNAME = conf.ADMIN_USERNAME;
exports.ADMIN_PASSWORD = conf.ADMIN_PASSWORD;
