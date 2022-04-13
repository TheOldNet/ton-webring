import * as fs from "fs";

import * as yaml from "yaml";
import { WebsiteAttributes, WebsiteRequest } from "./types";
import * as path from "path";
import { DataTypes, Sequelize, Transaction } from "sequelize";
import md5 = require("md5");
import { Op } from "sequelize";

const websitesYaml = fs.readFileSync(
  path.join(__dirname, "..", "websites.yaml"),
  { encoding: "utf-8" }
);

const ymlWebsites: WebsiteAttributes[] = yaml.parse(websitesYaml);

const dataFolder = path.join(__dirname, "../data");

if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder, { recursive: true });
}

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(dataFolder, "webring.sqlite"),
  logging: false,
});

export const Websites = sequelize.define("websites", {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  banner: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isVintage: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  hasWidget: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

export const Requests = sequelize.define("requests", {
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  banner: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  denied: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

/**
 * This is temporary
 * @returns void
 */
export async function moveFromYaml() {
  const webSitesCount = await Websites.count();

  if (webSitesCount > 0) {
    return;
  }

  for (const site of ymlWebsites) {
    const id = md5(site.url);
    await Websites.create({
      id,
      name: site.name,
      url: site.url,
      banner: site.banner,
      description: site.description,
    });
  }
}

export async function connect() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await moveFromYaml();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

export async function getWebsite(id: string): Promise<WebsiteAttributes> {
  const result = await Websites.findOne({ where: { id } });
  return (result as any).toJSON();
}

export async function getRequest(
  id: string,
  t?: Transaction
): Promise<WebsiteRequest> {
  const result = await Requests.findOne({ where: { id }, transaction: t });
  return (result as any).toJSON();
}

export async function getAllWebsites(): Promise<WebsiteAttributes[]> {
  const result = await Websites.findAll();
  return result.map((o: any) => o.toJSON());
}

// Find a more efficient way of doing this when the number of sites
// reaches a more significant quantity
export async function getRandomSiteList(
  total: number = 5
): Promise<WebsiteAttributes[]> {
  const websites = await getAllWebsites();
  const indexes = new Array<number>(total);
  const len = websites.length;
  if (total > len)
    throw new RangeError("getRandomSites: more elements taken than available");

  while (total > 0) {
    const index = Math.floor(Math.random() * len);
    if (!indexes.includes(index)) {
      indexes[--total] = index;
    }
  }

  return indexes.map((i) => websites[i]);
}

// Find a more efficient way of doing this when the number of sites
// reaches a more significant quantity
export async function getRandomWebsite(
  currentId: string = ""
): Promise<WebsiteAttributes> {
  const filtered = (
    await Websites.findAll({
      where: {
        id: {
          [Op.not]: currentId,
        },
      },
    })
  ).map((o: any) => o.toJSON());

  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index];
}

// Find a more efficient way of doing this when the number of sites
// reaches a more significant quantity
export async function getNextWebsite(id: string) {
  const websites = (await Websites.findAll({ order: ["id", "asc"] })).map(
    (o: any) => o.toJSON() as WebsiteAttributes
  );

  const index = websites.findIndex((w) => w.id === id);
  let next = index + 1;
  if (next >= websites.length) {
    next = 0;
  }

  return websites[next];
}

// Find a more efficient way of doing this when the number of sites
// reaches a more significant quantity
export async function getPreviousWebsite(id: string) {
  const websites = (await Websites.findAll({ order: ["id", "asc"] })).map(
    (o: any) => o.toJSON() as WebsiteAttributes
  );
  const index = websites.findIndex((w) => w.id === id);
  let previous = index - 1;
  if (previous < 0) {
    previous = websites.length - 1;
  }

  return websites[previous];
}

export async function registerWebsiteRequest(data: Omit<WebsiteRequest, "id">) {
  const id = md5(data.url);
  await Requests.create({ id, ...data });
}

export async function checkIfWebsiteExists(url: string) {
  const id = md5(url);
  const reqCount = await Requests.count({ where: { id } });
  const siteCount = await Websites.count({ where: { id } });

  return reqCount > 0 || siteCount > 0;
}

export async function getAllRequests() {
  const all = await Requests.findAll({ where: { denied: { [Op.not]: true } } });
  return all.map((o: any) => o.toJSON() as WebsiteRequest);
}

export async function addWebsite(website: WebsiteAttributes, t?: Transaction) {
  return Websites.create(website, { transaction: t });
}

export async function removeRequest(id: string, t?: Transaction) {
  return Requests.destroy({ where: { id }, transaction: t });
}

export async function denyRequest(id: string, t?: Transaction) {
  return Requests.update(
    { denied: true },
    { where: { id }, transaction: t, returning: true }
  );
}

export async function removeWebsite(id: string, t?: Transaction) {
  return Websites.destroy({ where: { id }, transaction: t });
}

export async function confirmBanner(id: string, t?: Transaction) {
  return Websites.update(
    { hasWidget: true },
    { where: { id }, transaction: t, returning: true }
  );
}
