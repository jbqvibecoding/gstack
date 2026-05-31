import type { TemplateContext } from './types';
import { generateInvokeSkill } from './composition';

/**
 * {{HERMES_PIPELINE}} — the scenario-aware "think-before-you-build" flow for the
 * Hermes host. Composes gstack's existing skills (office-hours + the plan-review
 * skills) so each persona has a single source of truth, and runs the right DEPTH
 * of review for the detected scenario:
 *
 *   task   — office-hours -> plan-ceo-review
 *   design — office-hours -> plan-ceo-review -> plan-design-review
 *   code   — office-hours -> plan-ceo-review -> plan-design-review -> plan-eng-review
 *
 * Sub-skills are pulled in via {{INVOKE_SKILL}}-style prose (read the SKILL.md from
 * disk and follow it), the same composition convention /autoplan uses. The parent
 * supplies base-branch detection ({{BASE_BRANCH_DETECT}} in the template), which is
 * why the invoked skills skip their own Step 0.
 */
export function generateHermesPipeline(ctx: TemplateContext): string {
  const root = ctx.paths.skillRoot;
  const officeHours = generateInvokeSkill(ctx, ['office-hours']);
  const ceoReview = generateInvokeSkill(ctx, ['plan-ceo-review']);
  const designReview = generateInvokeSkill(ctx, ['plan-design-review']);
  const engReview = generateInvokeSkill(ctx, ['plan-eng-review']);

  return `/hermes-taskplanthink runs the right *depth* of up-front thinking for the work in
front of you, then hands you one consolidated brief. It reuses gstack's existing skills —
office-hours for framing, then the plan-review personas (CEO, designer, eng manager) — so
there is a single source of truth for each role. Nothing here writes code; the output is a
reviewed plan you decide to act on.

## Philosophy — ETHOS

This flow is grounded in \`${root}/ETHOS.md\`. Read it if you have not.

- **Boil the Lake** — match effort to the work. A throwaway task does not need an
  architecture review; a code change does. The scenario in Step 1 sets the depth.
- **Search Before Building** — office-hours and the CEO round exist to find the *right*
  problem and the 10-star direction before anyone locks architecture.
- **User Sovereignty** — every round ends in recommendations, never unilateral action.
  You decide. The skill surfaces tradeoffs and waits.

## Step 1 — Detect the scenario (auto, overridable)

Classify the request into exactly ONE scenario. Infer it, state your reasoning in one
line, and proceed. When the signal is mixed or weak, confirm with the user via
AskUserQuestion before continuing — the scenario sets how many review rounds run.

1. **code** — the request changes source code: a new feature, a bug fix, a refactor,
   anything that ends in a diff. Signals: file / function / class names, "implement",
   "fix", "refactor", "add ... to the codebase", a stack trace, a failing test.
2. **design** — the request is about UI, interaction, or visual / design-system work and
   will not itself produce production code yet. Signals: screen / component / layout /
   flow / spacing / color / copy, "how should this look", "design the ...".
3. **task** — everything else: research, ops, planning, writing, one-off investigation.
   This is the default when neither code nor design clearly fits.

Announce: \`Scenario: <code|design|task> — <one-line why>.\`

## Step 2 — Frame the problem with office-hours (always)

Run office-hours first, for every scenario. It pressure-tests what you are actually
trying to do and produces a short design brief you carry into the review rounds.

${officeHours}

Hold onto the office-hours brief — the chosen direction and the open questions. You will
feed it into the first review round below.

## Step 3 — Review at the right depth

Run the rounds for the detected scenario, in order. Feed the office-hours brief into the
first round, and each round's findings into the next so the reviews build on each other.

**Every scenario — Round 1: CEO / founder.** Rethink the problem from first principles
and hunt for the 10-star direction.

${ceoReview}

1. If the scenario is **task**: stop after Round 1. Go to Step 4.
2. If the scenario is **design** or **code** — **Round 2: senior designer.** Interaction
   and visual review, scored 0-10.

${designReview}

   If the scenario is **design**: stop after Round 2. Go to Step 4.
3. If the scenario is **code** — **Round 3: engineering manager.** Lock the architecture,
   data flow, and edge cases.

${engReview}

## Step 4 — Consolidate

Produce ONE brief, not three separate dumps. Include only the sections that ran:

- **Direction** — the problem and the chosen approach (from office-hours + the CEO round).
- **Design verdict** — the 0-10 score and the must-fix interaction gaps (design and code
  scenarios only; omit for task).
- **Architecture lock** — components, data flow, and the edge cases that must be handled
  (code scenario only; omit otherwise).
- **Open risks & decisions** — anything unresolved, framed as recommendations.

Close on the User Sovereignty rule: these are recommendations. Confirm the direction with
the user before any implementation begins.`;
}
