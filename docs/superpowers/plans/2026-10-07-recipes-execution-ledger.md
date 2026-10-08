# SDD ledger — plan: docs/superpowers/plans/2026-10-07-recipes-out-of-the-bar-book.md

Spec: docs/superpowers/specs/2026-10-07-recipes-out-of-the-bar-book-design.md (read)

## Setup
Branch `recipes-out-of-barbook` created in BOTH repos.
  backend  base 7c18d3a
  frontend base f96c2d8

Ruling: branches, not git worktrees — what it costs if wrong: a worktree would
  give stronger isolation. Chosen because the frontend build writes its bundle to
  `../barApp-backend/public/` by relative path, and the two running preview servers
  are bound to these working directories; a worktree breaks both. Recoverable by
  deleting the branches.

## Pre-flight conflict scan

### Pairs sharing a file or interface
| Pair | Produces → Consumes | Found |
|---|---|---|
| T1 → T2 | `catalog.parseFreeText(line)` → migration calls it per ingredient line | OK — signature in T1 Interfaces matches T2 usage |
| T2 → T6 | migration removes every `recipes` page → T6 removes the renderer | OK — T2 runs first, so no book still needs the renderer |
| T4 ↔ T5 | both modify `src/cmps/recipes/RecipeDetail.jsx` | Line numbers in T5 (`:12,80-85`) shift once T4 inserts the image block. Indicative only, not addresses. |
| **T5 ↔ T6** | T5 deletes `recipeService.toBookRecipe`; `LibraryPickerModal.jsx:75` still calls it, and T6 is what deletes that modal | **CONFLICT** — running T5 before T6 leaves a live call to a deleted function |
| T5 ↔ T3 | both modify `RecipesPage.jsx` | OK — different regions (chips vs detail handler) |

### Per-task self-consistency
| Task | Found |
|---|---|
| T1 | OK — `createCatalog`, `SHARED_INGREDIENTS` exported; `UNIT_ALIASES` in closure scope at line 20; test expectations agree with the stated return shape |
| T2 | OK — script helpers (`seedBook`, `rawDoc`, `byTitle`) are named but undefined; implementer's to write, unambiguous |
| T3 | OK — `SCOPES` values match the API's `scope=bar\|library` plus `all` |
| T4 | OK — `_RecipesPage.scss` exists; `ImagePicker` signature matches |
| T5 | OK |
| T6 | OK — `defaultPageData`'s `recipes` case left unreachable, stated |

### Rulings

Ruling: execute order is **1, 2, 3, 4, 6, 5** — not plan order.
  Why: T6 deletes `LibraryPickerModal.jsx`, the only remaining caller of
  `toBookRecipe`, which T5 deletes. Plan order breaks the build between the two.
  Swapping them removes the consumer before the function. T6 depends only on T2,
  so nothing else moves.
  Cost if wrong: none identified — the two tasks are independent apart from this
  edge. If T6's review fails, T5 can still proceed; they touch disjoint files.

Ruling: the spec's "the logic moves to the catalogue service so both callers
  share one definition" is **not literally achievable** — the callers are in two
  separate repos (backend migration, frontend `RecipeImportModal.rowsToRecipes`),
  with no shared module, and routing spreadsheet import through the server would
  turn a free offline operation into a network round trip.
  Decision: the backend parser is the definition for server-side work, and T1 ALSO
  updates the frontend `rowsToRecipes` line parser to the same rules (Hebrew units,
  comma decimals) so behaviour matches even though the code cannot be shared.
  Cost if wrong: two parsers that can drift. Without this, they drift immediately —
  a spreadsheet import would read "2,5" as 2 while the migration reads 2.5.

## Task 1
BASE backend 7c18d3a / frontend f96c2d8
Implementer a6714f76a2119fe87 → DONE_WITH_CONCERNS, commits backend ebcb5b4, frontend c11138c
Review: spec ✅; quality NOT approved — 1 Important (unit-token lists diverge between
  repos: backend reuses UNIT_ALIASES incl. wedge/leaf/sprig/piece/slice/rim/pinch,
  frontend UNIT_TOKENS has only ml/cl/oz/g/dash/tsp/tbsp + 3 Hebrew. "1 wedge lime"
  parses differently in each.)

Ruling: fix the unit-list divergence (round 1); do NOT widen Task 1 to also align
  ingredient MATCHING (backend `match` normalises case/apostrophes, frontend uses exact
  lowercase lookup, so ג'ין vs ג״ין can differ). The matching gap predates this task and
  closing it means duplicating `normalise` into the frontend too.
  Cost if wrong: a spreadsheet import can still leave an ingredient unmatched that the
  migration would have matched. Visible to the user as an amber "unrecognised" chip they
  can answer inline — degraded, not wrong. Deferred to final review.

Task 1: minor (deferred): unit lookup uses plain-object indexing, so `constructor`/`toString` read as a unit (use Object.hasOwn or a Map)
Task 1: minor (deferred): a digit inside a name is taken as the amount — "7up 20 ml" → amount 7, name "up"; "1/2 oz lime" → amount 1, name "/2 lime"
Task 1: minor (deferred): punctuation-glued units not recognised ("60 ml. gin")
Task 1: minor (deferred): test gaps — straight-quote מ"ל, גרם, no-space "60ml", multiple numbers, first-unit-wins
Task 1: minor (deferred): test file uses 2-space indent against the backend's 4-space style (brief's own snippet did too)

Task 1: fix round 1/5 (1 addressed, 0 open — unit token lists now byte-identical, 15 Latin + 3 Hebrew; commits backend ebcb5b4..92916af, frontend c11138c..a56ab4e)

Ruling: re-reviewer called the fix "ADDRESSED in part" because the FRONTEND has no test
  for a non-volume unit. Not actionable: the frontend has no test runner at all
  (package.json has only dev/build/lint — no vitest, no jest). My fix instruction named
  the backend test file, and the implementer did exactly that. Counting it ADDRESSED.
  Cost if wrong: the frontend parser is covered by lint and manual browser checks only.

Task 1: minor (deferred): the frontend unit list is a hand-copied literal — a unit added to the backend later will silently desync again; no shared fixture or contract test exists
Task 1: minor (deferred): RecipeEditor.jsx:6 carries a THIRD copy of the unit list (matches today, same desync risk)
Task 1: complete (commits backend 7c18d3a..92916af, frontend f96c2d8..a56ab4e, review clean)

## Task 2
BASE backend 92916af. Implementer ad712e38a28809b8e → DONE, commit e147487
Review (opus): traps 1 and 2 both PASSED (traced, not trusted). Spec ❌ (skip-logging missing).
  Critical: duplicate-title data loss. 1 Important x3, minors.

Ruling: the plan is WRONG and the spec wins. My plan's own verification asserted
  `saved.length === 5` with "5 and 6 skipped" — i.e. it encoded the loss of a
  duplicate-titled recipe as expected. The spec says "no recipe text or photo is lost
  moving". Skipping a duplicate in the IMPORTER is fine (the user reviews it and can
  retry); skipping one in a MIGRATION is destruction, because the source is deleted
  immediately after. The migration must move every item.
  Fix: give each migrated recipe a provenance key (`migratedFrom` = the Bar Book item's
  _id, index fallback) and skip on THAT, not on title. Idempotent on retry AND loses
  nothing. The brief's `saved.length === 5` assertion becomes 6.
  Cost if wrong: a bar ends up with two same-named recipes where it had two same-named
  recipes. Strictly better than one of them being deleted.

Ruling: promoting the reviewer's Minor "script does not assert the photo survives storage"
  to Important. An assertion that would still pass if trap 1 had fired leaves the single
  biggest risk in this plan unverified. It must assert the blob is still retrievable.
  Cost if wrong: a few extra lines in a throwaway script.

Ruling: concurrency race (two simultaneous GETs double-insert) fixed with an in-process
  per-tenant in-flight promise, matching how barCatalog already caches per dbName.
  Not a unique index: that is a cross-tenant schema change, far heavier than the risk.
  Cost if wrong: a multi-process deployment could still race. The app runs single-process
  today; noting it rather than designing for a deployment that does not exist.

Task 2: minor (deferred): `getLangText` idiom inline in 4 places across the backend; worth extracting, not blocking
Task 2: fix round 1/5 (7 addressed, 2 new Important open — stale updatedAt on the old-format path; migratedFrom key collides as "undefined:N" across pages without _id; commits e147487..bd41608)
Task 2: minor (deferred): two racing reads each write their own Date.now(); the loser's stamp 409s on first save
Task 2: minor (deferred): verify script leaks an unread GridFS download stream
Task 2: fix round 2/5 (2 addressed, 0 open; commits bd41608..029c1c6)
Task 2: minor (deferred): doc comment at barBook.model.js:110-111 still says "pageId:index", stale after the key format changed
Task 2: minor (deferred): retry-stability edge — IF the page removal fails to persist AND the user then deletes an earlier page AND items lack _id, keys shift and those items re-insert as duplicates. Triple-conditional; no test.
Task 2: complete (commits 92916af..029c1c6, review clean)

## Tasks 3+4 (batched — both small, independent frontend UI additions)
BASE frontend a56ab4e
Implementer abd1b7a7ce56b5b47 → DONE, commits 0df0451 (T3), b6271b9 (T4)
Review: spec ✅ both briefs; quality APPROVED, minors only. Infinite-refetch trap explicitly
  checked and clear — deps still [filterBy, reloadToken], comment intact, no new effect.
Controller resolved the reviewer's one ⚠️ ("cannot verify the backend keeps imageUrl"):
  recipe.model.js withDerived spreads `...recipe` before `$set: doc`, so imageUrl persists.
  Not a gap.

Tasks 3+4: minor (deferred): a broken image URL leaves a blank 120px block in the card (no onError hide, no tint)
Tasks 3+4: minor (deferred): no aspect-ratio/min-height on .recipe-detail-image, so a slow image shifts modal layout
Tasks 3+4: minor (deferred): English copy inconsistency — scope chip says "Mine", the card tag says "Ours" (Hebrew is 'שלי' for both)
Tasks 3+4: minor (deferred): editor preview reuses .recipe-detail-image, coupling editor styling to the detail view
Tasks 3+4: complete (frontend a56ab4e..b6271b9, review clean)

## Task 6 (running BEFORE Task 5 — see preflight ruling)
BASE frontend b6271b9
Implementer a77cf06bc35254c3c → DONE, commit 60b4b35
Review: spec ✅; quality APPROVED with minors. Controller independently confirmed no stray
  RecipesView/LibraryPicker references remain in src/.

Ruling: PROMOTING the reviewer's Minor "legacy recipes page renders a silent blank panel"
  to Important. The reviewer dismissed it as unreachable because the migration removes such
  pages on read. That is wrong: the spec's error table says "Insert fails mid-migration →
  Page is kept; the next read retries" — so a surviving recipes page is a DESIGNED state,
  and in that window the manager sees an empty panel with no explanation of where their
  recipes went. Fixing with an explanatory fallback + link to /recipes.
  Cost if wrong: a few lines of UI and two i18n keys for a state that should be rare.

Ruling: NOT removing the orphaned SCSS the reviewer listed (.bar-book-recipes, .recipes-layout,
  .recipe-index-*, .recipe-form*, etc). It explicitly did not confirm which are shared with
  live components. Deleting a live rule on an unverified list is worse than dead CSS.
  Deferred to the final whole-branch review, which can verify usage properly.
  Cost if wrong: dead CSS ships in the bundle. Measured in bytes, not behaviour.

Task 6: minor (deferred): orphaned SCSS rules in _BarBookPage.scss (see review for the list; usage unverified)
Task 6: fix round 1/5 (1 addressed, 0 open; commits 60b4b35..55a9ea9)
Task 6: complete (frontend b6271b9..55a9ea9, review clean)

## Task 5 (running LAST — removes toBookRecipe, whose last caller T6 deleted)
BASE frontend 55a9ea9
Implementer a2c4780e380024d94 → DONE, commit b5594e4
Review: spec ✅ every point; dead-code removal independently verified clean.
  1 Important (failed copy blanks the page), 1 Minor-bordering-Important (duplicate copies),
  1 Minor (stale derived fields persisted).

Ruling: MY INSTRUCTION WAS WRONG. The brief and my dispatch both said to report copy failure
  through "the page's existing error state". That state is hasLoadError, which hides the whole
  list and says "cannot load recipes" — misreporting a failed write as a failed load, over a
  still-open modal, with no retry. A viewer-role user hits it every time (the route requires
  manager, so 403 renders as a load error). Correcting to showErrorMsg, which the old handler
  used and which is already imported.
  Cost if wrong: none identified; showErrorMsg is the established pattern in this file.

Ruling: promoting "duplicate copies" to Important. The old flow explicitly disabled an
  already-added recipe; losing that is a silent regression, and the clutter lands in the one
  list this whole project exists to make useful.
  Cost if wrong: a disabled button where the user wanted a second copy. They can still edit
  the first or write a new recipe.

Ruling: including the Minor "stale derived fields persisted" (canMake/missing/missingCount
  written into the stored document) in the same round, against the usual rule that minors do
  not enter the loop — it lives in the same five lines being edited and storing computed
  availability inside a recipe will mislead whoever reads that collection next.
  Cost if wrong: a few extra deletes in one object literal.
Task 5: fix round 1/5 (2 addressed, 1 partially — duplicate guard is advisory only; commits b5594e4..326e741)

Ruling: ACCEPTING the advisory duplicate guard rather than making it authoritative. It reads
  the loaded list, so it is blind when the "global only" chip is active, when a renamed copy
  falls out of the search query, or past the 200 limit. Closing it properly needs either a
  server-side uniqueness check on librarySlug or an extra unfiltered fetch of the bar's slugs
  on EVERY recipes page load, forever. The cost of the gap is a duplicate recipe the user can
  delete in two clicks; the cost of the fix is a permanent request on a hot path.
  Cost if wrong: a bar browsing "global only" can copy the same cocktail twice and see it
  listed twice under "mine".

Task 5: minor (deferred): duplicate-copy guard is advisory — blind under the global-only chip, a renamed copy vs an active search, and past the 200-recipe limit
Task 5: complete (frontend 55a9ea9..326e741, review clean)

## All six tasks complete. Final whole-branch review next.

## Final whole-branch review (opus): NOT mergeable — 1 Critical, 2 Important
FIX_BASE backend 029c1c6 / frontend 326e741
Critical: padded empty-string instruction arrays defeat the language fallback → blank numbered steps
Important: the "recipes have moved" panel I added in T6 invites deleting an UNMIGRATED page,
  which then GCs the photos and destroys the only copy of those recipes
Important: digit-inside-a-name parse mangles rawText ("7up 20 ml" → amount 7, text "up 20");
  reviewer overruled my "minor" because the migration DELETES the source, so the mangled text
  is the only surviving record

Ruling: ACCEPTING the reviewer's promotion of the digit-in-name parse from minor to Important.
  I deferred it in Task 1 when it only degraded an import the user reviews. It is not the same
  defect once the migration deletes the source.
  Cost if wrong: a stricter number match could miss an amount in some exotic line. Lower cost
  than silently rewriting a bar's recipe text.

Ruling: removing the orphaned SCSS after all — the final reviewer did the verification the
  earlier one declined to do, grepping every selector against src/**/*.jsx and naming the dead
  ranges. My earlier refusal was right on the evidence then available; the evidence has changed.
Final fix wave: all 6 findings ADDRESSED (backend ace39c6,78313e1,23d5d3b; frontend e2f5ff2,ce038ca,a279670,419c112)
Re-review verdict: MERGEABLE. Both fixer overreaches independently checked and justified.
Final: minor (deferred): RecipeEditor.jsx:23 prefill uses `||` on an empty array, so an English-UI
  user opening a Hebrew-only migrated recipe sees an empty steps box. No data loss (commitSteps
  preserves the other language). Same class as the Critical, left open in the editor.
  No second fix wave per process; surfacing to the user instead.
