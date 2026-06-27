#!/usr/bin/env node
// Integrity check for the CSBC architecture document.
//
// Purpose (ROADMAP P2): keep arch/README.md from silently drifting away from
// the reference implementations again. The README is the canonical document;
// the eight sibling packages are the ground truth. This script reads the
// ground truth and fails if the README no longer reflects it.
//
// Two checks:
//   1. Version note   — every package's actual `@wc-bindable/core` range (or
//                       "no dependency") must be reflected in the README's
//                       "Honest note on versions" paragraph.
//   2. Declaration    — every package that depends on `@wc-bindable/core` must
//      conformance      declare `protocol: "wc-bindable"` and `version: 1` in
//      (lite)           its source. This is declaration-LEVEL conformance only,
//                       not full L1/L2/L3 wire-vector conformance (see NOTE).
//
// NOTE: full conformance-vector testing (the upstream CONFORMANCE.md L1/L2/L3
// vectors) is intentionally NOT done here — those vectors are not vendored into
// this workspace, and fabricating a check would be worse than declaring the
// gap. Vendoring them is tracked as the open P2-2 follow-up in ROADMAP.md.
//
// Zero dependencies: Node built-ins only. Run: `node scripts/check-integrity.mjs`

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const archRoot = resolve(__dirname, "..");
const siblingsRoot = resolve(archRoot, ".."); // csbc-dev/

const PACKAGES = [
  "ai-agent",
  "ami-voice",
  "auth0",
  "feature-flags",
  "lambda",
  "s3-uploader",
  "stripe",
  "webauthn",
];

const CORE_DEP = "@wc-bindable/core";

const problems = [];
const skipped = [];
const ok = [];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

// Ground truth: the declared @wc-bindable/core range for each sibling package.
function actualCoreRange(pkgDir) {
  const pkgJsonPath = join(pkgDir, "package.json");
  if (!existsSync(pkgJsonPath)) return { present: false, reason: "no package.json" };
  const pkg = readJson(pkgJsonPath);
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.peerDependencies ?? {}) };
  if (CORE_DEP in deps) return { present: true, range: deps[CORE_DEP] };
  return { present: true, range: null }; // package exists, no core dependency
}

// Recursively look for `protocol: "wc-bindable"` and `version: 1` in src/.
function declaresProtocol(pkgDir) {
  const srcDir = join(pkgDir, "src");
  if (!existsSync(srcDir)) return false;
  const stack = [srcDir];
  let sawProtocol = false;
  let sawVersion = false;
  while (stack.length) {
    const cur = stack.pop();
    for (const entry of readdirSync(cur)) {
      const full = join(cur, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (entry !== "node_modules") stack.push(full);
      } else if (/\.(ts|js|mjs)$/.test(entry)) {
        const text = readFileSync(full, "utf8");
        if (/protocol\s*:\s*["']wc-bindable["']/.test(text)) sawProtocol = true;
        if (/version\s*:\s*1\b/.test(text)) sawVersion = true;
        if (sawProtocol && sawVersion) return true;
      }
    }
  }
  return sawProtocol && sawVersion;
}

// Extract the "Honest note on versions" paragraph from the README.
function versionNoteParagraph(readme) {
  const start = readme.indexOf("Honest note on versions");
  if (start === -1) return null;
  // The note is a single blockquote paragraph; capture to the next blank line
  // that is not a blockquote continuation.
  const tail = readme.slice(start);
  const end = tail.search(/\n\s*\n/);
  return end === -1 ? tail : tail.slice(0, end);
}

// README_PATH override exists so the check itself can be drift-tested against a
// deliberately-mutated copy (see scripts' negative test). Defaults to the real one.
const readmePath = process.env.README_PATH || join(archRoot, "README.md");
if (!existsSync(readmePath)) {
  console.error("FATAL: README.md not found at", readmePath);
  process.exit(2);
}
const readme = readFileSync(readmePath, "utf8");
const note = versionNoteParagraph(readme);
if (!note) {
  problems.push('README is missing the "Honest note on versions" paragraph (P0-5 disclosure).');
}

for (const name of PACKAGES) {
  const pkgDir = join(siblingsRoot, name);
  if (!existsSync(pkgDir)) {
    skipped.push(`${name}: sibling repo not present at ${pkgDir}`);
    continue;
  }

  const core = actualCoreRange(pkgDir);

  // --- Check 1: version note reflects reality ---
  if (note) {
    if (core.present && core.range) {
      // The package's CURRENT range token must appear in the note. A silent
      // bump (e.g. ^0.7.0 -> ^0.9.0) drops the new token and fails here.
      if (!note.includes(core.range)) {
        problems.push(
          `${name}: declares ${CORE_DEP} ${core.range}, but the README version note does not mention "${core.range}".`,
        );
      } else {
        ok.push(`${name}: ${CORE_DEP} ${core.range} reflected in README`);
      }
    } else if (core.present && core.range === null) {
      // No core dependency: the note must list this package as not depending on it.
      const re = new RegExp(`${name}[^.]*do not depend|do not depend[^.]*${name}`);
      if (!re.test(note)) {
        problems.push(
          `${name}: has no ${CORE_DEP} dependency, but the README note does not list it under "do not depend".`,
        );
      } else {
        ok.push(`${name}: correctly listed as not depending on ${CORE_DEP}`);
      }
    }
  }

  // --- Check 2: declaration-level conformance ---
  if (core.present && core.range) {
    if (!declaresProtocol(pkgDir)) {
      problems.push(
        `${name}: depends on ${CORE_DEP} but no source declares protocol:"wc-bindable" + version:1.`,
      );
    } else {
      ok.push(`${name}: declares protocol:"wc-bindable" version:1`);
    }
  }
}

// --- Report ---
console.log("CSBC integrity check\n====================");
for (const line of ok) console.log("  ok   ", line);
for (const line of skipped) console.log("  skip ", line);
for (const line of problems) console.log("  FAIL ", line);

console.log("");
if (skipped.length === PACKAGES.length) {
  console.log(
    "No sibling packages found. Run from a checkout where the csbc-dev sibling\n" +
      "repositories sit next to arch/ to perform the full cross-repo check.",
  );
  process.exit(0);
}
if (problems.length) {
  console.error(`\n${problems.length} integrity problem(s). README is out of sync with the implementations.`);
  process.exit(1);
}
console.log(`All checks passed (${ok.length} assertions, ${skipped.length} skipped).`);
console.log(
  "\nNOTE: this verifies version disclosure + declaration-level conformance only.\n" +
    "Full L1/L2/L3 wire-vector conformance is deferred (ROADMAP P2-2): upstream\n" +
    "CONFORMANCE.md vectors are not vendored into this workspace.",
);
