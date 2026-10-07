# Recipes Leave The Bar Book — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every Bar Book recipe into the recipes collection, and leave `/recipes` as the single place a bar reads and writes recipes, its own and the global library's.

**Architecture:** A server-side migration inside `GET /api/barBook` parses each Bar Book recipe's free-text ingredient lines against the bar's catalogue, inserts the results through `recipeModel.createMany`, then drops the page with a direct `updateOne` — never through `barBookModel.save()`, whose image garbage collector would delete the photos being carried over. The `/recipes` page then gains the three things the Bar Book page had that it lacked: a scope filter, photos, and a way to adapt a global recipe.

**Tech Stack:** Node 22 ESM, Express, native MongoDB driver, `node --test` (built in, no new dependency), React 18, Vite, react-i18next.

**Spec:** `docs/superpowers/specs/2026-10-07-recipes-out-of-the-bar-book-design.md`

## Global Constraints

- No Hebrew in code comments, JSDoc, or commit messages — English only.
- Backend repo: `C:\barApp\barApp-backend`. Frontend repo: `C:\barApp\barApp-frontend`.
- Frontend lint gate is `--max-warnings 0`; the repo currently carries 10 pre-existing warnings, so `npm run lint` exits non-zero. The bar is **no new warnings and zero errors**, not a clean exit.
- Browser verification uses a disposable demo tenant, never the real account, and the tenant is dropped afterwards.
- Every unmatched ingredient line keeps its `rawText` and must stay out of `requiredIds`.
- The migration inserts before it removes. Never the reverse.

## Review Focus

Input classes the spec implies but which no task's main deliverable exercises. Each has a test pinned to the task that owns the code.

1. **A Bar Book item with no `ingredients` array at all** — an item saved before the field existed. Must migrate as a recipe with zero ingredient lines, not throw. *(Task 2)*
2. **An ingredient line written with a Hebrew unit** — `"60 מ״ל ג׳ין"`. The unit must be read as `ml`, not left on the name where it would break the catalogue match. *(Task 1)*
3. **A decimal written with a comma** — `"2,5 ml פרנו"`, how a Hebrew keyboard types it. Must parse as `2.5`, not `2`. *(Task 1)*
4. **Two Bar Book recipes with the same title** — `createMany` dedupes by normalised title, so the second is skipped; the migration must still drop the page rather than retrying forever. *(Task 2)*
5. **A recipe photo held as an external URL** rather than `/api/image/<id>` — must survive the move untouched and must not be treated as an owned upload. *(Task 2)*

---

### Task 1: Free-text ingredient parser

The catalogue's existing `parseLine` reads the library's terse `gin 60` format and cannot read prose. This adds a parser for a human-written line and makes it the single definition both the migration and the spreadsheet importer use.

**Files:**
- Modify: `C:\barApp\barApp-backend\services\ingredientCatalog.service.js` — add `parseFreeText` to the object `createCatalog` returns
- Test: `C:\barApp\barApp-backend\services\ingredientCatalog.test.mjs` (create)

**Interfaces:**
- Consumes: `createCatalog(ingredients)`, `SHARED_INGREDIENTS` from this same module; the existing `match(text)` and `normalise(text)` closures.
- Produces: `catalog.parseFreeText(line: string) => { ingredientId: string, rawText: string, amount: number|null, unit: string, isOptional: false, isGarnish: false } | null`. Returns `null` only for a blank line. `ingredientId` is `''` when nothing matched; `rawText` is always the ingredient name with the amount and unit stripped, falling back to the whole line if stripping leaves nothing.

- [ ] **Step 1: Write the failing tests**

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCatalog, SHARED_INGREDIENTS } from './ingredientCatalog.service.js'

const catalog = createCatalog(SHARED_INGREDIENTS)

test('reads an amount, a unit and a known ingredient', () => {
  assert.deepEqual(catalog.parseFreeText('60 ml gin'), {
    ingredientId: 'gin', rawText: 'gin', amount: 60, unit: 'ml',
    isOptional: false, isGarnish: false,
  })
})

test('reads a Hebrew unit as ml and keeps the name clean', () => {
  const line = catalog.parseFreeText('60 מ״ל ג׳ין')
  assert.equal(line.unit, 'ml')
  assert.equal(line.amount, 60)
  assert.equal(line.rawText, 'ג׳ין')
})

test('reads a decimal written with a comma', () => {
  assert.equal(catalog.parseFreeText('2,5 ml absinthe').amount, 2.5)
})

test('keeps an unmatched name as rawText with no ingredientId', () => {
  const line = catalog.parseFreeText('20 ml סילאן')
  assert.equal(line.ingredientId, '')
  assert.equal(line.rawText, 'סילאן')
  assert.equal(line.amount, 20)
})

test('handles a line with no amount', () => {
  const line = catalog.parseFreeText('gin')
  assert.equal(line.ingredientId, 'gin')
  assert.equal(line.amount, null)
  assert.equal(line.unit, 'ml')
})

test('returns null for a blank line', () => {
  assert.equal(catalog.parseFreeText('   '), null)
})

test('falls back to the whole line when stripping leaves nothing', () => {
  assert.equal(catalog.parseFreeText('60 ml').rawText, '60 ml')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd C:\barApp\barApp-backend && node --test services/ingredientCatalog.test.mjs`
Expected: FAIL — `catalog.parseFreeText is not a function`

- [ ] **Step 3: Implement `parseFreeText(line)` inside `createCatalog` in `services/ingredientCatalog.service.js`, and add it to the returned object**

Take the first number as the amount (normalise `,` to `.` before `Number`). Recognise the unit from both the ASCII tokens already in `UNIT_ALIASES` and the Hebrew forms `מ"ל`, `מ״ל`, `גרם`. Strip the amount and every unit token from the line; `catalog.match` the remainder for `ingredientId`. Default `unit` to `'ml'`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd C:\barApp\barApp-backend && node --test services/ingredientCatalog.test.mjs`
Expected: PASS, 7/7

- [ ] **Step 5: Commit**

```bash
cd C:\barApp\barApp-backend
git add services/ingredientCatalog.service.js services/ingredientCatalog.test.mjs
git commit -m "feat: read an ingredient line written in prose"
```

---

### Task 2: The Bar Book migration

**Files:**
- Modify: `C:\barApp\barApp-backend\api\barBook\barBook.model.js` — add `migrateRecipePages`, call it from `get()`
- Test: `C:\barApp\barApp-backend\scripts\verify-recipe-migration.mjs` (create)

**Interfaces:**
- Consumes: `catalog.parseFreeText` (Task 1); `recipeModel.createMany(list, dbName) => { added, skipped }`; `barCatalog.get(dbName)`.
- Produces: `migrateRecipePages(pages, dbName) => Promise<{ pages, changed }>`, called inside `get()` after `migrateOldFormat`. Returns the pages with every `recipes` page removed, and `changed: true` if any was.

**Shape conversion**, per Bar Book item:

| From | To |
|---|---|
| `title` | unchanged (an item with no title is skipped by `createMany`) |
| `imageUrl`, `librarySlug` | unchanged |
| `instructions: [{he,en}, …]` | `{ he: [...], en: [...] }` |
| `ingredients: [{he,en}, …]` | `catalog.parseFreeText(getLangText(line))` per line, nulls dropped |

- [ ] **Step 1: Write the failing verification script**

`scripts/verify-recipe-migration.mjs` seeds a Bar Book recipes page into a throwaway database, calls `barBookModel.get()` twice, and asserts with `node:assert/strict`:

```js
// Seeded page items, in order:
//  1 'מרגריטה'      ingredients ['60 ml tequila', '30 ml מיץ ליים'] — both match
//  2 'משהו חדש'      ingredients ['20 ml סילאן']                     — matches nothing
//  3 'עם תמונה'      imageUrl '/api/image/aaaaaaaaaaaaaaaaaaaaaaaa'
//  4 'עם קישור'      imageUrl 'https://example.com/x.jpg'
//  5 (no title)     ingredients ['10 ml gin']
//  6 'מרגריטה'      duplicate title
//  7 'בלי מצרכים'   no `ingredients` key at all

assert.equal(after.pages.filter(p => p.type === 'recipes').length, 0)
assert.equal(saved.length, 5)                                   // 5 and 6 skipped
assert.equal(byTitle('משהו חדש').ingredients[0].rawText, 'סילאן')
assert.equal(byTitle('משהו חדש').ingredients[0].ingredientId, '')
assert.deepEqual(byTitle('משהו חדש').requiredIds, [])
assert.ok(byTitle('מרגריטה').requiredIds.includes('tequila'))
assert.equal(byTitle('עם תמונה').imageUrl, '/api/image/aaaaaaaaaaaaaaaaaaaaaaaa')
assert.equal(byTitle('עם קישור').imageUrl, 'https://example.com/x.jpg')
assert.deepEqual(byTitle('בלי מצרכים').ingredients, [])
assert.equal(secondReadCount, 5)                                // re-reading adds nothing

// A book that never held recipes is not written to at all.
const untouched = await seedBook([{ _id: 'x', type: 'table', headers: [], rows: [] }])
const before = untouched.updatedAt
await barBookModel.get(dbName)
assert.equal((await rawDoc(dbName)).updatedAt, before)
```

It must drop its throwaway database in a `finally` block.

- [ ] **Step 2: Run it to verify it fails**

Run: `cd C:\barApp\barApp-backend && node scripts/verify-recipe-migration.mjs`
Expected: FAIL — the recipes page is still present and no recipes were written.

- [ ] **Step 3: Implement `migrateRecipePages(pages, dbName)` in `api/barBook/barBook.model.js`**

Insert through `recipeModel.createMany` **first**; only if it resolves, return the pages with `recipes` pages filtered out. If it rejects, return the pages unchanged with `changed: false`, so the next read retries.

- [ ] **Step 4: Call it from `get()`, persisting with a direct `updateOne`**

After the existing `migrateOldFormat` block. Persist with `collection.updateOne({ _id }, { $set: { pages, updatedAt: Date.now() } })`.

**Do not route this through `save()`.** `save()` diffs `collectImageIds` before and after and deletes the difference; removing the recipes page through it would delete the photos just migrated. Leave `collectImageIds`'s `recipes` branch in place — it is still correct for a book that has not been migrated yet.

- [ ] **Step 5: Run the script to verify it passes**

Run: `cd C:\barApp\barApp-backend && node scripts/verify-recipe-migration.mjs`
Expected: PASS, every assertion.

- [ ] **Step 6: Commit**

```bash
cd C:\barApp\barApp-backend
git add api/barBook/barBook.model.js scripts/verify-recipe-migration.mjs
git commit -m "feat: move Bar Book recipes into the recipe collection"
```

---

### Task 3: Scope chips on the recipes page

The API accepts `scope=bar|library`, every recipe carries `source`, and `filterBy.scope` is already in state and already sent. Only the chip row is missing.

**Files:**
- Modify: `C:\barApp\barApp-frontend\src\pages\RecipesPage.jsx` — add a `SCOPES` constant and a third chip row
- Modify: `C:\barApp\barApp-frontend\src\services\i18.js` — `recipesScope_all` / `_bar` / `_library`, and `recipesFilterScope`, in both `he` and `en`

**Interfaces:**
- Consumes: the existing `setFilter({ … })` helper and `filterBy.scope`.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Add `const SCOPES = ['all', 'bar', 'library']` beside `AVAILABILITY` and `KINDS`**

- [ ] **Step 2: Render a third `.recipes-chips` group**

Copy the shape of the `KINDS` group exactly: `aria-label={t('recipesFilterScope')}`, `aria-pressed`, `className={'chip' + (filterBy.scope === value ? ' is-on' : '')}`, label `t('recipesScope_' + value)`.

- [ ] **Step 3: Add the i18n keys**

Hebrew: `הכל` · `שלי` · `גלובלי`. English: `All` · `Mine` · `Global`.

- [ ] **Step 4: Verify in the browser**

Start a demo tenant, go to `/recipes`, click **שלי** and then **גלובלי**. Expected: the list narrows each time, and the network tab shows `scope=bar` then `scope=library`.

- [ ] **Step 5: Lint and commit**

Run `npm run lint`; expected: 0 errors and no more than the 10 pre-existing warnings.

```bash
cd C:\barApp\barApp-frontend
git add src/pages/RecipesPage.jsx src/services/i18.js
git commit -m "feat: filter recipes by whose they are"
```

---

### Task 4: Photos on the recipes page

**Files:**
- Modify: `C:\barApp\barApp-frontend\src\cmps\recipes\RecipeList.jsx` — thumbnail
- Modify: `C:\barApp\barApp-frontend\src\cmps\recipes\RecipeDetail.jsx` — full image
- Modify: `C:\barApp\barApp-frontend\src\cmps\recipes\RecipeEditor.jsx` — upload field
- Modify: `C:\barApp\barApp-frontend\src\assets\style\cmps\_RecipesPage.scss` — `.recipe-card-thumb`, `.recipe-detail-image`

**Interfaces:**
- Consumes: `ImagePicker({ value, onChange, className, label })` from `src/cmps/ImagePicker.jsx`; `recipe.imageUrl`.
- Produces: `RecipeEditor` now emits `imageUrl` on the recipe object it passes to `onChange`.

- [ ] **Step 1: Thumbnail in `RecipeList`**

Inside the card button, before `.recipe-card-head`: render `<img className="recipe-card-thumb" src={recipe.imageUrl} alt="" />` when `recipe.imageUrl` is set, and nothing at all when it is not — no placeholder box, so a list of mostly photo-less recipes does not become a grid of grey squares.

- [ ] **Step 2: Full image in `RecipeDetail`**

Below the `<header>`, when `recipe.imageUrl` is set.

- [ ] **Step 3: Upload field in `RecipeEditor`**

A `form-group` holding `<ImagePicker value={recipe.imageUrl || ''} onChange={url => setField({ imageUrl: url })} />`, with the current image previewed above it when set. Label `t('recipePhoto')` — the key already exists.

- [ ] **Step 4: Styles**

`.recipe-card-thumb`: fixed height, `object-fit: cover`, the card's own border radius. `.recipe-detail-image`: full width, capped height, `object-fit: cover`.

- [ ] **Step 5: Verify in the browser**

On a demo tenant: upload a photo to a recipe, save, reopen. Expected: thumbnail in the list, full image on the detail, and the image still there after a reload.

- [ ] **Step 6: Lint and commit**

```bash
cd C:\barApp\barApp-frontend
git add src/cmps/recipes src/assets/style/cmps/_RecipesPage.scss
git commit -m "feat: show a recipe's photograph"
```

---

### Task 5: Copy a global recipe to the bar's own

Replaces the "add to the Bar Book" button, and removes the two service functions behind it.

**Files:**
- Modify: `C:\barApp\barApp-frontend\src\cmps\recipes\RecipeDetail.jsx:12,80-85` — prop `onAddToBook` becomes `onCopyToMine`, shown only for a library recipe
- Modify: `C:\barApp\barApp-frontend\src\pages\RecipesPage.jsx:84-90,185-190` — replace the handler
- Modify: `C:\barApp\barApp-frontend\src\services\recipe.service.js:74-142` — delete `addToBarBook` and `toBookRecipe`, and `toSteps` if nothing else calls it
- Modify: `C:\barApp\barApp-frontend\src\services\i18.js` — `recipeCopyToMine`, `recipeCopied`

**Interfaces:**
- Consumes: `recipeService.save(recipe)`.
- Produces: `RecipeDetail` takes `onCopyToMine(recipe)` in place of `onAddToBook`.

- [ ] **Step 1: Swap the prop in `RecipeDetail`**

Render the button only when `recipe.source === 'library'` — a recipe the bar already owns has nothing to copy to. Label `t('recipeCopyToMine')`.

- [ ] **Step 2: Implement the handler in `RecipesPage`**

Strip `_id`, `slug`, `source` and `isLibrary` from the library recipe, keep `librarySlug: recipe.slug` so provenance survives, `recipeService.save(...)` it, close the detail, and bump `reloadToken` so the list refetches. Report failure through the page's existing error state, not an alert.

- [ ] **Step 3: Delete `addToBarBook` and `toBookRecipe` from `recipe.service.js`**

- [ ] **Step 4: Verify in the browser**

On a demo tenant: open a global recipe, press **העתק אליי**. Expected: it appears in the list tagged as the bar's own, the **שלי** chip includes it, and opening it offers edit rather than copy.

- [ ] **Step 5: Lint and commit**

```bash
cd C:\barApp\barApp-frontend
git add src/cmps/recipes src/pages/RecipesPage.jsx src/services/recipe.service.js src/services/i18.js
git commit -m "feat: copy a library recipe to make it the bar's own"
```

---

### Task 6: Remove the Bar Book recipes format

Runs last: until Task 2 is deployed, a book may still hold a recipes page that needs rendering.

**Files:**
- Modify: `C:\barApp\barApp-frontend\src\cmps\barbook\pageTypes.js` — mark `recipes` `isLegacy: true`
- Modify: `C:\barApp\barApp-frontend\src\pages\BarBookPage.jsx` — drop the import and the `activePage.type === 'recipes'` branch
- Delete: `C:\barApp\barApp-frontend\src\cmps\barbook\RecipesView.jsx`
- Delete: `C:\barApp\barApp-frontend\src\cmps\recipes\LibraryPickerModal.jsx`
- Modify: `C:\barApp\barApp-frontend\src\services\barBook.service.js` — leave `case 'recipes'` in `defaultPageData`, unreachable but harmless

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `ADDABLE_PAGE_TYPES` now has six entries.

- [ ] **Step 1: Mark the format legacy and remove the render branch**

Keep the `PAGE_TYPES` entry with `isLegacy: true` so `getPageType` still resolves a tab label for a book read before the migration ran.

- [ ] **Step 2: Delete `RecipesView.jsx` and `LibraryPickerModal.jsx`, and every import of them**

- [ ] **Step 3: Verify the add-page dialog**

On a demo tenant, open **הוסף עמוד**. Expected: six formats, no "מתכונים", and the first one selected by default.

- [ ] **Step 4: Verify a book that held recipes**

Seed a recipes page through the API, then load `/bar-book`. Expected: the tab is gone, and the recipes are in `/recipes` tagged as the bar's own.

- [ ] **Step 5: Lint, build, commit both repos**

```bash
cd C:\barApp\barApp-frontend && npm run lint && npm run build
git add -A && git commit -m "feat: the Bar Book no longer keeps recipes"
cd C:\barApp\barApp-backend && git add -A && git commit -m "chore: rebuild frontend bundle"
```

- [ ] **Step 6: Drop every demo tenant used in testing, and confirm none are left**
