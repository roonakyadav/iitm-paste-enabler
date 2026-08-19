Continue from the completed timetable ingestion and matching work.

## Critical Git rule

This repository is my fork:

`https://github.com/roonakyadav/Scaler-extension`

Before EVERY commit or push:

```bash
git remote -v
```

Verify the push target is my fork.

NEVER:

* push to `Ritesh381/Scaler-extension`
* create a pull request
* create an issue
* contribute upstream

And again:

**Commit + push after EVERY meaningful completed change.**

Do NOT wait until this entire prompt is finished.

For each meaningful change:

1. implement it
2. run the relevant tests
3. inspect `git diff`
4. commit with a focused commit message
5. push immediately
6. continue

Do not leave a long uncommitted chain of unrelated changes.

---

# Goal

We now need to solve the biggest technical problem discovered so far:

The actual Scaler timetable is a **visually structured spreadsheet**, not a flat database.

The timetable can contain:

* weekday columns
* group sections
* vertically merged class cells
* horizontally merged cells
* blocks spanning multiple 15-minute intervals
* lunch blocks
* classroom names embedded inside blocks
* multiple courses/groups on the same day
* different colors/backgrounds
* blank cells
* headers

The current CSV parser is intentionally flat and therefore cannot reconstruct the actual timetable correctly.

DO NOT proceed to popup/UI work yet.

The goal of this prompt is:

> Given a real Google Sheet URL for the Scaler timetable, automatically extract the timetable structure into our existing normalized timetable schema.

---

# 1. Inspect the existing implementation before modifying it

Read:

* `extension-main/content/classroom/timetableUrl.js`
* `timetableFetcher.js`
* `timetableParser.js`
* `timetableNormalizer.js`
* `timetableValidator.js`
* `timetableSchema.js`
* `scalerClassNormalizer.js`
* `timetableMatcher.js`
* related tests
* `docs/CLASSROOM_FEATURE_PLAN.md`

Understand the current data flow.

Do NOT throw away the current CSV parser.

We want multiple source adapters.

The architecture should eventually look approximately like:

```text
Google Sheets URL
        ↓
Source detection
        ↓
CSV / HTML / future source adapter
        ↓
raw timetable representation
        ↓
normalized timetable entries
        ↓
validator
        ↓
matcher
```

---

# 2. Determine whether HTML export preserves the needed structure

Investigate the Google Sheets HTML/export representation thoroughly.

The previous implementation already discovered that CSV loses merged-cell information.

Now determine whether an HTML representation provides enough information to reconstruct:

* rows
* columns
* cell text
* `rowspan`
* `colspan`
* table structure
* weekday headings
* time-axis position

Do not assume HTML works. Verify it from actual output.

Search the existing repository first for any relevant HTML/table parsing code or dependencies.

Avoid adding a large dependency unless necessary.

Prefer native DOM parsing or an existing dependency already present.

---

# 3. Build an HTML source adapter

Create a dedicated module.

For example:

`extension-main/content/classroom/timetableHtmlParser.js`

or a structure consistent with the current classroom module.

It should accept HTML and produce a structured grid representation.

For example:

```js
{
  rows: [
    {
      index: 0,
      cells: [...]
    }
  ],
  metadata: {
    source: "google-sheets-html"
  }
}
```

Each cell should preserve useful structural information.

For example:

```js
{
  row: 5,
  column: 7,
  text: "MERN - 2029\nGrp B\nClassroom A\n1st floor",
  rowSpan: 4,
  colSpan: 1
}
```

The exact schema can differ, but it MUST preserve merged-cell geometry.

Do not immediately convert it into class entries.

First build a reliable structural representation.

---

# 4. Reconstruct the logical grid

HTML tables with `rowspan`/`colspan` cannot simply be processed as:

```js
for each tr
  for each td
```

because a merged cell affects multiple logical positions.

Implement a logical-grid reconstruction step.

For example, conceptually:

```text
Raw HTML

row 10:
[time] [Monday class rowspan=4] [Tuesday ...]

row 11:
[11:00] [occupied by Monday class] [Tuesday ...]

row 12:
[11:15] [occupied by Monday class] [Tuesday ...]

row 13:
[11:30] [occupied by Monday class] [Tuesday ...]
```

must become:

```text
Logical Grid

           Monday class
10:00      MERN
10:15      MERN
10:30      MERN
11:00      MERN
```

while still retaining the fact that it is ONE original merged class block.

Do not create duplicate class entries from the duplicated logical positions.

---

# 5. Infer the timetable axes

We need to identify:

### Time axis

Find the column containing the timetable times.

Typical values may resemble:

```text
9:15 - 9:30 AM
9:30 - 9:45 AM
9:45 - 10:00 AM
...
```

Do NOT hardcode only one exact format.

Support:

* 12-hour AM/PM
* 24-hour
* spaces around `-`
* different capitalization
* different time ranges

Normalize them into:

```js
{
  startTime: "09:15",
  endTime: "09:30"
}
```

### Day columns

Identify weekday headers:

* Monday
* Tuesday
* Wednesday
* Thursday
* Friday
* Saturday
* Sunday if present

Do not assume they always start at the same column.

### Group sections

The actual sheet may have multiple large sections such as:

```text
2029 Batch Group B
2029 Batch Group C
```

or equivalent wording.

Detect these structural headers when possible and retain them as context.

---

# 6. Handle merged class blocks correctly

This is the core of this prompt.

Suppose an HTML cell visually spans:

```text
10:00
10:15
10:30
10:45
11:00
```

and contains:

```text
MERN - 2029
Grp B
(Mrinal)
Classroom B
1st floor
```

The parser should produce ONE entry:

```js
{
  dayOfWeek: "Monday",
  startTime: "10:00",
  endTime: "11:15",
  batch: "grp b",
  course: "mern",
  teacher: "Mrinal",
  classroom: "Classroom B, 1st floor"
}
```

Do NOT produce five entries.

The end time must be inferred from the covered timetable slots.

If exact duration cannot be confidently reconstructed, retain enough raw metadata to diagnose the problem rather than guessing.

---

# 7. Parse class-block text

Create a parser that receives the complete text of a timetable cell and extracts whatever is confidently available.

It should attempt to identify:

### Course

Examples:

```text
MERN - 2029
CML - 2029
CN - 2029
FDSA
```

Do not hardcode only these names.

Reuse the existing course extraction logic where possible.

### Group

Examples:

```text
Grp B
Group C
Batch A
```

Reuse the existing group normalization utilities.

### Teacher

The teacher may appear:

* in parentheses
* on a separate line
* with a title
* without a title

Examples:

```text
(Mrinal)
Mrinal
(Chitwan)
(Utkarsh Gupta)
```

Extract only when confidence is reasonable.

Do not treat arbitrary text as a teacher.

### Classroom

Examples:

```text
Classroom A 1st floor
Classroom B 1st floor
Class C 2nd floor
```

The exact naming may vary.

Do NOT rely on one fixed regex such as only `Classroom [A-Z]`.

Make classroom extraction reasonably generic.

---

# 8. Ignore non-class blocks

The parser must not generate class entries for:

* Lunch
* blank cells
* headers
* batch labels
* weekday labels
* time labels
* decorative cells
* notes

For example:

```text
Lunch
```

should either be:

* represented internally as `type: "lunch"`
* or ignored if the normalized timetable only needs classes

Do not let lunch become a classroom assignment.

---

# 9. Build a real timetable fixture

Create at least one realistic HTML fixture representing the structure we actually care about.

For example:

`tests/fixtures/classroom/scaler-weekly-timetable.html`

It should include:

* time column
* Monday-Saturday
* at least two group sections
* rowspan class blocks
* lunch
* multiple courses
* multiple classrooms
* teacher names
* blank cells

Make the fixture structurally realistic rather than merely creating a tiny generic HTML table.

The purpose is to reproduce the exact types of problems in the real timetable.

---

# 10. Add parser tests

Create:

`tests/timetableHtmlParser.test.js`

Test:

### HTML structure

* basic table
* rowspan
* colspan
* nested markup
* empty cells

### Grid reconstruction

* merged cells occupy correct logical positions
* no duplicate class entries
* correct row/column placement

### Time parsing

* 12-hour
* 24-hour
* spacing variations

### Class extraction

* MERN
* CML
* CN
* arbitrary course names
* group extraction
* teacher extraction
* classroom extraction

### Block duration

Verify a merged class spanning N timetable slots becomes ONE entry with the correct start/end time.

### Lunch

Ensure lunch does not become a class.

### Missing data

Ensure the parser keeps unknown values as `null` instead of inventing them.

---

# 11. Integrate with the existing source adapter

Do NOT create a second unrelated timetable pipeline.

The existing architecture should eventually support something like:

```js
const source = await fetchTimetableSource(config);

const parsed =
  source.type === "html"
    ? parseTimetableHTML(source.data)
    : parseTimetableCSV(source.data);

const normalized = normalizeTimetable(parsed);
const validation = validateTimetable(normalized);
```

Use the smallest clean abstraction that fits the current codebase.

Do not over-engineer this.

---

# 12. Source selection strategy

Update the fetch layer so it can attempt:

### Preferred

HTML representation when the timetable requires merged-cell structure.

### Fallback

CSV representation for genuinely flat timetables.

The parser should not pretend CSV can reconstruct information that it fundamentally does not contain.

If HTML export is unavailable, produce a clear machine-readable failure such as:

```js
{
  code: "STRUCTURED_TIMETABLE_SOURCE_UNAVAILABLE",
  message: "The timetable requires merged-cell structure that the available source does not preserve."
}
```

Do not silently return incorrect classroom data.

---

# 13. Test against a real timetable

This is important.

The user provided a real Scaler timetable example in this project.

Use a real exported representation if it can be obtained through the supplied Google Sheet URL or an available test/export path.

Do NOT put private credentials or personal authentication data into the repository.

If the real sheet cannot be fetched in the development environment:

* document exactly why
* construct the fixture from the observed real structure
* make the parser architecture ready for the real export

Do not claim real-sheet compatibility unless it was actually tested.

---

# 14. Preserve the existing flat parser

Do not delete the existing CSV functionality.

Flat timetables may still exist.

The code should support both:

```text
flat CSV timetable
```

and:

```text
structured HTML timetable
```

using the same normalized schema.

---

# 15. Add diagnostic/debug output

During development, provide a way to inspect the parsed representation.

For example:

```js
{
  sourceType: "google-sheets-html",
  rows: 42,
  columns: 15,
  classBlocksDetected: 18,
  lunchBlocksDetected: 5,
  entries: [...]
}
```

This can be returned from the parser or exposed through test utilities.

Do NOT permanently spam the production console.

---

# 16. Update documentation

Update:

`docs/CLASSROOM_FEATURE_PLAN.md`

Document:

* HTML export findings
* merged-cell handling
* logical-grid reconstruction
* how time spans are inferred
* how classroom text is extracted
* CSV vs HTML behavior
* source selection strategy
* known limitations
* whether real timetable testing succeeded

Correct any old statements that are now inaccurate.

---

# 17. Regression testing

After implementation, run:

* all timetable parser tests
* all URL tests
* all validator tests
* Scaler class normalizer tests
* timetable matcher tests
* all relevant existing repository tests

The classroom changes must not break unrelated extension functionality.

If an existing test fails, determine whether:

* your code introduced a regression
* the test was already broken

Do not simply modify unrelated tests to make the suite green.

---

# 18. Git commits

Again, **commit after EVERY meaningful change**.

A sensible sequence could be:

```text
feat: add timetable HTML structural parser
feat: reconstruct merged timetable grid
feat: parse structured timetable class blocks
test: add realistic Scaler timetable fixtures
feat: support HTML timetable source selection
test: add HTML timetable regression coverage
docs: document structured timetable parsing
```

This is an example, not a requirement to create exactly these commits.

Every meaningful commit must be:

* tested
* reviewed with `git diff`
* focused
* pushed immediately to my fork

At the end verify:

```bash
git status
git remote -v
git log --oneline -n 10
```

The working tree should be clean and the branch should be synchronized with:

`roonakyadav/Scaler-extension`

---

# Final report

When finished, report:

1. What source format actually worked.
2. Whether merged cells can now be reconstructed.
3. How many realistic fixture cases are covered.
4. Total tests passing.
5. Every commit made in this prompt.
6. Commit hashes.
7. Whether every commit was pushed successfully.
8. Any remaining limitation that could cause wrong classroom information.

Do NOT implement popup configuration or classroom card UI yet.

The next stage will integrate this reliable timetable pipeline with the existing Scaler class-card lifecycle.
