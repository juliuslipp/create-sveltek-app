import fs from "node:fs";
import path from "node:path";

export function replaceTextInPath(
  pathToFileOrDirectory: string,
  search: string,
  replacement: string,
): void {
  if (fs.statSync(pathToFileOrDirectory).isDirectory()) {
    const files = fs.readdirSync(pathToFileOrDirectory);

    files.forEach((file) => {
      const filePath = path.join(pathToFileOrDirectory, file);
      replaceTextInPath(filePath, search, replacement);
    });
  } else {
    const data = fs.readFileSync(pathToFileOrDirectory, "utf8");
    const updatedData = data.replace(new RegExp(search, "g"), replacement);
    fs.writeFileSync(pathToFileOrDirectory, updatedData, "utf8");
  }
}

export type PackageManager = "npm" | "pnpm" | "yarn";
export const getUserPkgManager: () => PackageManager = () => {
  // This environment variable is set by npm and yarn but pnpm seems less consistent
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent) {
    if (userAgent.startsWith("yarn")) {
      return "yarn";
    } else if (userAgent.startsWith("pnpm")) {
      return "pnpm";
    } else {
      return "npm";
    }
  } else {
    // If no user agent is set, assume npm
    return "npm";
  }
};
