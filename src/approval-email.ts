/**
 * Approval email template defaults (Gmail compose helper).
 * data/approval-email.json is a shared seed only — each admin overrides
 * gmailUserIndex / subject / body in browser localStorage.
 */
import * as fs from "fs";
import * as path from "path";
import { HOST } from "./config";

export type ApprovalEmailTemplate = {
  gmailUserIndex: number;
  subject: string;
  body: string;
};

const DATA_FILE = path.join(__dirname, "../data/approval-email.json");

const DEFAULT_TEMPLATE: ApprovalEmailTemplate = {
  gmailUserIndex: 5,
  subject: "TheOldNet WebRing Approval",
  body: `Hi, thanks for applying to The Old Net WebRing.

You can add the WebRing widget to your site. Your member ID is:

{{id}}

Get your banner / embed HTML here:
{{widgetUrl}}

We ask everyone in the WebRing to add the widget so we can increase visibility. Sites without the widget might be removed in the future.

Thank you!
The Old Net`,
};

function publicHostBase(): string {
  const h = (HOST || "//webring.theoldnet.com").trim();
  if (h.startsWith("//")) return `https:${h}`;
  if (h.startsWith("http://") || h.startsWith("https://")) return h.replace(/\/$/, "");
  return `https://${h.replace(/\/$/, "")}`;
}

export function widgetSetupUrl(websiteId: string): string {
  return `${publicHostBase()}/widget?websiteId=${encodeURIComponent(websiteId)}`;
}

export function loadApprovalEmailTemplate(): ApprovalEmailTemplate {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return {
        gmailUserIndex:
          typeof raw.gmailUserIndex === "number" && raw.gmailUserIndex >= 0
            ? raw.gmailUserIndex
            : DEFAULT_TEMPLATE.gmailUserIndex,
        subject:
          typeof raw.subject === "string" && raw.subject.trim()
            ? raw.subject
            : DEFAULT_TEMPLATE.subject,
        body:
          typeof raw.body === "string" && raw.body.trim()
            ? raw.body
            : DEFAULT_TEMPLATE.body,
      };
    }
  } catch (e) {
    console.error("Failed to read approval-email.json:", (e as Error).message);
  }
  return { ...DEFAULT_TEMPLATE };
}

export function saveApprovalEmailTemplate(
  input: Partial<ApprovalEmailTemplate>
): ApprovalEmailTemplate {
  const current = loadApprovalEmailTemplate();
  const next: ApprovalEmailTemplate = {
    gmailUserIndex:
      typeof input.gmailUserIndex === "number" &&
      !Number.isNaN(input.gmailUserIndex) &&
      input.gmailUserIndex >= 0
        ? Math.floor(input.gmailUserIndex)
        : current.gmailUserIndex,
    subject:
      typeof input.subject === "string" ? input.subject : current.subject,
    body: typeof input.body === "string" ? input.body : current.body,
  };
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(next, null, 2) + "\n", "utf8");
  return next;
}

/** Replace {{id}}, {{name}}, {{url}}, {{email}}, {{widgetUrl}} in template strings. */
export function renderApprovalEmail(
  template: ApprovalEmailTemplate,
  site: { id: string; name: string; url: string; email: string }
): { subject: string; body: string; gmailComposeUrl: string } {
  const widgetUrl = widgetSetupUrl(site.id);
  const vars: Record<string, string> = {
    id: site.id,
    name: site.name,
    url: site.url,
    email: site.email || "",
    widgetUrl,
  };
  const apply = (s: string) =>
    s.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
      vars[key] != null ? vars[key] : `{{${key}}}`
    );

  const subject = apply(template.subject);
  const body = apply(template.body);
  const gmailComposeUrl = `https://mail.google.com/mail/u/${template.gmailUserIndex}/?view=cm`;
  return { subject, body, gmailComposeUrl };
}

export function formatAdminDate(value: unknown): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

/** UTC datetime for admin (e.g. last embed seen). */
export function formatAdminDateTime(value: unknown): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}
