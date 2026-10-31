import * as db from "./db";
import { downloadBanner } from "./helpers";

export async function approveRequest(id: string) {
  // Let Sequelize manage commit/rollback — do not call t.rollback() inside
  // the callback (that causes "Transaction cannot be committed… rollback").
  return db.sequelize.transaction(async (t) => {
    const request = await db.getRequest(id, t);

    const downloaded = await downloadBanner(request);

    const { description, email, name, url, isVintage, createdAt } = request;

    await db.addWebsite(
      {
        description,
        email,
        id,
        name,
        url,
        banner: downloaded,
        isVintage,
        approvalEmailed: false,
        // Keep original submission time as the site's createdAt when possible.
        ...(createdAt ? { createdAt: createdAt as Date } : {}),
      } as any,
      t
    );

    await db.removeRequest(id, t);
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

export async function markApprovalEmailed(id: string, emailed: boolean = true) {
  return db.markApprovalEmailed(id, emailed);
}
