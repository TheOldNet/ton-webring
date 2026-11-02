import * as fs from "fs";
import * as path from "path";
import { DataTypes, Op, Sequelize, Transaction, WhereOptions } from "sequelize";
import {
  AnalyticsEventAttributes,
  AnalyticsEventCreator,
  AnalyticsEventModel,
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
    /** True = member/admin-supplied image; false = our generator. */
    bannerIsCustom: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    approvalEmailed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastEmbedSeenAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastEmbedReferer: {
      type: DataTypes.TEXT,
      allowNull: true,
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

export const AnalyticsEvents = sequelize.define<
  AnalyticsEventModel,
  AnalyticsEventCreator
>("analytics_events", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fromWebsiteId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  toWebsiteId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  toUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  referer: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isOldBrowser: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

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
    // Existing SQLite DBs won't pick up new columns from sync() alone.
    try {
      await sequelize.query(
        "ALTER TABLE websites ADD COLUMN approvalEmailed BOOLEAN NOT NULL DEFAULT 0"
      );
    } catch (_) {
      /* column already exists */
    }
    // Default 1 (custom) so a naïve regen won't overwrite unknown legacy banners.
    try {
      await sequelize.query(
        "ALTER TABLE websites ADD COLUMN bannerIsCustom BOOLEAN NOT NULL DEFAULT 1"
      );
    } catch (_) {
      /* column already exists */
    }
    try {
      await sequelize.query(
        "ALTER TABLE websites ADD COLUMN lastEmbedSeenAt DATETIME"
      );
    } catch (_) {
      /* column already exists */
    }
    try {
      await sequelize.query(
        "ALTER TABLE websites ADD COLUMN lastEmbedReferer TEXT"
      );
    } catch (_) {
      /* column already exists */
    }
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

export async function getWebsite(
  id: string
): Promise<WebsiteAttributes | undefined> {
  const result = await Websites.findOne({ where: { id } });
  if (!result) {
    return undefined;
  }
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

export async function countWebsites(
  isVintage: boolean = undefined
): Promise<number> {
  return Websites.count({ where: whereIsVintage(isVintage, {}) });
}

/** Sequential page of members ordered by ring `order` (stable next/prev browsing). */
export async function getWebsitePage(
  isVintage: boolean = undefined,
  page: number = 0,
  pageSize: number = 10
): Promise<WebsiteAttributes[]> {
  const safeSize = Math.max(1, pageSize | 0);
  const safePage = Math.max(0, page | 0);
  const result = await Websites.findAll({
    where: whereIsVintage(isVintage, {}),
    order: [["order", "ASC"]],
    offset: safePage * safeSize,
    limit: safeSize,
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

export async function markApprovalEmailed(
  id: string,
  emailed: boolean = true,
  t?: Transaction
) {
  return Websites.update(
    { approvalEmailed: emailed },
    { where: { id }, transaction: t }
  );
}

export async function updateWebsite(
  id: string,
  fields: Partial<
    Pick<
      WebsiteAttributes,
      | "name"
      | "url"
      | "description"
      | "email"
      | "banner"
      | "bannerIsCustom"
      | "isVintage"
    >
  >,
  t?: Transaction
) {
  return Websites.update(fields, { where: { id }, transaction: t });
}

/** True if another member (not `exceptId`) already uses this exact URL string. */
export async function websiteUrlTakenByOther(
  url: string,
  exceptId: string
): Promise<boolean> {
  const count = await Websites.count({
    where: { url, id: { [Op.ne]: exceptId } },
  });
  return count > 0;
}

/** Record that a member's widget image was loaded (presence signal). */
export async function touchEmbedSeen(
  id: string,
  referer: string | null
): Promise<void> {
  await Websites.update(
    {
      lastEmbedSeenAt: new Date(),
      lastEmbedReferer: referer,
      hasWidget: true,
    },
    { where: { id } }
  );
}

export async function createAnalyticsEvent(
  event: AnalyticsEventAttributes
): Promise<void> {
  await AnalyticsEvents.create(event);
}

export async function getRecentAnalyticsEvents(
  limit: number = 100
): Promise<AnalyticsEventAttributes[]> {
  const rows = await AnalyticsEvents.findAll({
    order: [["createdAt", "DESC"]],
    limit: Math.max(1, Math.min(500, limit | 0)),
  });
  return rows.map((r) => r.toJSON());
}

/** Simple counts by event type (all time). */
export async function getAnalyticsTypeCounts(): Promise<
  { type: string; count: number }[]
> {
  const rows = await AnalyticsEvents.findAll({
    attributes: [
      "type",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    group: ["type"],
    raw: true,
  });
  return (rows as any[]).map((r) => ({
    type: String(r.type),
    count: Number(r.count) || 0,
  }));
}

/** Top destination member ids from click/nav events. */
export async function getTopDestinations(
  limit: number = 20
): Promise<{ toWebsiteId: string; count: number }[]> {
  const rows = await AnalyticsEvents.findAll({
    attributes: [
      "toWebsiteId",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    where: {
      toWebsiteId: { [Op.ne]: null },
      type: {
        [Op.in]: [
          "banner_click",
          "nav_previous",
          "nav_next",
          "nav_random",
          "widget_nav_previous",
          "widget_nav_next",
          "widget_nav_random",
        ],
      },
    },
    group: ["toWebsiteId"],
    order: [[Sequelize.literal("count"), "DESC"]],
    limit: Math.max(1, Math.min(100, limit | 0)),
    raw: true,
  });
  return (rows as any[]).map((r) => ({
    toWebsiteId: String(r.toWebsiteId),
    count: Number(r.count) || 0,
  }));
}
