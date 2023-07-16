import * as p from "@clack/prompts";
import { addAuthJs } from "~/adders/auth.js";
import { addPrisma } from "~/adders/prisma.js";
import { initializeGit } from "~/helpers/git.js";
import { installDeps, runSvelteAdd } from "~/helpers/svelete-add.js";
import { create } from "create-svelte";
import { type Options } from "create-svelte/types/internal.js";

interface InternalOptions {
  tailwindcss: boolean;
  mdsvex: boolean;
  prisma: string | false;
  auth: boolean;
  installEnv: string | false;
  initGit: boolean;
}

async function handleInternalCreate(
  projectDirectory: string,
  { tailwindcss, mdsvex, prisma, auth, installEnv, initGit }: InternalOptions,
) {
  const spinner = p.spinner();

  if (tailwindcss) {
    spinner.start("Adding Tailwind CSS...");
    await runSvelteAdd({
      projectDirectory,
      adder: "tailwindcss",
    });
    spinner.stop("Tailwind CSS added.");
  }

  if (mdsvex) {
    spinner.start("Adding mdsvex...");
    await runSvelteAdd({
      projectDirectory,
      adder: "mdsvex",
    });
    spinner.stop("mdsvex added.");
  }

  if (auth) {
    spinner.start("Adding authentication...");
    await addAuthJs(projectDirectory, {
      projectDirectory,
      withDb: !!prisma,
    });
    spinner.stop("Authentication added.");
  }

  if (prisma) {
    spinner.start("Adding Prisma...");
    await addPrisma(projectDirectory, {
      withAuth: auth,
      db: prisma,
    });
    spinner.stop("Prisma added.");
  }

  if (installEnv) {
    spinner.start("Installing dependencies...");
    await installDeps(projectDirectory, installEnv);
    spinner.stop("Dependencies installed.");
  }

  if (initGit) {
    await initializeGit(projectDirectory);
  }
}
interface SKAOptions extends Partial<Options>, InternalOptions {
  name: string;
}

export async function createSvelteKitApp(
  projectDirectory: string,
  {
    name,
    vitest = false,
    playwright = false,
    template = "default",
    types = "typescript",
    prettier = true,
    eslint = true,
    ...internalOptions
  }: SKAOptions,
): Promise<void> {
  const spinner = p.spinner();
  p.note("Creating SvelteKit app...");
  spinner.start("Creating SvelteKit app...");
  await create(projectDirectory, {
    name,
    types,
    prettier,
    eslint,
    vitest,
    template,
    playwright,
  });
  spinner.stop("SvelteKit app created.");

  await handleInternalCreate(projectDirectory, internalOptions);

  return Promise.resolve();
}
