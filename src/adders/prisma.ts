import path from "node:path";
import { PKG_ROOT } from "~/consts.js";
import { installPackage, updatePackageJson } from "~/helpers/svelete-add.js";
import { replaceTextInPath } from "~/helpers/utils.js";
import fs from "fs-extra";

export async function addPrisma(
  projectDirectory: string,
  {
    withAuth,
    db,
  }: {
    withAuth: boolean;
    db: string;
  },
) {
  await installPackage({ projectDirectory, prod: false, package: "prisma" });
  await installPackage({
    projectDirectory,
    prod: true,
    package: "@prisma/client",
  });

  const prismaTemplateDir = path.join(PKG_ROOT, "templates/prisma");
  const prismaDir = path.join(prismaTemplateDir, "prisma");
  const schemaSrc = path.join(
    prismaDir,
    withAuth ? "with-auth.prisma" : "base.prisma",
  );
  const schemaDest = path.join(projectDirectory, "prisma/schema.prisma");
  const clientSrc = path.join(prismaTemplateDir, "src/lib/db.ts");
  const clientDest = path.join(projectDirectory, "src/lib/db.ts");

  // add postinstall script to package.json
  await updatePackageJson({
    projectDirectory,
    update: (packageJson) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      packageJson.scripts = {
        ...packageJson.scripts,
        postinstall: "prisma generate",
      };
      return packageJson;
    },
  });

  fs.copySync(schemaSrc, schemaDest);
  fs.copySync(clientSrc, clientDest);

  if (db !== "sqlite") {
    replaceTextInPath(schemaDest, 'provider = "sqlite"', `provider = "${db}"`);
  }
}
