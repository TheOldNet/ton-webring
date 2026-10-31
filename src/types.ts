import { Model } from "sequelize/types";

export type WebsiteAttributes = {
  id: string;
  name: string;
  email: string;
  url: string;
  banner?: string;
  description: string;
  isVintage: boolean;
  hasWidget?: boolean;
  /** Admin marked that the approval email was sent. */
  approvalEmailed?: boolean;
  order?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type WebsiteCreator = WebsiteAttributes;
export type WebsiteModel = Model<WebsiteAttributes, WebsiteCreator>;

export type WidgetCreationRequest = {
  websiteId: string;
};

export type WebsiteRequestAttributes = {
  id: string;
  name: string;
  url: string;
  email: string;
  banner?: string;
  description: string;
  isVintage: boolean;
  denied?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type WebsiteRequestCreator = WebsiteRequestAttributes;
export type WebsiteRequestModel = Model<
  WebsiteRequestAttributes,
  WebsiteRequestCreator
>;
