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
  confirmBanner,
  denyRequest,
  removeWebsite,
} from "./admin-actions";
import { authorization } from "./auth-middleware";
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  HOST,
  JWT_SECRET_KEY,
  PORT,
  RECAPTCHA_SECRET_KEY,
  RECAPTCHA_SITE_KEY,
} from "./config";
import {
  checkIfWebsiteExists,
  connect,
  getAllRequests,
  getAllWebsites,
  getNextWebsite,
  getPreviousWebsite,
  getRandomSiteList,
  getRandomWebsite,
  getWebsite,
  registerWebsiteRequest,
} from "./db";
import { isOldBrowser } from "./old-browser";
import { WidgetCreationRequest } from "./types";
import { generateWidget } from "./widget";
import { getCachedWidgetData, updateCacheForSite } from "./widget-cache";
import cookieParser = require("cookie-parser");

const app = express();

connect();

const recaptcha = new RecaptchaV2(RECAPTCHA_SITE_KEY, RECAPTCHA_SECRET_KEY, {
  callback: "cb",
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "vash");
app.set("etag", false);
app.use(useragent.express());
app.use(cookieParser());

app.use("/assets", express.static("assets"));

/**
 * Member routes
 */

app.get("/member/:website/next/navigate", async (req, res) => {
  const website = req.params.website;
  const result = await getNextWebsite(website);
  res.redirect(result.url);
});

app.get("/member/:website/previous/navigate", async (req, res) => {
  const website = req.params.website;
  const result = await getPreviousWebsite(website);
  res.redirect(result.url);
});

app.get("/member/:website/random/navigate", async (req, res) => {
  const website = req.params.website;
  const random = await getRandomWebsite(website);
  res.redirect(random.url);
});

/**
 * Member JSON endpoints
 */

app.get("/api/member/:website/next", async (req, res) => {
  const website = req.params.website;
  const result = await getNextWebsite(website);
  res.send(result);
});

app.get("/api/member/:website/previous", async (req, res) => {
  const website = req.params.website;
  const result = await getPreviousWebsite(website);
  res.send(result);
});

app.get("/api/member/:website/random", async (req, res) => {
  const website = req.params.website;
  const random = await getRandomWebsite(website);
  res.send(random);
});

/**
 * Internal API
 */

app.get("/random", async (_, res) => {
  const random = await getRandomWebsite();
  res.send(random);
});

app.get("/random/navigate", async (_, res) => {
  const random = await getRandomWebsite();
  res.redirect(random.url);
});

app.get("/random/list", (_, res) => {
  const randomSites = getRandomSiteList(10);
  res.send(randomSites);
});

app.get("/widget/widget.js", (req, res) => {
  if (isOldBrowser(req)) {
    res.send("");
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
  const current = await getWebsite(id);
  updateCacheForSite(current);

  const target = await getCachedWidgetData(current);
  const website = await getWebsite(target.targetWebsiteId);

  if (!website.banner) {
    // EVENTUALLY LOAD DEFAULT BANNER
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
  const current = await getWebsite(id);

  const target = await getCachedWidgetData(current);
  const website = await getWebsite(target.targetWebsiteId);
  res.redirect(website.url);
});

// This is very rough, we should improve how we send the image
app.get("/widget/:website/image", async (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", 0);

  const id = req.params.website;
  const current = await getWebsite(id);
  await updateCacheForSite(current);

  const target = await getCachedWidgetData(current);

  const website = await getWebsite(target.targetWebsiteId);

  if (!website.banner) {
    // EVENTUALLY LOAD DEFAULT BANNER
    res.sendStatus(404);
    return;
  }

  fs.readFile(
    path.join(__dirname, "../assets/banners", website.banner),
    (err, data) => {
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

  const { email, description, bannerurl, sitename, siteurl } = req.body;

  if (!email) {
    errors.push("The email is required.");
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
    const exists = await checkIfWebsiteExists(siteurl);
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
    await registerWebsiteRequest({
      description,
      email,
      name: sitename.trim(),
      url: siteurl.trim(),
      banner: bannerurl.trim(),
      isVintage: false,
    });

    res.render("submit-website", { success: true });
  } catch (ex) {
    console.log(ex);
    res.sendStatus(500);
  }
});

app.get("/widget", (req, res) => {
  res.render("widget", {});
});

app.post("/widget", async (req, res) => {
  const { websiteId } = req.body as WidgetCreationRequest;

  if (!websiteId) {
    res.render("widget", {
      error: "A website ID from the email has to be provided.",
    });
    return;
  }

  const website = await getWebsite(websiteId);

  if (!website) {
    res.render("widget", {
      error: "The website provided wasn't found.",
    });
    return;
  }

  const generatedWidget = generateWidget(website);

  res.render("widget", {
    generatedWidget,
    website,
    websiteId,
  });
});

app.get("/", async (_, res) => {
  const randomSites = await getRandomSiteList(5);

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
  const requests = await getAllRequests();
  const current = await getAllWebsites();
  return res.render("admin", { requests, current });
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

  return res.redirect("/admin");
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Example app listening at http:${HOST}:${PORT}`)
);
