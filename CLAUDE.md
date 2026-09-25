# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

`csbc-dev/arch` (npm name `csbc-arch`, private; formerly "hawc") is the **documentation hub** of the CSBC (Core/Shell Bindable Component) architecture. It ships no package. It holds:

- `README.md` — the canonical architecture document (English). Every other artifact exists to keep it truthful.
- `ROADMAP.md` — strategic positioning and the P0/P1/P2 improvement plan, with dated status blockquotes.
- `docs/third-party-async-candidates.md` — candidate analysis for future reference implementations (Japanese).
- `scripts/check-integrity.mjs` — a zero-dependency Node script that checks the README against the eight sibling implementation repos.

The eight reference implementations (`ai-agent`, `ami-voice`, `auth0`, `feature-flags`, `lambda`, `s3-uploader`, `stripe`, `webauthn`) are **separate git repositories** that sit next to this one as `../<name>`. The upstream protocol (`wc-bindable-protocol`) is an external repository and is not vendored here.

## Commands

No `npm install` is needed. The script uses Node built-ins only.

```bash
npm test                          # same as: node scripts/check-integrity.mjs
README_PATH=/path/to/mutated.md node scripts/check-integrity.mjs   # negative drift test against a modified copy
```

Exit codes: `0` means all checks passed, **or** no sibling repos were found (that is not a pass: nothing was verified). `1` means the README drifted from the implementations. `2` means the README file was not found.

A meaningful run requires the sibling repos to be checked out next to `arch/`. In `.github/workflows/integrity.yml` the sibling checkouts are **commented out**, so CI on this repo alone only runs the vacuous "no siblings found" path. The authoritative run is local, in the `csbc-dev/` workspace layout.

## How the integrity check couples to the README

`check-integrity.mjs` parses README prose, so some text in the README is load-bearing.

- **Check 1 (version note):** the script finds the paragraph that begins with `Honest note on versions` and reads until the first blank line. For every sibling that depends on `@wc-bindable/core`, the literal range string from its `package.json` (for example `^0.7.0`) must appear in that paragraph. For every sibling without the dependency, its name and `do not depend` must appear in the same sentence (regex `name[^.]*do not depend`). Keep the note as a single blockquote paragraph and keep that wording, or update the script along with it.
- **Check 2 (declaration conformance):** every sibling that depends on the core must contain `protocol: "wc-bindable"` and `version: 1` somewhere under `src/`. This is intentionally *declaration-level only*. Full L1/L2/L3 wire-vector conformance is deferred (ROADMAP P2-2) because the upstream `CONFORMANCE.md` vectors are not vendored. Do not add a check that pretends to cover it.
- The package list is hard-coded (`PACKAGES`). **Adding a reference implementation** means updating, together:
  - `PACKAGES`
  - the README "Reference implementations" table
  - the README version note
  - the commented checkout list in `integrity.yml`

  New implementations should start on `@wc-bindable/core ^0.8.0`, so the version spread does not grow (candidates doc §4).

## Editing rules for the documents

These come from ROADMAP §0 and apply to every change.

- **Positioning:** CSBC is a *reference-architecture showcase*, not a bid for adoption. The value function is `completeness × persuasiveness × intellectual honesty`. The main risk being managed is a README claim that can be **falsified by reading the code it describes**.
- **Verify before claiming.** Before you write or change any statement about an implementation (Case classification, Shell behavior, line counts, dependency versions, resumability), check it against the sibling repo's actual code. Use measured numbers, not estimates. For example, the Case C Shell size is stated as a measured value, not as "~800 lines".
- **Prefer honest disclosure to hiding or overclaiming.** Several gaps are disclosed deliberately rather than fixed:
  - the three-generation `@wc-bindable/core` spread
  - the single-author bus factor
  - Svelte/Solid being argued from adapter thinness rather than shown with runnable examples
  - the missing conformance vectors
  - `lambda` being unclassified

  Keep them disclosed. Soften a claim rather than stretch the evidence.
- **The Core/Shell invariant was deliberately refined** (ROADMAP P0-2). The rule is: *the Core owns every **authority** decision (authority, identity, policy, signing); the Shell owns only execution it cannot delegate, including the execution-local decisions that execution carries.* Do not regress it to "the Core makes every decision". The flagship Case C Shells (`s3-uploader` retry and 403 interpretation, `stripe` error provenance) would falsify that.
- **Resumability is a domain-dependent option, not a Case C invariant** (P0-1). Only abortability is required.
- **Out of scope by the intent filter** (do not add unless the strategic intent changes): adoption on-ramps and scaffolding, GOVERNANCE or co-maintainer machinery, standardization tracks, component registries and compatibility matrices.
- New-implementation candidates are judged by one question: does the implementation turn a prose-only claim in the README into a running demonstration? Popularity is not the criterion. Record the evaluation in `docs/third-party-async-candidates.md`.
- The README header stamp ("last reconciled against the spec on YYYY-MM-DD") records the last sync with upstream `wc-bindable-protocol`. Update it only when you actually re-reconcile.
- The `README.md:NNN` line references inside ROADMAP items describe the README as it was when each finding was made. They are historical and do not need to track current line numbers.

## Cross-repo propagation (not machine-checked)

Each sibling repo's `CLAUDE.md` contains a **hand-copied summary of this README** (its §1 wc-bindable-protocol overview and §2 CSBC architecture overview). The integrity script does not check these copies. When you change a central claim here, the sibling summaries go stale silently. As of 2026-09-26, seven of the eight sibling `CLAUDE.md` files still state the pre-P0-2 invariant "The Core owns every decision." After changing core claims in this README, point out the propagation. Edit sibling repos only when asked; each sibling has its own `CLAUDE.md` rules.
