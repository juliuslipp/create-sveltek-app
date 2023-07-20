import path from "node:path";
import { PKG_ROOT } from "~/consts.js";
import { installPackage } from "~/helpers/svelete-add.js";
import fs from "fs-extra";

export async function addAuthJs(
  projectDirectory: string,
  {
    withDb,
  }: {
    projectDirectory: string;
    withDb: boolean;
  },
) {
  await installPackage({
    projectDirectory,
    package: "@auth/core",
    prod: true,
  });
  await installPackage({
    projectDirectory,
    package: "@auth/sveltekit",
    prod: true,
  });

  if (withDb) {
    await installPackage({
      projectDirectory,
      package: "@auth/prisma-adapter",
      prod: true,
    });
  }

  const authTemplateDir = path.join(PKG_ROOT, "templates/auth");
  const authSrcDir = path.join(authTemplateDir, "src");
  const hookSrc = path.join(
    authSrcDir,
    withDb ? "with-prisma-hooks.server.ts" : "hooks.server.ts",
  );
  const hooksDest = path.join(projectDirectory, "src/hooks.server.ts");

  fs.copySync(hookSrc, hooksDest);
}
