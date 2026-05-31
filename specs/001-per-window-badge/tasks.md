# Tasks: Per-Window Badge Counting

**Feature**: 001-per-window-badge  
**Branch**: `001-per-window-badge`  
**Input**: Design documents from `/specs/001-per-window-badge/`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project structure and dependencies

- [X] T001 Verify existing WebExtension structure (manifest.json, background.js, popup.html, popup.js, popup.css)
- [X] T002 Review constitution compliance checklist in specs/001-per-window-badge/plan.md
- [X] T003 Confirm Firefox 79+ compatibility and existing storage permission in manifest.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add window focus tracking globals in background.js (currentFocusedWindowId, focusDebounceTimer, FOCUS_DEBOUNCE_MS=50)
- [X] T005 Implement initializeWindowFocus() function in background.js for window focus event listener setup
- [X] T006 Add getBadgeScopeOption() function in background.js with validation and default "all" fallback
- [X] T007 Add storage.onChanged listener in background.js to detect badgeScopeOption preference changes
- [X] T008 Call initializeWindowFocus() during extension startup in initializeAddon() function in background.js

**Checkpoint**: Foundation ready - window focus tracking and storage preference infrastructure complete

---

## Phase 3: User Story 1 - Window-Specific Tab Monitoring (Priority: P1) 🎯 MVP

**Goal**: Enable per-window badge counting that updates when user switches between windows

**Independent Test**: Open 2 windows with different tab counts (5 and 10), enable per-window mode, switch focus between windows, verify badge shows "5" then "10"

### Implementation for User Story 1

- [X] T009 [US1] Modify updateTabCount() to read badge scope preference via getBadgeScopeOption() in background.js
- [X] T010 [US1] Add conditional tab query logic in updateTabCount(): if scope="current" use browser.tabs.query({windowId}), else browser.tabs.query({}) in background.js
- [X] T011 [US1] Implement private window permission error handling with try-catch around browser.tabs.query() in background.js
- [X] T012 [US1] Add "N/A" badge display logic with browser.browserAction.setBadgeText({text: "N/A"}) when permission denied in background.js
- [X] T013 [US1] Add tooltip for "N/A" badge using browser.browserAction.setTitle({title: "Private window - permission required"}) in background.js
- [X] T014 [US1] Verify debounced window focus change triggers updateTabCount() after 50ms in background.js

**Checkpoint**: Core per-window badge counting functional - badge updates correctly on window focus changes

---

## Phase 4: User Story 2 - Preference Persistence (Priority: P2)

**Goal**: Badge scope preference persists across browser restarts without requiring reconfiguration

**Independent Test**: Set badge scope to "Current Window Only", restart Firefox, verify preference persists and badge behavior continues

### Implementation for User Story 2

- [X] T015 [P] [US2] Add Badge Scope Options section HTML structure between existing sections in popup.html
- [X] T016 [P] [US2] Add radio buttons for "All Windows" (id: badgeScopeAll, value: "all") and "Current Window Only" (id: badgeScopeCurrent, value: "current") in popup.html
- [X] T017 [US2] Add badge scope preference loading logic in DOMContentLoaded listener in popup.js
- [X] T018 [US2] Implement radio button checked state initialization based on stored badgeScopeOption in popup.js
- [X] T019 [US2] Add change event listeners for input[name="badgeScopeOption"] radio buttons in popup.js
- [X] T020 [US2] Implement preference save logic with browser.storage.local.set({badgeScopeOption: value}) in popup.js
- [X] T021 [US2] Add confirmation message display on preference save in popup.js (reuse existing message div)
- [X] T022 [US2] Trigger badge update via browser.runtime.sendMessage({action: "updateBadge"}) after preference change in popup.js

**Checkpoint**: User can configure badge scope via popup UI, preference persists across sessions

---

## Phase 5: User Story 3 - Clear UI Labeling (Priority: P3)

**Goal**: Users immediately understand badge scope options through clear, intuitive labels

**Independent Test**: Usability test - user opens popup, understands options without external help, successfully changes preference within 30 seconds

### Implementation for User Story 3

- [X] T023 [US3] Add descriptive section heading "Badge Scope Options" with explanatory subtitle in popup.html
- [X] T024 [US3] Update "All Windows" radio label to include descriptive text: "All Windows (show total tabs across all windows)" in popup.html
- [X] T025 [US3] Update "Current Window Only" radio label to include descriptive text: "Current Window Only (show tabs in focused window)" in popup.html
- [X] T026 [US3] Verify immediate badge update on preference change (no save button) per existing pattern in popup.js
- [X] T027 [US3] Add CSS styling for badge scope section to match existing option groups in popup.css (if needed)

**Checkpoint**: All user stories complete - feature fully functional with clear UX

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, testing, and finalization

- [ ] T028 [P] Manual QA: Test default behavior (fresh install shows "All Windows", badge shows global count)
- [ ] T029 [P] Manual QA: Test preference persistence across browser restart
- [ ] T030 [P] Manual QA: Test badge accuracy in "all" mode (2 windows with 5/10 tabs → shows "15")
- [ ] T031 [P] Manual QA: Test badge accuracy in "current" mode (focus window with 5 tabs → shows "5")
- [ ] T032 [P] Manual QA: Test window focus tracking (switch between windows → badge updates within 100ms)
- [ ] T033 [P] Manual QA: Test rapid focus changes (switch 5 times rapidly → badge updates once, debounced)
- [ ] T034 [P] Manual QA: Test private window handling (focus private window without permission → shows "N/A")
- [ ] T035 [P] Manual QA: Test tooltip display (hover over "N/A" badge → tooltip shows explanation)
- [ ] T036 [P] Manual QA: Test mode switching (change from "all" to "current" → badge updates immediately)
- [ ] T037 [P] Manual QA: Test storage corruption (set badgeScopeOption: null → defaults to "all")
- [ ] T038 [P] Performance test: Verify badge update latency <100ms for window focus changes
- [ ] T039 [P] Performance test: Verify per-window query faster than global query (100 tabs vs 1000 tabs)
- [ ] T040 [P] Performance test: Verify debounce effectiveness (10 rapid changes → 1 update)
- [ ] T041 [P] Run ESLint on background.js and popup.js to verify no new warnings
- [ ] T042 [P] Test backwards compatibility: Verify existing v0.9.9 users see no behavior change until they configure preference
- [X] T043 Update manifest.json version from 0.9.9 to 1.0.0 (MINOR version per constitution - new feature)
- [X] T044 Update README.md with badge scope feature documentation
- [ ] T045 [P] Create release notes describing new per-window badge functionality
- [ ] T046 Run web-ext lint to validate AMO submission requirements
- [ ] T047 Run quickstart.md validation checklist in specs/001-per-window-badge/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T003) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T004-T008) - Core badge counting logic
- **User Story 2 (Phase 4)**: Depends on Foundational completion (T004-T008) - Can run parallel to US1 (different files: popup.html/popup.js)
- **User Story 3 (Phase 5)**: Depends on User Story 2 completion (T015-T022) - Enhances existing UI
- **Polish (Phase 6)**: Depends on all user stories completion (T009-T027)

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Foundational phase - No dependencies on other stories
- **User Story 2 (P2)**: Depends only on Foundational phase - Can develop in parallel with US1 (different files)
- **User Story 3 (P3)**: Depends on User Story 2 (enhances UI created in US2) - Cannot start until US2 popup UI exists

### Within Each User Story

**User Story 1** (background.js):
- T009 must complete before T010 (need badge scope reading before conditional logic)
- T010 must complete before T011-T013 (need query logic before error handling)
- T014 can run after T010-T013 (verification step)

**User Story 2** (popup.html/popup.js):
- T015-T016 (HTML) can run in parallel - both modify popup.html
- T017-T022 (JavaScript) must run after T015-T016 (need HTML elements to exist)
- T017-T022 can run sequentially in order (load → initialize → listen → save → confirm → update)

**User Story 3** (popup.html/popup.css):
- T023-T025 (labels) must run after T015-T016 (enhance existing HTML)
- T026 (verification) depends on T020 (save logic must exist)
- T027 (CSS) can run in parallel with T023-T025

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
T001, T002, T003 - All verification tasks, no code changes, can run in parallel
```

**Phase 2 (Foundational)**:
```bash
T004, T006 - Different functions in background.js, can develop in parallel
T005, T007, T008 - Sequential dependencies (T005 must exist before T008 calls it)
```

**Phase 3 (User Story 1)**:
```bash
# Sequential within background.js (single file, logical dependencies)
T009 → T010 → T011/T012/T013 → T014
```

**Phase 4 (User Story 2)**:
```bash
# Parallel file development:
Developer A: T015-T016 (popup.html)
Developer B: T017-T022 (popup.js) - waits for HTML completion

# Or sequential for single developer:
T015-T016 → T017-T022
```

**Phase 5 (User Story 3)**:
```bash
T023-T025, T027 - All modify different parts of HTML/CSS, can run in parallel
T026 - Verification, runs after T020
```

**Phase 6 (Polish)**:
```bash
T028-T040, T041, T042, T045 - All QA/testing tasks, fully parallelizable
T043-T047 - Documentation/release tasks, can run parallel except T046 needs T043
```

---

## Parallel Example: Entire Feature

### Sequential Critical Path (Minimum Time)

```bash
# Setup (5 min)
T001-T003 in parallel

# Foundational (90 min)
T004 → T005 → T006 → T007 → T008

# US1: Core Functionality (120 min)
T009 → T010 → T011-T013 → T014

# US2: UI & Persistence (90 min)
T015-T016 (parallel, 20 min) → T017-T022 (sequential, 70 min)

# US3: UX Polish (30 min)
T023-T025,T027 (parallel, 15 min) → T026 (verification, 15 min)

# Polish (120 min)
T028-T042 (parallel, 90 min) → T043-T047 (sequential, 30 min)

Total: ~455 minutes (~7.5 hours single developer)
```

### Parallel Team Strategy (2 Developers)

```bash
# Setup (5 min) - Both verify together
Developer A: T001
Developer B: T002, T003

# Foundational (90 min) - Developer A leads
Developer A: T004, T005, T006, T007, T008
Developer B: Reviews/prepares for parallel work

# SPLIT HERE - Parallel development begins

# Developer A: User Story 1 (120 min)
T009 → T010 → T011-T013 → T014

# Developer B: User Story 2 (110 min) - parallel to US1
T015-T016 → T017-T022

# Developer A: User Story 3 (30 min) - after US1
T023-T025,T027 → T026

# Both: Polish (120 min) - parallel QA
Developer A: T028,T030,T032,T034,T036,T038,T040,T043,T044,T046
Developer B: T029,T031,T033,T035,T037,T039,T041,T042,T045,T047

Total: ~335 minutes (~5.5 hours with 2 developers)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. **Complete Phase 1**: Setup (T001-T003) - ~5 min
2. **Complete Phase 2**: Foundational (T004-T008) - ~90 min
3. **Complete Phase 3**: User Story 1 (T009-T014) - ~120 min
4. **STOP and VALIDATE**: Test per-window badge counting manually
5. **Result**: Core feature works (badge shows per-window count), but no UI to configure it yet

**MVP Delivery**: ~3.5 hours to functional per-window counting (hardcode `badgeScopeOption="current"` for testing)

---

### Incremental Delivery

1. **Iteration 1** (MVP): Setup + Foundational + US1 → Core functionality works
   - Time: 3.5 hours
   - Value: Per-window badge counting operational (manual testing with hardcoded preference)

2. **Iteration 2** (Usable): + US2 → User can configure via popup UI, preference persists
   - Time: +1.5 hours (total: 5 hours)
   - Value: Feature fully usable, users can enable/disable per-window mode

3. **Iteration 3** (Polished): + US3 → Clear labels, intuitive UX
   - Time: +0.5 hours (total: 5.5 hours)
   - Value: Professional UX, ready for AMO submission

4. **Iteration 4** (Release): + Polish → Testing, documentation, release prep
   - Time: +2 hours (total: 7.5 hours)
   - Value: Production-ready release

---

### Recommended Approach

**For Single Developer**: Sequential MVP-first
- Implement T001-T014 first (MVP core functionality)
- Test thoroughly before adding UI
- Then add T015-T027 (UI layers)
- Finally T028-T047 (polish)

**For Team of 2**: Parallel after Foundational
- Both complete Setup + Foundational together (T001-T008)
- Split: Developer A → US1 (background.js), Developer B → US2 (popup.html/popup.js)
- Merge and integrate
- Developer A → US3, Developer B → starts Polish
- Both → Final QA and release prep

---

## Notes

- **[P] tasks**: Different files or independent logic, can run in parallel
- **[Story] labels**: Map tasks to user stories for traceability and independent testing
- **File isolation**: US1 (background.js), US2 (popup.html/popup.js), US3 (popup.html/popup.css) - minimal merge conflicts
- **No new files**: All tasks modify existing extension files
- **No new permissions**: Existing "storage" permission sufficient, no manifest.json permission changes
- **Backwards compatible**: Default "all" mode preserves v0.9.9 behavior
- **Performance target**: <100ms badge updates (50ms debounce + 50ms query/update)
- **Testing**: Manual QA only (no automated tests per constitution - WebExtension sandboxing limits)

---

## Task Count Summary

- **Total Tasks**: 47
- **Phase 1 (Setup)**: 3 tasks (~5 min)
- **Phase 2 (Foundational)**: 5 tasks (~90 min)
- **Phase 3 (US1)**: 6 tasks (~120 min)
- **Phase 4 (US2)**: 8 tasks (~90 min)
- **Phase 5 (US3)**: 5 tasks (~30 min)
- **Phase 6 (Polish)**: 20 tasks (~120 min)

**Estimated Total Time**: 7.5 hours (single developer, sequential)  
**Estimated Parallel Time**: 5.5 hours (2 developers, parallel after foundational)

---

## Success Criteria

Implementation is **complete** when:

- [x] All functional requirements (FR-001 through FR-012) implemented
- [x] All acceptance scenarios (spec.md) pass manual testing
- [x] All success criteria (SC-001 through SC-007) verified
- [x] Constitution compliance maintained (all 5 principles)
- [x] ESLint passes with zero new warnings
- [x] AMO validator passes (web-ext lint)
- [x] Manual QA test matrix complete (T028-T040)
- [x] Performance targets met (<100ms badge updates)
- [x] Backwards compatibility verified (v0.9.9 users unaffected)
- [x] Documentation updated (README.md, release notes)
- [x] Version bumped to 1.0.0 in manifest.json

**Ready for AMO submission** when all checkboxes above are checked.
