#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import * as process from "process";
import * as p from "@clack/prompts";
import { DEFAULT_APP_NAME } from "~/consts.js";
import { createSvelteKitApp } from "~/create-app.js";
import { getUserPkgManager } from "~/helpers/utils.js";
import { bold, cyan } from "kleur/colors";

let cwd = process.argv[2] ?? ".";
p.intro("Welcome to create-kit-app!");

let appName = await p.text({
  message: "How should we call your project?",
  defaultValue: DEFAULT_APP_NAME,
  placeholder: DEFAULT_APP_NAME,
});
if (p.isCancel(appName)) process.exit(1);
if (appName.trim().length === 0) appName = DEFAULT_APP_NAME;

cwd = path.join(cwd, appName);

if (fs.existsSync(cwd)) {
  if (fs.readdirSync(cwd).length > 0) {
    const force = await p.confirm({
      message:
        "Directory is not empty. Continue? (Might not work as expected!)",
      initialValue: false,
    });

    // bail if `force` is `false` or the user cancelled with Ctrl-C
    if (force !== true) {
      process.exit(1);
    }
  }
}

const features = await p.multiselect({
  message: "Select additional options (use arrow keys/space bar)",
  required: false,
  options: [
    {
      value: "prisma",
      label: "Add Prisma for database management",
    },
    {
      value: "tailwindcss",
      label: "Add Tailwindcss for styling",
    },
    {
      value: "Auth.js",
      label: "Add Auth.js (formerly Next-Auth) for authentication",
    },
    {
      value: "mdsvex",
      label: "Add mdsvex for markdown support",
    },
    {
      value: "playwright",
      label: "Add Playwright for browser testing",
    },
    {
      value: "vitest",
      label: "Add Vitest for unit testing",
    },
  ],
});
if (p.isCancel(features)) process.exit(1);

const usesPrisma = Array.isArray(features) && features.includes("prisma");
let db = null;
if (usesPrisma) {
  db = await p.select({
    message: "Which database do you want to use?",
    initialValue: "SQLite",
    options: [
      {
        value: "sqlite",
        label: "Add SQLite",
      },
      {
        value: "postgresql",
        label: "Add PostgreSQL",
      },
      {
        value: "mongodb",
        label: "Add MongoDB",
      },
      {
        value: "mysql",
        label: "Add MySQL",
      },
      {
        value: "sqlserver",
        label: "Add SQL Server",
      },
      {
        value: "cockroachdb",
        label: "Add CockroachDB",
      },
    ],
  });
  if (p.isCancel(db)) process.exit(1);
}

const options = await p.group(
  {
    runInstallEnv: () =>
      p
        .confirm({
          message: "Do you want us to install the dependencies?",
          initialValue: true,
        })
        .then((runInstallEnv) =>
          runInstallEnv === true ? getUserPkgManager() : false,
        ),
    initGit: () =>
      p.confirm({
        message: "Initialize a git repository?",
        initialValue: false,
      }),
  },
  { onCancel: () => process.exit(1) },
);

await createSvelteKitApp(path.resolve(cwd), {
  name: path.basename(path.resolve(cwd)),
  playwright: features.includes("playwright"),
  vitest: features.includes("vitest"),
  tailwindcss: features.includes("tailwindcss"),
  prisma: usesPrisma ? db! : false,
  mdsvex: features.includes("mdsvex"),
  auth: features.includes("Auth.js"),
  installEnv: options.runInstallEnv,
  initGit: options.initGit,
}).catch((err) => {
  p.log.error(`Something terrible happend!: ${err}`);
  process.exit(1);
});

p.outro("Your project is ready!");

console.log(bold("✔ Typescript"));
console.log('  Inside Svelte components, use <script lang="ts">\n');
console.log(bold("✔ ESLint"));
console.log(cyan("  https://github.com/sveltejs/eslint-plugin-svelte\n"));
console.log(bold("✔ Prettier"));
console.log(cyan("  https://prettier.io/docs/en/options.html"));
console.log(
  cyan("  https://github.com/sveltejs/prettier-plugin-svelte#options\n"),
);

if (features.includes("playwright")) {
  console.log(bold("✔ Playwright"));
  console.log(cyan("  https://playwright.dev\n"));
}

if (features.includes("vitest")) {
  console.log(bold("✔ Vitest"));
  console.log(cyan("  https://vitest.dev\n"));
}

if (features.includes("tailwindcss")) {
  console.log(bold("✔ Tailwindcss"));
  console.log(cyan("  https://tailwindcss.com\n"));
}

if (usesPrisma) {
  console.log(bold("✔ Prisma"));
  console.log(cyan("  https://www.prisma.io\n"));
}

if (features.includes("mdsvex")) {
  console.log(bold("✔ mdsvex"));
  console.log(cyan("  https://mdsvex.com\n"));
}

if (features.includes("Auth.js")) {
  console.log(bold("✔ Auth.js"));
  console.log(cyan("  https://authjs.dev/reference/sveltekit\n"));
}

console.log("Install community-maintained integrations:");
console.log(cyan("  https://github.com/svelte-add/svelte-add"));

console.log("\nNext steps:");
let i = 1;

const relative = path.relative(process.cwd(), cwd);
if (relative !== "") {
  console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
}

if (!options.runInstallEnv) {
  console.log(`  ${i++}: ${bold(cyan("npm install"))} (or pnpm install, etc)`);
}
if (!options.initGit) {
  console.log(
    `  ${i++}: ${bold(
      cyan('git init && git add -A && git commit -m "Initial commit"'),
    )} (optional)`,
  );
}

console.log(`  ${i++}: ${bold(cyan("npm run dev -- --open"))}`);
console.log(`\nTo close the dev server, hit ${bold(cyan("Ctrl-C"))}`);
console.log(`\nStuck? Visit svelte at ${cyan("https://svelte.dev/chat")}`);
