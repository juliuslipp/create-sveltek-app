/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/ban-ts-comment,@typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */

import { join } from "path";
import {
  getEnvironment,
  getFolderInfo,
  installDependencies,
  runAdder,
  // @ts-ignore
} from "svelte-add";
// @ts-ignore
import updateJsonFile from "update-json-file";
import packageVersions from "../package-versions.json";

const environment = await getEnvironment();

export async function runSvelteAdd({
  projectDirectory,
  adder,
  options,
}: {
  projectDirectory: string;
  adder: string;
  options?: Record<string, unknown>;
}) {
  await runAdder({
    adder,
    projectDirectory: projectDirectory,
    environment,
    options: options ?? {},
    folderInfo: await getFolderInfo({ projectDirectory: projectDirectory }),
  });
}

export async function installDeps(
  projectDirectory: string,
  packageManager: string,
) {
  await installDependencies({
    projectDirectory: projectDirectory,
    packageManager: packageManager as "npm" | "yarn" | "pnpm",
    platform: environment.platform,
  });
}

export async function updatePackageJson({
  projectDirectory,
  update,
}: {
  projectDirectory: string;
  update: (obj: Record<string, any>) => Record<string, any>;
}) {
  await updateJsonFile(
    join(projectDirectory, "package.json"),
    (pkgJson: object) => {
      return update(pkgJson);
    },
  );
}

export async function installPackage({
  projectDirectory,
  prod = false,
  package: pkg,
  versionOverride,
}: {
  projectDirectory: string;
  package: string;
  prod?: boolean;
  versionOverride?: string;
}) {
  await updatePackageJson({
    projectDirectory,
    update(obj) {
      // @ts-ignore
      const version = versionOverride ?? packageVersions[pkg] ?? "latest";

      if (prod) {
        if (!obj.dependencies) obj.dependencies = {};
        obj.dependencies[pkg] = version;
      } else {
        if (!obj.devDependencies) obj.devDependencies = {};
        obj.devDependencies[pkg] = version;
      }

      return obj;
    },
  });
}
