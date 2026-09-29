# Better Life V3 implementation

Baseline: `9155c340108353e6cd25ce7e04c4fa5666cdd92d`.
Branch: `v3-smart-home`. This remains a framework-free, local-only GitHub Pages PWA.
No application runtime dependencies, backend, external API, or live AI calls were added.

## Files and architecture

- `index.html`: original CRUD, navigation, storage and modal architecture retained; V3 view integration and compatible migration hardening.
- `daily-state.js`: pure local-date, history, journey, project and Daily State derivations; available to browser and Node tests.
- `v3-ui.js`: Home, compact habits, full/individual habit journeys, project forms and details; delegates existing task/habit/goal/journal operations to their original forms.
- `v3.css`: shared navy, blue and restrained accent styling; readable scenic hero, cards, touch targets, direction-aware text and mobile layouts.
- `assets/daily-landscape.webp`, `assets/calm-sky.webp`: about 104 KiB total; CSS color/gradient fallback.
- `sw.js`: V10 cache, new shell files and optional image precache. Same-origin GET handling and existing immediate activation retained.
- `tests/derivations.cjs`, `tests/browser.cjs`, `tests/pwa-upgrade.cjs`: logic, migration, interaction, responsive and PWA regression coverage.

The bottom navigation is unchanged: Home, Tasks, Habits, Goals, More. Journal remains in More. Projects is available through Home and More.

## Data and migrations

The storage key remains `better-life-v2`; schema version is now 4. V1 fallback remains supported and its source key is not removed. Existing IDs and raw log entries are retained. Reading does not write a migration back; the next normal save persists the current schema.

Additions:

- `projects`: four approved identities, stable IDs, status, optional `manualProgress`, milestone, `taskIds`, `goalIds`. No activity or percentages are seeded.
- `journeyStartDate`: stored only when creating a new habit. Existing habits do not receive invented start dates.

Projects with an already-present collection retain that collection, including an intentionally empty one. The initial configuration is used only when the collection does not exist.

Compatibility hardening preserves extra life-area/category fields, supplies deterministic missing IDs, supports legacy task due/status/goal fields and older quantity/frequency conventions, and retains fractional quantity targets. Unknown root/record fields remain intact. Invalid JSON or a non-object saved root disables saving instead of replacing the original storage. Storage write failure displays an error.

## Daily State and modes

One `buildDailyState(db, now)` supplies Home and Habits. It derives local date/time, due/overdue tasks, priority-ranked next tasks, habit journeys, project state, latest check-in and weekly completion activity.

Mode precedence:

1. Calm: today's check-in explicitly indicates Calm/Recovery or low energy.
2. Reset: an unfinished habit period has a recent confirmed miss and no ongoing streak.
3. Achievement: at least one task/habit period exists and all today's tasks/current habit periods are met.
4. Review: evening, from 18:00.
5. Focus: substantial overdue work or a high-priority next task.
6. Execution: remaining tasks/habit actions; otherwise Focus.

Modes share the same stable section order. They vary copy, hero treatment, accents and habit emphasis. Focus reduces Home analytics; Execution puts unfinished habits first within the block; Calm/Reset soften metrics; Achievement highlights completed days subtly; Review emphasizes metrics. No mood or score is persisted.

Greetings use local time. A saved `settings.name`, if present, is respected. Morning/day/evening treatments and a deterministic two-copy rotation avoid runtime randomness. Calm/Reset select the local sky asset; other modes select the scenic asset. The clock refreshes on return and at time boundaries without replacing an open form.

## Habit Journey semantics

`logs[habitId + '-' + localDate]` remains the single history source. Yes/no uses the existing boolean completion behavior; quantity uses the current target. Historical target versions were never stored, so they cannot be reconstructed.

- New habits use their explicit start date. Elapsed scheduled daily days without completion may be marked missed.
- Existing habits use the earliest valid recorded log only as an explicitly labelled **earliest recorded history** anchor. Missing historical days remain unrecorded, even between logged days.
- An existing habit without history shows Ready to start, no claimed cycle day and no completion percentage. Its calendar is a preview beginning today; no start date is persisted.
- Fixed 30-day cycles are derived from the explicit/earliest-recorded anchor. Advancing a cycle never resets/deletes history.
- Consistency covers evaluable periods intersecting the last 30 calendar days. Future, unknown and open incomplete periods are excluded; the denominator is shown alongside the rate.
- Daily streaks extend through all contiguous available history, without a 14- or 30-day cap. Today's unfinished entry leaves yesterday's streak in place.
- Weekly adherence uses Monday–Sunday calendar weeks. A completed entry meets a week, matching the previous app's any-completed-entry interpretation; quantity is not silently changed to cumulative weekly volume. The current incomplete week stays open. A closed week is missed only when all its days are known scheduled/explicitly recorded. Partial/unknown legacy weeks remain unknown.
- Weekly day grids show actual completed entries; unlogged days are neutral, never daily failures. Weekly adherence is shown separately. Weekly streaks preserve the previous week while the current week is open.
- Future-dated log records remain stored but never count as completed activity before that date.

Mark-today and quantity entry reuse the existing actions. Undo remains available. Existing review/insight habit-period calculations now use the shared weekly grouping; saved review records are not rewritten.

## Projects

Initial configuration:

- `project-sports-center`: Children's Sports Center — Primary
- `project-gymiki`: Gymiki — Active
- `project-data-analysis`: Data Analysis — Active
- `project-investing`: Investing — Active

Explicit manual progress (including zero) takes precedence. Otherwise completion of explicitly linked existing tasks supplies the percentage. With no supported source, the UI says Progress not set and omits the bar/percentage. Linked goals are displayed as context with their own labelled manual progress; they are not silently averaged into project progress. Deleted task links are ignored in the denominator. Setting a project Primary demotes another Primary to Active. Better Life itself is not seeded as a project.

## Bilingual and mobile behavior

Names are escaped and isolated with `bdi dir=auto`. Name containers and text inputs use automatic direction; English statistic lines retain LTR direction. Arabic section labels have explicit language/direction. Dates and numeric ratios are kept separate from mixed-language names. Existing 16px inputs, safe-area padding, modal focus handling, backdrop dismissal, Escape and focus restoration are retained. Controls are at least 44px high; task tabs retain their intentional horizontal scrolling without page overflow.

## Verification performed

- 15 Node tests: raw-log/ID/extra-field preservation, deterministic and repeat migrations, V1 compatibility, fractional quantity, unknown/future history, 65/66-day streaks, weekly streaks/adherence, no weekly daily failures, new-start misses, cycle rollover, leap day/year arithmetic, project progress and all modes.
- Chromium and WebKit: existing-data reload, task creation/completion/recurrence, habit creation and tracking, quantity entry, individual journey modal, project linking/manual progress, goal/journal creation, finance income save, Life Area creation, review save, experience save and check-in save. All More sections render with populated fixture data.
- Actual element-bound checks at 320, 375, 390, 430 and 768 CSS pixels across Home, Tasks, Habits, Goals, Projects, More and Journal. Existing clipped task-tab contents are excluded from page-overflow checks.
- Mixed Arabic/English fixture names and screenshots inspected in both browsers.
- No uncaught JavaScript errors in the regression runs.
- Manifest standalone/start/icon configuration checked; icons and manifest preserved.
- New shell and both WebPs confirmed in cache; Chromium simulated-offline reload passed.
- V9-to-V10 activation and cache cleanup tested at `/Better-life/`, preserving old logs. Both Chromium and WebKit reload and navigate offline after the local server is stopped.
- Missing-image rendering retains readable hero fallback; malformed storage is not overwritten on save.
- JavaScript syntax and `git diff --check` passed.

WebKit's simulated-offline flag produced an internal browser error; the stronger test with the server actually stopped passed. No workaround was added to application code for that test-runner behavior.

## Not directly verified / limitations

- A physical iPhone, Safari Add to Home Screen installation, device keyboard and OS safe-area behavior were not directly tested. WebKit mobile emulation is not a claim of physical-device verification.
- Actual personal Safari storage was not accessed; preservation was verified using disposable legacy-shaped fixtures.
- The branch is not merged or deployed, so the live GitHub Pages upgrade is not yet verified.
- Legacy missing days and historical quantity-target changes cannot be reconstructed. Percentages explicitly describe evaluable recorded periods rather than asserting complete historical coverage.
- Life has no appointments/occasions model in the baseline. Home context uses actual overdue tasks, check-in priorities and review prompts; it does not invent appointments or finance reminders.

## Running checks

Use Node 20+:

```sh
node --test tests/derivations.cjs
python3 -m http.server 8765 --bind 127.0.0.1
```

With Playwright and its Chromium/WebKit test browsers available externally (no runtime dependency needed):

```sh
node tests/browser.cjs
node tests/pwa-upgrade.cjs
```

`BETTER_LIFE_URL` may override the preview URL. `BETTER_LIFE_QA_DIR` may override screenshot output. The PWA upgrade test serves the pinned Git baseline and current checkout from a disposable local server. Browser tests use fresh browser contexts; they do not touch the user's browser profile.
