# CSBC Improvement Roadmap — Toward Reference-Architecture Demonstration

> Origin: synthesis of a four-perspective multi-agent review (implementation gap / adoption & DX / critical risk / ecosystem & governance), with a strategic-intent filter applied.
> Created: 2026-06-28 · Scope: `arch/README.md` and the sibling reference implementations (`@csbc-dev/*`).

---

## 0. Strategic Positioning (Decision)

- **Decision**: CSBC is positioned as a **reference-architecture showcase** — a demonstration of the design, not a bid for adoption.
- **Explicit non-goals**: acquiring third-party adopters, industry standardization, building out an ecosystem.
- **Consequence (value function)**: `completeness × persuasiveness × intellectual honesty`.
  The top priority is therefore to eliminate any state in which the canonical document (`arch/README.md`) **can be falsified simply by reading the code it describes**.
  Adoption on-ramps (scaffolding / authoring tutorials), governance machinery (GOVERNANCE / co-maintainers / neutral org), standardization tracks (W3C/WICG/RFC), and registries are **out of scope for this plan** (rationale at the end of §2).

This decision means: of the two root causes surfaced by the review, **concentrate investment on Root A (absence of a single source of truth), and treat Root B (bus factor 1, governance gap) as a "known limitation of a demonstration project" to be disclosed honestly** rather than fixed.

---

## 1. Priority Re-Mapping (after applying the intent filter)

| Finding (four-perspective review) | Original severity | Priority under the showcase lens | Reason |
|---|:--:|:--:|---|
| False contracts / overclaims in the doc (recovery / "Core owns every decision" / line counts / OSS risk) | High | **P0** | Directly destroys the showcase's persuasiveness. Top priority. |
| Three-generation version drift + stale doc stamp | High | **P0** | "The first number in the doc is a lie" instantly erodes credibility. |
| Re-evaluation triggers miss competitor-erosion and own-camp risk | Medium | **P1** | Completeness of the "honest exit conditions" is core to intellectual honesty. |
| Zero linkage from arch → implementations (cannot exhibit the evidence) | Medium | **P1** | A demonstration only works once it can show "the real examples are right here." |
| Conformance / CI absent downstream | High | **P2** | "The claims are machine-verified" is a persuasion asset — but not a production-grade quality gate here. |
| Missing authoring on-ramp | High (adoption lens) | **Excluded** | Acquiring adopters is a non-goal. |
| Bus factor 1 / no governance / no neutrality | High (critical/governance) | **Excluded (disclosed as a limitation)** | Acquiring adopters is a non-goal. Handle by honest disclosure, not retreat. |
| Zero runnable Svelte/Solid examples | Medium (adoption lens) | **Folded into P1** | Evidence gap for the "all frameworks" claim. Fix by adding an example or softening the claim. |
| Standardization track / registry / compat matrix | Medium (governance) | **Excluded** | Adoption and standardization are non-goals. |

---

## 2. Execution Plan

### P0 — Document Integrity (no-regret, ready to start)

Close every spot where the doc "can be falsified by reading the code." Value does not drop under any strategic intent.

> **Status (2026-06-28): all P0 doc edits applied to `arch/README.md`.** Every claim below was re-verified against the actual code before editing. P0-5 took the "honest disclosure" path (the README now states the version spread); the optional follow-up of actually converging `@wc-bindable/core` ranges across the eight repos remains open.

- [x] **P0-1 Fix the recovery contract** — `README.md:206` asserts resumability as a Case C "designed property," yet the canonical `s3-uploader` implementation itself states "not resumable / out of core scope," while `stripe`'s 3DS resume *is* implemented.
  → Demote it: state that resumability is a **domain-dependent option, not a cross-Case C invariant**, and **honestly document the asymmetry between s3 (not implemented) and stripe (implemented)** as a taxonomy.
- [x] **P0-2 Refine "Core owns every decision"** — `README.md:201-202` asserts that "a Shell that signs its own URLs or runs its own authorization checks is a CSBC violation," yet the flagship `s3-uploader/src/components/S3.ts` Shell decides retry policy, 403 interpretation (expired signature vs. genuine denial), and re-sign threshold on its own, and `stripe/src/components/Stripe.ts` Shell decides error provenance (which side is authoritative).
  → **Refine the invariant to "execution-inherent local decisions may live in the Shell,"** and make explicit the line between `decisions about authorization/signing themselves` (must be Core) and `local decisions incidental to execution` (may be Shell). Do not leave the Case C gray zone ambiguous.
- [x] **P0-3 Replace claimed numbers with measured ones** — Correct the Shell "~800 lines" in `README.md:197` to measured values (`S3.ts` ≈ 1,172 lines / `S3Core.ts` ≈ 1,303 lines). The implication that "the Shell is thin" does not hold for Case C; withdraw it and note that thickness varies by Case.
- [x] **P0-4 Scope the "near-zero OSS dependency risk" claim** — `README.md:461-465`'s "extremely small / forkable" holds for the protocol kernel (`@wc-bindable/core` ≈ 325 lines) but not for `@wc-bindable/remote` (≈ 2,000 lines; `RemoteCoreProxy.js` alone ≈ 1,012 lines), which Cases B/C require.
  → **Limit "extremely small" to the kernel**, and honestly note that fork burden rises the moment Case B/C is chosen.
- [x] **P0-5 Version alignment** (doc disclosure done; range convergence optional follow-up) — The stamp in `README.md:3` (v0.7.1 / synced 2026-05-18) is out of sync with reality (consumer `@wc-bindable/core` spans three generations: 0.4.0 / 0.7.1 / 0.8.0).
  → Converge all packages' `@wc-bindable/*` onto one generation, **or** if convergence is hard, honestly explain the spread in the doc. Either way, update the stamp to match reality.

### P1 — Strengthening Narrative and Intellectual Honesty

The persuasive power of a reference architecture comes from honest disclosure of trade-offs.

> **Status (2026-06-28): all P1 doc edits applied to `arch/README.md`.** P1-3 took the "soften the claim" path (the README now states React/Vue are proven by runnable examples while Svelte/Solid are argued from adapter thinness); adding an actual Svelte/Solid example app remains an optional follow-up. The implementation catalog (P1-2) was verified against `package.json` names and npm publication before linking.

- [x] **P1-1 Expand the re-evaluation triggers** — The four triggers in `README.md:69-78` cover only external-platform changes. Add:
  - Competitor erosion: W3C Signals standardization / TanStack Query, Zustand, etc. exposing a framework-neutral subscription boundary on `EventTarget`/Signals / RSC and Server Functions pushing async out of the framework entirely and thinning the underlying demand.
  - (Optional) Own-camp risk: include "third-party implementations remaining at zero" as an evaluation axis for the demonstration project.
- [x] **P1-2 Bridge to the implementation catalog** — The Reference section in `README.md:493-498` points only to the upstream protocol; there is no link to any of the eight `@csbc-dev/*` reference implementations.
  → Add a **"implementations by Case" table** (package name / which Case / repository) to the Reference section, and link from each Case description to its real example — not as an adoption on-ramp, but as **exhibiting the evidence: "the real examples for the claims are here."**
- [x] **P1-3 Make the "all frameworks" claim honest** (softened in doc; runnable Svelte/Solid example optional follow-up) — `@wc-bindable/svelte`/`solid` appear in snippets but have no runnable examples (React/Vue have nine each).
  → Either add a Svelte example to at least one package as evidence, **or** honestly soften the claim to "proven on React/Vue; Svelte/Solid follow trivially from the thinness of the adapters (react ≈ 16 lines / vue ≈ 19 lines)." Pick one.
- [x] **P1-4 Disclose the limitation (bus factor)** — Disclose, in one or two honest lines in the README, the fact that the protocol, the concept, the document, and all eight implementations originate from a single author. **Frame it as a "known limitation of a demonstration project."** Precisely because adoption is not the goal, being able to state this honestly *adds* persuasive weight.

### P2 — Machine-Backed Evidence (lightweight)

The minimum automation needed to show "the claims are verified." No heavy quality gate required.

- [ ] **P2-1 Integrity CI** — Add a single CI check to the `arch` repo asserting "version stated in the doc == version resolved in each lockfile," to prevent the P0-5 drift from recurring.
- [ ] **P2-2 Machine-prove conformance** — Run the upstream L1/L2/L3 test vectors in at least one representative package's CI, upgrading "L2 conformant" from prose claim to machine verification.

### Out of Scope (excluded by the intent filter) + Reason

| Excluded item | Reason |
|---|---|
| Authoring scaffold / `create-csbc` / quickstart roll-out | Acquiring adopters is a non-goal. |
| GOVERNANCE.md / co-maintainers / org neutralization | Adoption and standardization are non-goals. Covered instead by P1-4's disclosure. |
| W3C/WICG/RFC standardization track | Same as above. |
| Component registry / public compatibility matrix | Building an ecosystem is a non-goal. |

> These are excluded not because they are worthless, but because they are **traceably excluded against the chosen strategic intent (reference-architecture demonstration)**. If the intent later shifts to "adoption / standardization," they are promoted back to P0/P1.

---

## 3. Suggested Sequencing

1. **Do P0 in a single pass** (all edits to `arch/README.md` plus some version alignment). The first milestone is to bring the document's falsifiability to zero.
2. Follow with P1 (narrative strengthening).
3. P2 is optional and can come later — only if you want to raise the demonstration's level of trust another notch.

Each P0/P1 item is checkboxed above. When starting, work through them in this order.
