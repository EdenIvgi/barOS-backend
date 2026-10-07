# Recipes leave the Bar Book

**Date:** 2026-10-07
**Status:** approved for planning

## What this is for

A bar's recipes currently live in two unrelated places. The Bar Book has a
`recipes` page: free-text lines inside the book's single JSON document. The
`/recipes` route has a real collection, a shared library, an ingredient
catalogue, and the one feature that justifies all of it — *what can I pour with
what is on the shelf tonight*.

A recipe written in the Bar Book cannot answer that question. Its ingredients are
prose, so nothing can match them against stock. The bar typed the recipe and got
the lesser half of the feature, with no sign that it had.

This change moves every recipe into the collection and leaves one place to look:
`/recipes`, showing the bar's own recipes and the global library together, told
apart by a filter.

### Success criteria

- No Bar Book holds recipes any more, and no recipe text or photo is lost moving.
- A migrated recipe counts toward "what can I make" wherever its ingredient lines
  could be matched to the catalogue.
- A line that could not be matched is still visible in the recipe, and never
  makes a drink look pourable.
- The bar can tell its own recipes from the global ones, and can copy a global
  one to edit it.

### Out of scope

- Any change to the shared library's content or to the ingredient catalogue.
- Recipe images are reference-counted in the Bar Book but **not** in the recipes
  collection. After this change, deleting a recipe leaks its image file. That is
  pre-existing for recipes created through `/recipes`, and this change widens its
  reach. It is written down in "Known gap" below, not fixed here.

## Decisions taken

| Question | Decision |
|---|---|
| Where the migration runs | Server side, inside `GET /api/barBook` (approach C) |
| Bar Book recipe photos | Carried over **and** displayed in `/recipes` |
| Editing a global recipe | A "copy to my recipes" button creates the bar's own version |

Approach C was chosen over a client-side migration because moving a bar's
recipes should not depend on a browser tab staying open between two writes, and
over a one-off script because a tenant nobody remembered to run it for would be
left holding a page the code no longer renders.

## Architecture

### The migration, inside `barBook.model.get()`

`get()` already migrates an older Bar Book schema on read and persists the
result. The recipe migration joins it, running after `migrateOldFormat` — which
can itself still produce a `recipes` page out of a very old document.

For each page of type `recipes`, for each item:

| Bar Book item | Recipe document |
|---|---|
| `title: {he, en}` | `title` unchanged |
| `imageUrl` | `imageUrl` unchanged |
| `instructions: [{he, en}, …]` | `instructions: {he: [...], en: [...]}` |
| `ingredients: [{he, en}, …]` free text | `ingredients: [{ingredientId, rawText, amount, unit, …}]` |
| `librarySlug` | `librarySlug` unchanged, so provenance survives |

Each free-text ingredient line goes through a new server-side parser (below).
The resulting recipes are written with `recipeModel.createMany`, which already
skips titles the bar holds — so a retried migration cannot duplicate.

**Order is load-bearing: insert first, then remove the page.** If the insert
fails, the page stays and the next read tries again. The reverse order could lose
recipes outright.

### The image-deletion trap

`barBookModel.save()` garbage-collects images: it diffs the image ids referenced
before and after a save and deletes the difference from storage.
`collectImageIds` counts recipe photos on `recipes` pages.

Removing the recipes page through `save()` would therefore **delete the very
photos this change promises to carry over** — the collection's copy of the URL
would survive and point at nothing.

The migration must drop the page with a direct `collection.updateOne`, the way
`get()` already persists `migrateOldFormat`, never through `save()`.

Once the page is gone this cannot recur: a later save sees no recipe ids on
either side of the diff. Only the transition is dangerous, so the fix is confined
to it.

`collectImageIds` keeps its `recipes` branch. For a book not yet migrated the
branch is still correct — those photos belong to the book alone, and a manager
who deletes the page before the migration runs should have them collected.

### The free-text ingredient parser

The catalogue's existing `parseLine` reads the library's terse format
(`gin 60`), not prose, and cannot be reused. A new function parses a human line:

```
"60 ml ג׳ין"  →  { ingredientId: 'gin', amount: 60, unit: 'ml', rawText: 'ג׳ין' }
"סילאן"       →  { ingredientId: '',    amount: null, unit: 'ml', rawText: 'סילאן' }
```

Take the first number as the amount, a recognised unit token as the unit, and
whatever remains as the name; resolve the name through `catalog.match`, which
already does alias and word-boundary matching.

The frontend's spreadsheet importer does exactly this today in
`RecipeImportModal.rowsToRecipes`. The logic moves to the catalogue service so
both callers share one definition of how a written measure is read.

An unmatched line keeps `rawText` with an empty `ingredientId`. `withDerived`
already keeps such lines out of `requiredIds`, so they cannot make a drink look
pourable — and the recipe still shows what the bar wrote.

### `/recipes` gains what the Bar Book had

- **Scope chips — all / mine / global.** The API already accepts
  `scope=bar|library`, every recipe already carries `source`, and the page's
  filter state already sends it. Only the chip row is missing.
- **Photos.** Thumbnail in the list, full image on the detail, upload in the
  editor, reusing `ImagePicker` and the `/api/image` store.
- **Copy to my recipes.** On a global recipe, creates a bar-owned copy
  (`librarySlug` retained) and opens it for editing. This replaces the
  "add to the Bar Book" button added earlier in this work.

### Removed

`recipes` page format · `RecipesView.jsx` · `LibraryPickerModal.jsx` and its
Bar Book entry point. The Bar Book is left with six formats, none of which
decides in advance what the page is about.

## Error handling

| Case | Behaviour |
|---|---|
| Insert fails mid-migration | Page is kept; the next read retries. `createMany` dedupes, so nothing doubles. |
| A recipe has no title | Skipped, and logged. A recipe nobody named cannot be found again anyway. |
| No ingredient line matches | Recipe is saved with all lines as `rawText`. It is readable; it never shows as pourable. |
| Book has no recipes page | Nothing runs, nothing is written, `updatedAt` is untouched. |

## Testing

There is no test runner in either repo, so verification is a scripted run
against a disposable demo tenant, with the database inspected before and after.

1. Seed a demo tenant, then write a Bar Book recipes page holding four recipes:
   one whose lines all match the catalogue, one with a line that matches nothing,
   one carrying an uploaded `/api/image/<id>` photo, and one with no title.
2. `GET /api/barBook` once. Assert: the page is gone; **three** recipes exist in
   the collection, the untitled one having been skipped; the photo's id still
   resolves through `/api/image`; the unmatched line is present as `rawText` and
   absent from `requiredIds`.
3. `GET /api/barBook` a second time. Assert the recipe count has not changed.
4. In the browser: the scope chips filter; a thumbnail renders; "copy to my
   recipes" produces an editable copy; the migrated recipe appears under
   "can make" when its ingredients are in stock.
5. Drop the demo tenant.

## Known gap

A recipe deleted from `/recipes` leaves its uploaded image in storage. The Bar
Book reference-counts images; the recipes collection does not. This predates the
change and is not fixed here, but every recipe photo in the system passes through
that collection afterwards, so the leak's reach grows. Worth its own task.
