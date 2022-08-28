declare namespace Express {
  // must be namespace, and not declare module "Express" {
  export interface Request {
    isOldBrowser: boolean;
  }
}
