#!/usr/bin/env node
/**
 * pack-vendor — repeatably build and pack `@xoroh/axis` for vendoring.
 *
 * Kern consumes Axis pre-publish through a committed vendored tarball
 * (`vendor/axis/axis-<sha>.tgz`, `file:` spec with lockfile pin).
 * This script reproduces that tarball from any checkout, deterministically
 * named, so either repo can re-vendor without hand steps:
 *
 *   1. Builds `@xoroh/axis` fresh (no stale dist).
 *   2. Packs with `npm pack` (the tool `changeset publish` uses, so
 *      the tarball matches what the registry would receive).
 *   3. Copies it to `<out>/axis-<short-sha>.tgz` and prints that path
 *      (plus a sha512 integrity line for lockfile/pinning records).
 *
 * This performs NO version bump and NO publish — packing reads the
 * manifest, it never writes it and never contacts the registry.
 * Dirty trees are refused by default (a SHA naming uncommitted code
 * is a lie): pass `--allow-dirty` to override for scratch builds,
 * in which case the dirty state is printed alongside the path.
 *
 * Usage: `node scripts/pack-vendor.mjs [--out <dir>] [--allow-dirty]`
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const PKG = join(ROOT, "packages", "axis");

const args = process.argv.slice(2);
const outFlag = args.indexOf("--out");
const outDir = resolve(
  process.cwd(),
  outFlag === -1 ? "vendor" : (args[outFlag + 1] ?? "vendor"),
);
const allowDirty = args.includes("--allow-dirty");

function sh(cmd, argv, opts = {}) {
  const out = execFileSync(cmd, argv, { encoding: "utf8", ...opts });
  // `stdio: "ignore"` callers get no output back — normalize to ""
  // rather than crashing on `.trim()`.
  return (out ?? "").toString().trim();
}

// Pre-flight: fail fast with an actionable hint instead of dying
// mid-run with a cryptic ENOENT/127 (seen in a clean worktree
// without installed deps, where the build step lost `tsup`).
function need(cmd, hint) {
  try {
    sh(cmd, ["--version"], { stdio: "ignore" });
  } catch {
    console.error(`pack-vendor: required tool \`${cmd}\` not found. ${hint}`);
    process.exit(1);
  }
}

need("git", "Install git and re-run.");
need("bun", "Install the bun toolchain (>=1.3.8) and re-run.");
if (!existsSync(join(PKG, "node_modules", ".bin", "tsup"))) {
  console.error(
    "pack-vendor: dependencies are not installed (tsup not found).\n" +
      "Run `bun install --frozen-lockfile` first, then re-run.",
  );
  process.exit(1);
}
need("npm", "Install npm (it provides `npm pack`) and re-run.");

// Refuse to name a dirty TRACKED tree's output after a commit SHA
// (that name would claim reproducibility the bytes cannot honor).
// Untracked files are ignored: `npm pack` ships the `files`
// allowlist, never the worktree, so they cannot affect the bytes.
let dirty = "";
try {
  dirty = sh("git", [
    "-C",
    ROOT,
    "status",
    "--porcelain",
    "--untracked-files=no",
  ]);
} catch {
  dirty = "(git unavailable)";
}
if (dirty && !allowDirty) {
  console.error(
    "pack-vendor: refusing — working tree is dirty (would misname the tarball).\n" +
      "Commit or stash first, or re-run with --allow-dirty for a scratch build.",
  );
  process.exit(1);
}

const sha = sh("git", ["-C", ROOT, "rev-parse", "--short", "HEAD"]);
const manifest = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8"));
if (manifest.name !== "@xoroh/axis") {
  console.error(`pack-vendor: unexpected package name ${manifest.name}.`);
  process.exit(1);
}

// Fresh dist: never pack a stale build directory.
sh("bun", ["run", "--filter", "@xoroh/axis", "build"], {
  cwd: ROOT,
  stdio: "ignore",
});

// Pack with npm (release-equivalent) into a scratch dir, then rename
// to the vendored convention. `npm pack` names the file
// `xoroh-axis-<version>.tgz`; the vendored name carries the commit
// instead, because pre-publish there are no versions — only SHAs.
const scratch = resolve(tmpdir(), `axis-vendor-${process.pid}`);
mkdirSync(scratch, { recursive: true });
try {
  sh("npm", ["pack", "--pack-destination", scratch], {
    cwd: PKG,
    stdio: "ignore",
  });
  const flat = `${manifest.name.replace("@", "").replace("/", "-")}-${manifest.version}.tgz`;
  const tarball = join(scratch, flat);
  if (!existsSync(tarball)) {
    console.error(`pack-vendor: expected tarball ${flat} not produced.`);
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });
  const dest = join(outDir, `axis-${sha}.tgz`);
  copyFileSync(tarball, dest);
  const integrity = createHash("sha512")
    .update(readFileSync(dest))
    .digest("base64");
  console.log(dest);
  console.log(`sha512:${integrity}`);
  if (dirty) {
    console.log(`dirty-tree scratch build (uncommitted changes present)`);
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
