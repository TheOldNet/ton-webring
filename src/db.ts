import * as fs from "fs";
import * as path from "path";
import { DataTypes, Op, Sequelize, Transaction, WhereOptions } from "sequelize";
import {
  WebsiteAttributes,
  WebsiteCreator,
  WebsiteModel,
  WebsiteRequestAttributes,
  WebsiteRequestCreator,
  WebsiteRequestModel,
} from "./types";

import md5 = require("md5");

const dataFolder = path.join(__dirname, "../data");

if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder, { recursive: true });
}

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(dataFolder, "webring.sqlite"),
  logging: false,
});

export const Websites = sequelize.define<WebsiteModel, WebsiteCreator>(
  "websites",
  {
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
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    indexes: [{ unique: true, fields: ["order"] }],
  }
);

export const Requests = sequelize.define<
  WebsiteRequestModel,
  WebsiteRequestCreator
>("requests", {
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
  isVintage: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  denied: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

export async function connect() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

function whereIsVintage<T extends { isVintage: boolean }>(
  isVintage: boolean,
  where: WhereOptions<T>
) {
  if (isVintage === true) {
    return { ...where, isVintage };
  }
  return where;
}

export async function getWebsite(id: string): Promise<WebsiteAttributes> {
  const result = await Websites.findOne({ where: { id } });
  return result.toJSON();
}

export async function getRequest(
  id: string,
  t?: Transaction
): Promise<WebsiteRequestAttributes | undefined> {
  const result = await Requests.findOne({ where: { id }, transaction: t });
  if (!result) {
    return undefined;
  }
  return result.toJSON();
}

export async function getAllWebsites(
  isVintage: boolean = undefined
): Promise<WebsiteAttributes[]> {
  const result = await Websites.findAll({
    where: whereIsVintage(isVintage, {}),
  });
  return result.map((o: any) => o.toJSON());
}

export async function getRandomSiteList(
  isVintage: boolean = undefined,
  total: number = 5
): Promise<WebsiteAttributes[]> {
  const result = await Websites.findAll({
    where: whereIsVintage(isVintage, {}),
    order: [Sequelize.literal("RANDOM()")],
    limit: total,
  });
  return result.map((o) => o.toJSON());
}

// Find a more efficient way of doing this when the number of sites
// reaches a more significant quantity
export async function getRandomWebsite(
  isVintage: boolean = undefined,
  currentId: string = ""
): Promise<WebsiteAttributes> {
  let random = await Websites.findOne({
    order: [Sequelize.literal("RANDOM()")],
    where: whereIsVintage(isVintage, {
      id: {
        [Op.not]: currentId,
      },
    }),
  });

  return random.toJSON();
}

export async function getNextWebsite(
  id: string,
  isVintage: boolean = undefined
): Promise<WebsiteAttributes> {
  const current = await getWebsite(id);
  const max: number = await Websites.max("order");

  let nextOrder = current.order >= max ? 0 : current.order + 1;

  let next: WebsiteModel;
  while (
    !(next = await Websites.findOne({
      where: whereIsVintage(isVintage, { order: nextOrder }),
    }))
  ) {
    nextOrder++;
    if (nextOrder > max) {
      nextOrder = 0;
    }
  }

  return next.toJSON();
}

export async function getPreviousWebsite(
  id: string,
  isVintage: boolean = undefined
): Promise<WebsiteAttributes> {
  const current = await getWebsite(id);

  const min: number = await Websites.min("order");
  const max: number = await Websites.max("order");

  let previousOrder = current.order < min ? max : current.order - 1;

  let previous: WebsiteModel;
  while (
    !(previous = await Websites.findOne({
      where: whereIsVintage(isVintage, { order: previousOrder }),
    }))
  ) {
    previousOrder--;
    if (previousOrder < min) {
      previousOrder = max;
    }
  }

  return previous.toJSON();
}

export async function registerWebsiteRequest(
  data: Omit<WebsiteRequestAttributes, "id">
) {
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
  return all.map((o) => o.toJSON() as WebsiteRequestAttributes);
}

export async function addWebsite(website: WebsiteAttributes, t?: Transaction) {
  const order: number = (await Websites.max("order")) || 0;
  return Websites.create({ ...website, order: order + 1 }, { transaction: t });
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

export async function toggleRetro(id: string, t?: Transaction) {
  const site = await Websites.findOne({ where: { id } });
  const isVintage = site.getDataValue("isVintage");

  return Websites.update(
    { isVintage: !isVintage },
    { where: { id }, transaction: t }
  );
}

export async function clearBanner(id: string, t?: Transaction) {
  return Requests.update(
    { banner: null },
    { where: { id }, transaction: t, returning: true }
  );
}
