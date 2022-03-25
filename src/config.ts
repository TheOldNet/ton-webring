import * as dotenv from "dotenv";
import * as path from "path";

const DEV_CONFIG = path.join(__dirname, "../conf-dev.env");
const PROD_CONFIG = path.join(__dirname, "../conf-prod.env");

const conf = dotenv.config({
  path: process.env.NODE_ENV === "production" ? PROD_CONFIG : DEV_CONFIG,
}).parsed;

export const PORT = conf.PORT ? parseInt(conf.PORT) : 8007;
export const RECAPTCHA_SITE_KEY = conf.RECAPTCHA_SITE_KEY;
export const RECAPTCHA_SECRET_KEY = conf.RECAPTCHA_SECRET_KEY;
export const HOST = conf.HOST;
