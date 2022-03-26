export type WebsiteAttributes = {
  id: string;
  name: string;
  email: string;
  url: string;
  banner?: string;
  description: string;
  hasWidget?: boolean;
};

export type WidgetCreationRequest = {
  websiteId: string;
};

export type WebsiteRequest = {
  id: string;
  name: string;
  url: string;
  email: string;
  banner?: string;
  description: string;
  denied?: boolean;
};
