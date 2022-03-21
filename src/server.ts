import axios from "axios";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as useragent from "express-useragent";
import * as fs from "fs";
import * as path from "path";
import * as UglifyJs from "uglify-js";
import {
  getNextWebsite,
  getPreviousWebsite,
  getRandomSiteList,
  getRandomWebsite,
  getWebsite,
  connect,
} from "./db";
import { isOldBrowser } from "./old-browser";
import { WidgetCreationRequest } from "./types";
import { generateWidget } from "./widget";
import { getCachedWidgetData, updateCacheForSite } from "./widget-cache";

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 8007;

connect();

app.use(bodyParser.urlencoded());
app.set("view engine", "vash");
app.set("etag", false);
app.use(useragent.express());

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

  try {
    console.log(website.banner);
    //don't do this anymore because images are hosted locally, so now I'm making an axios call to myself
    //just serve the image off disk
    const url = "http://localhost:3001" + website.banner;
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    // TODO: This has to be dynamic or only support gifs. Some banner submissions were png which will be no good for retro support
    res.type("gif");
    res.send(response.data);
  } catch (ex) {
    console.log("Got error: " + ex.message, ex);
  }
});

/**
 * Pages
 */

app.get("/submit", (_, res) => {
  res.render("submit-website", {});
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

  // I'm not sure we should keep this as it's a bit hacky
  const images = [
    "animated_bullet_009.gif",
    "animated_bullet_011.gif",
    "animated_bullet_014.gif",
  ];

  let index = 0;

  const arrows = randomSites.map((site) => {
    const image = images[index];
    index = ++index >= images.length ? 0 : index;
    return image;
  });

  res.render("home", { randomSites, arrows });
});

app.listen(port, "0.0.0.0", () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
