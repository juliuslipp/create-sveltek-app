import { execSync } from "child_process";
import fs from "node:fs";
import path from "path";
import * as p from "@clack/prompts";
import { execa } from "execa";

const isGitInstalled = (dir: string): boolean => {
  try {
    execSync("git --version", { cwd: dir });
    return true;
  } catch (_e) {
    return false;
  }
};

/** @returns Whether or not the provided directory has a `.git` subdirectory in it. */
const isRootGitRepo = (dir: string): boolean => {
  return fs.existsSync(path.join(dir, ".git"));
};

/** @returns Whether or not this directory or a parent directory has a `.git` directory. */
const isInsideGitRepo = async (dir: string): Promise<boolean> => {
  try {
    // If this command succeeds, we're inside a git repo
    await execa("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: dir,
      stdout: "ignore",
    });
    return true;
  } catch (_e) {
    // Else, it will throw a git-error and we return false
    return false;
  }
};

const getGitVersion = () => {
  const stdout = execSync("git --version").toString().trim();
  const gitVersionTag = stdout.split(" ")[2];
  const major = gitVersionTag?.split(".")[0];
  const minor = gitVersionTag?.split(".")[1];
  return { major: Number(major), minor: Number(minor) };
};

/** @returns The git config value of "init.defaultBranch". If it is not set, returns "main". */
const getDefaultBranch = () => {
  return execSync("git config --global init.defaultBranch || echo main")
    .toString()
    .trim();
};

// This initializes the Git-repository for the project
export const initializeGit = async (projectDir: string) => {
  const spinner = p.spinner();
  spinner.start("Initializing Git...");

  if (!isGitInstalled(projectDir)) {
    spinner.stop("Git is not installed. Skipping Git initialization.");
    return;
  }

  const isRoot = isRootGitRepo(projectDir);
  const isInside = await isInsideGitRepo(projectDir);
  const dirName = path.parse(projectDir).name; // skip full path for logging

  if (isInside && isRoot) {
    spinner.stop("Querying User.");
    // Dir is a root git repo
    const overwriteGit = await p.confirm({
      message: "Git is already initialized. Override?",
      initialValue: false,
    });
    if (p.isCancel(overwriteGit)) throw Error("Operation Canceled");

    if (!overwriteGit) {
      p.log.warn("Skipping git initialization.");
      return;
    }
    // Deleting the .git folder
    fs.rmSync(path.join(projectDir, ".git"), { recursive: true, force: true });
  } else if (isInside && !isRoot) {
    spinner.stop("Querying User.");
    // Dir is inside a git worktree
    const initializeChildGitRepo = await p.confirm({
      message: `${dirName} is already in a git worktree. Would you still like to initialize a new git repository in this directory?`,
      initialValue: false,
    });
    if (p.isCancel(initializeChildGitRepo)) throw Error("Operation Canceled");

    if (!initializeChildGitRepo) {
      p.log.warn("Skipping Git initialization.");
      return;
    }
  }

  // We're good to go, initializing the git repo
  const branchName = getDefaultBranch();

  // --initial-branch flag was added in git v2.28.0
  const { major, minor } = getGitVersion();
  if (major < 2 || (major == 2 && minor < 28)) {
    await execa("git", ["init"], { cwd: projectDir });
    // symbolic-ref is used here due to refs/heads/master not existing
    // It is only created after the first commit
    // https://superuser.com/a/1419674
    await execa("git", ["symbolic-ref", "HEAD", `refs/heads/${branchName}`], {
      cwd: projectDir,
    });
  } else {
    await execa("git", ["init", `--initial-branch=${branchName}`], {
      cwd: projectDir,
    });
  }
  await execa("git", ["add", "."], { cwd: projectDir });
  spinner.stop("Successfully initialized and staged git.");
};
