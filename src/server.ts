import * as bodyParser from "body-parser";
import * as express from "express";
import { RecaptchaV2 } from "express-recaptcha";
import * as useragent from "express-useragent";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import * as path from "path";
import * as UglifyJs from "uglify-js";
import {
  approveRequest,
  clearBanner,
  confirmBanner,
  denyRequest,
  removeWebsite,
  toggleRetro,
} from "./admin-actions";
import { authorization } from "./auth-middleware";
import { generateBanner } from "./banner";
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  HOST,
  JWT_SECRET_KEY,
  PORT,
  RECAPTCHA_SECRET_KEY,
  RECAPTCHA_SITE_KEY,
} from "./config";
import * as db from "./db";
import { getWebringUrl, isValidBanner } from "./helpers";
import { isOldBrowser } from "./old-browser";
import { generateBannerWidget, generateTextOnlyWidget } from "./widget";
import { getCachedWidgetData, updateCacheForSite } from "./widget-cache";
import cookieParser = require("cookie-parser");
import { retroMiddleware } from "./retro-middleware";

const app = express();

db.connect();

const recaptcha = new RecaptchaV2(RECAPTCHA_SITE_KEY, RECAPTCHA_SECRET_KEY, {
  callback: "cb",
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "vash");
app.set("etag", false);
app.use(useragent.express());
app.use(cookieParser());
app.use(retroMiddleware);

app.use("/assets", express.static("assets"));

/**
 * Member routes
 */

app.get("/member/:website/next/navigate", async (req, res) => {
  const website = req.params.website;
  const result = await db.getNextWebsite(website, req.isOldBrowser);
  res.redirect(result.url);
});

app.get("/member/:website/previous/navigate", async (req, res) => {
  const website = req.params.website;
  const result = await db.getPreviousWebsite(website, req.isOldBrowser);
  res.redirect(result.url);
});

app.get("/member/:website/random/navigate", async (req, res) => {
  const website = req.params.website;
  const random = await db.getRandomWebsite(req.isOldBrowser, website);
  res.redirect(random.url);
});

/**
 * Member JSON endpoints
 */

app.get("/api/member/:website/next", async (req, res) => {
  const website = req.params.website;
  const result = await db.getNextWebsite(website, req.isOldBrowser);
  res.send(result);
});

app.get("/api/member/:website/previous", async (req, res) => {
  const website = req.params.website;
  const result = await db.getPreviousWebsite(website, req.isOldBrowser);
  res.send(result);
});

app.get("/api/member/:website/random", async (req, res) => {
  const website = req.params.website;
  const random = await db.getRandomWebsite(req.isOldBrowser, website);
  res.send(random);
});

/**
 * Internal API
 */

app.get("/random", async (req, res) => {
  const random = await db.getRandomWebsite(req.isOldBrowser);
  res.send(random);
});

app.get("/random/navigate", async (req, res) => {
  const random = await db.getRandomWebsite(req.isOldBrowser);
  res.redirect(random.url);
});

app.get("/random/list", (req, res) => {
  const randomSites = db.getRandomSiteList(req.isOldBrowser, 10);
  res.send(randomSites);
});

app.get("/widget/widget.js", (req, res) => {
  if (isOldBrowser(req)) {
    res.type("text/javascript");
    res.send("// nothing");
    return;
  }

  const js = fs.readFileSync(path.join(__dirname, "../assets/widget.js"), {
    encoding: "utf-8",
  });

  const script = UglifyJs.minify(js);

  res.type("text/javascript");
  res.send(script.code);
});

app.get("/widget/:website", async (req, res) => {
  const id = req.params.website;
  const current = await db.getWebsite(id);
  updateCacheForSite(current, req.isOldBrowser);

  const target = await getCachedWidgetData(current, req.isOldBrowser);
  const website = await db.getWebsite(target.targetWebsiteId);

  if (!website.banner) {
    res.sendStatus(404);
    return;
  }

  res.send(website);
});

app.get("/widget/:website/navigate", async (req, res) => {
  // This one doesn't update the cache because we don't
  // want the scenario where the user sees a banner and when
  // they click, it navigates to a different website.
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", 0);

  const id = req.params.website;
  const current = await db.getWebsite(id);

  const target = await getCachedWidgetData(current, req.isOldBrowser);
  const website = await db.getWebsite(target.targetWebsiteId);
  res.redirect(website.url);
});

// This is very rough, we should improve how we send the image
app.get("/widget/:website/image", async (req, res) => {
  // res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  // res.setHeader("Pragma", "no-cache");
  // res.setHeader("Expires", 0);

  const id = req.params.website;
  const current = await db.getWebsite(id);
  await updateCacheForSite(current, req.isOldBrowser);

  const target = await getCachedWidgetData(current, req.isOldBrowser);

  const website = await db.getWebsite(target.targetWebsiteId);

  if (!website.banner) {
    // EVENTUALLY LOAD DEFAULT BANNER
    res.sendStatus(404);
    return;
  }

  fs.readFile(
    path.join(__dirname, "../assets/banners", website.banner),
    async (err, data) => {
      if (err) {
        console.log("Got error: " + err.message, err);
        res.sendStatus(500);
        return;
      }

      res.type(path.extname(website.banner).substring(1));
      res.send(data);
    }
  );
});

app.get("/request-banner/:website", async (req, res) => {
  const id = req.params.website;
  const current = await db.getRequest(id);

  if (!current) {
    res.status(404);
    res.send("no image");
    return;
  }

  const bn = await generateBanner(current);
  res.type("gif");
  res.send(bn);
});

/**
 * Pages
 */

app.get("/submit", recaptcha.middleware.render, (_, res) => {
  res.render("submit-website", { captcha: res.recaptcha });
});

app.post("/submit", recaptcha.middleware.verify, async (req, res) => {
  const errors: string[] = [];
  if (!!req.recaptcha.error) {
    errors.push("Invalid captcha!");
  }

  const { email, description, bannerurl, sitename, siteurl, isretro } =
    req.body;

  const isVintage = isretro === "on";

  if (!email) {
    errors.push("The email is required.");
  }

  if (bannerurl && !(await isValidBanner(bannerurl))) {
    errors.push("The banner submitted isn't valid");
  }

  const isEmailValid =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gm.exec(
      email
    );

  if (!isEmailValid) {
    errors.push("The email address provided is invalid.");
  }

  if (!sitename) {
    errors.push("The site name is mandatory.");
  }

  if (!siteurl) {
    errors.push("The site URL is mandatory.");
  }

  const isURLValid =
    /(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gm.exec(
      siteurl
    );

  if (!isURLValid) {
    errors.push("The website URL is invalid.");
  } else {
    const exists = await db.checkIfWebsiteExists(siteurl);
    if (!!exists) {
      errors.push("This website has already been submitted.");
    }
  }

  if (!!description && description.length > 256) {
    errors.push("Description is too long, try to keep it under 256 characters");
  }

  if (errors && errors.length) {
    const captcha = recaptcha.render();
    res.render("submit-website", {
      errors,
      email,
      description,
      bannerurl,
      sitename,
      captcha,
    });
    return;
  }

  try {
    await db.registerWebsiteRequest({
      description,
      email,
      name: sitename.trim(),
      url: siteurl.trim(),
      banner: bannerurl.trim(),
      isVintage,
    });

    res.render("submit-website", { success: true });
  } catch (ex) {
    console.log(ex);
    res.sendStatus(500);
  }
});

app.get("/widget", async (req, res) => {
  const websiteId = req.query.websiteId as string;

  if (!websiteId) {
    res.render("widget", {});
    return;
  }

  const website = await db.getWebsite(websiteId);

  if (!website) {
    res.render("widget", {
      error: "The website provided wasn't found.",
    });
    return;
  }

  const generatedBannerWidget = generateBannerWidget(website);
  const generatedTextOnlyWidget = generateTextOnlyWidget(website);

  res.render("widget", {
    generatedBannerWidget,
    generatedTextOnlyWidget,
    website,
    websiteId,
  });
});

app.get("/", async (req, res) => {
  const randomSites = await db.getRandomSiteList(req.isOldBrowser, 5);

  res.render("home", { randomSites });
});

app.get("/login", recaptcha.middleware.render, async (_, res) => {
  res.render("login", { captcha: res.recaptcha });
});

app.post("/login", recaptcha.middleware.verify, async (req, res) => {
  const { username, password } = req.body;

  if (
    username !== ADMIN_USERNAME ||
    password !== ADMIN_PASSWORD ||
    !!req.recaptcha.error
  ) {
    const captcha = recaptcha.render();
    return res.status(403).render("login", { captcha, failed: true });
  }

  const token = jwt.sign({ user: ADMIN_USERNAME }, JWT_SECRET_KEY);
  return res
    .cookie("access_token", token, {
      httpOnly: true,
    })
    .redirect("/admin");
});

app.get("/logout", authorization, (_, res) => {
  res
    .clearCookie("access_token")
    .status(200)
    .json({ message: "Successfully logged out" });
});

app.get("/admin", authorization, async (_, res) => {
  const requests = await db.getAllRequests();
  const current = await db.getAllWebsites();
  return res.render("admin", { requests, current });
});

app.get("/mailto-form/:website", authorization, async (req, res) => {
  const id = req.params.website;
  const current = await db.getWebsite(id);
  return res.render("mailto-form", { current });
});

app.post("/admin_action", authorization, async (req, res) => {
  const { body } = req;

  if (typeof body.approve === "string" && body.approve) {
    await approveRequest(body.id);
  }

  if (typeof body.deny === "string" && body.deny) {
    await denyRequest(body.id);
  }

  if (typeof body.remove === "string" && body.remove) {
    await removeWebsite(body.id);
  }

  if (typeof body.confirm_banner === "string" && body.confirm_banner) {
    await confirmBanner(body.id);
  }

  if (typeof body.toggle_retro === "string" && body.toggle_retro) {
    await toggleRetro(body.id);
  }

  if (typeof body.clear_banner === "string" && body.clear_banner) {
    await clearBanner(body.id);
  }

  return res.redirect("/admin");
});

app.get("/frameset/:website/random", async (req, res) => {
  const id = req.params.website;
  const random = await db.getRandomWebsite(req.isOldBrowser, id);
  res.redirect(
    getWebringUrl(`/frameset/${random.id}`, random.url, random.isVintage)
  );
});

app.get("/frameset/:website/next", async (req, res) => {
  const id = req.params.website;
  const next = await db.getNextWebsite(id, req.isOldBrowser);
  res.redirect(getWebringUrl(`/frameset/${next.id}`, next.url, next.isVintage));
});

app.get("/frameset/:website/previous", async (req, res) => {
  const id = req.params.website;
  const previous = await db.getPreviousWebsite(id, req.isOldBrowser);
  res.redirect(
    getWebringUrl(`/frameset/${previous.id}`, previous.url, previous.isVintage)
  );
});

app.get("/frameset/:website/top", async (req, res) => {
  const id = req.params.website;
  const website = await db.getWebsite(id);
  res.render("frameset-browser-top", {
    website,
  });
});

app.get("/frameset/:website", async (req, res) => {
  const id = req.params.website;
  const current = await db.getWebsite(id);
  const currentSiteUrl =
    !current.url.startsWith("http") && !current.url.startsWith("//")
      ? `//${current.url}`
      : current.url;

  res.render("frameset-browser", {
    currentSiteId: current.id,
    currentSiteUrl,
  });
});

app.get("/frameset", async (req, res) => {
  const random = await db.getRandomWebsite(req.isOldBrowser);
  res.redirect(
    getWebringUrl(`/frameset/${random.id}`, random.url, random.isVintage)
  );
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Example app listening at http:${HOST}:${PORT}`)
);
