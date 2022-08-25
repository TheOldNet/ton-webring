import * as db from "./db";
import { downloadBanner } from "./helpers";

export async function approveRequest(id: string) {
  return db.sequelize.transaction(async (t) => {
    try {
      const request = await db.getRequest(id, t);

      const downloaded = await downloadBanner(request);

      const { description, email, name, url, isVintage } = request;

      await db.addWebsite(
        {
          description,
          email,
          id,
          name,
          url,
          banner: downloaded,
          isVintage,
        },
        t
      );

      await db.removeRequest(id, t);
    } catch (ex) {
      console.error(ex);
      t.rollback();
      return;
    }
  });
}

export async function denyRequest(id: string) {
  return db.denyRequest(id);
}

export async function removeWebsite(id: string) {
  return db.removeWebsite(id);
}

export async function confirmBanner(id: string) {
  return db.confirmBanner(id);
}

export async function toggleRetro(id: string) {
  return db.toggleRetro(id);
}

export async function clearBanner(id: string) {
  return db.clearBanner(id);
}
