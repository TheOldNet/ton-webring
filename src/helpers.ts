// Need to test this properly, I haven't tested it with
// An actual domain
export function getHost() {
  const env = process.env.ENVIRONMENT;

  if (env === "production") {
    return "http://www.theoldnet.com";
  }

  return "";
}
