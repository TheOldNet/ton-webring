import * as fs from "fs";

import * as yaml from "yaml";
import { Website } from "./types";
import * as path from "path";
import { DataTypes, Sequelize } from "sequelize";
import md5 = require("md5");
import { Op } from "sequelize";

const websitesYaml = fs.readFileSync(
  path.join(__dirname, "..", "websites.yaml"),
  { encoding: "utf-8" }
);

const ymlWebsites: Website[] = yaml.parse(websitesYaml);

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

export async function getWebsite(id: string): Promise<Website> {
  const result = await Websites.findOne({ where: { id } });
  return (result as any).toJSON();
}

export async function getAllWebsites(): Promise<Website[]> {
  const result = await Websites.findAll();
  return result.map((o: any) => o.toJSON());
}

// Find a more efficient way of doing this when the number of sites
// reaches a more significant quantity
export async function getRandomSiteList(total: number = 5): Promise<Website[]> {
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
): Promise<Website> {
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
    (o: any) => o.toJSON() as Website
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
    (o: any) => o.toJSON() as Website
  );
  const index = websites.findIndex((w) => w.id === id);
  let previous = index - 1;
  if (previous < 0) {
    previous = websites.length - 1;
  }

  return websites[previous];
}
