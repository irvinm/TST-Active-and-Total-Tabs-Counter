# Data Model: Per-Window Badge Counting

**Feature**: 001-per-window-badge  
**Date**: 2026-01-02  
**Purpose**: Define data entities, relationships, state management, and validation rules

## Entities

### BadgeScopePreference

**Description**: User preference controlling whether badge displays global tab count (all windows) or focused window tab count (current window only).

**Attributes**:
- `value`: String enum
  - Values: `"all"` (default) | `"current"`
  - Stored in: `browser.storage.local` under key `badgeScopeOption`
  - Default: `"all"` (preserves v0.9.9 behavior - backwards compatible)

**Lifecycle**:
- **Created**: On first user selection OR on first read (auto-initialized to default "all")
- **Read**: During extension initialization, on storage change events, on popup open
- **Updated**: When user selects radio button in popup UI
- **Persisted**: Immediately to `browser.storage.local` on change (no save button required)

**Validation Rules**:
- MUST be one of: `"all"`, `"current"`
- Invalid values default to `"all"`
- Empty/undefined treated as `"all"` (backwards compatibility)

**Relationships**:
- **Independent of** DisplayOption (`nativeBadge`/`switchToSVG`/`alwaysSVG`)
- **Independent of** DisplayStyleOption (`oneLinePerWindow`/`compactView`)
- **Affects** badge rendering (determines which tabs are counted)

---

### WindowFocusState

**Description**: Represents the currently active browser window for badge scope calculations.

**Attributes**:
- `focusedWindowId`: Integer
  - Firefox window ID from `browser.windows.onFocusChanged` event
  - Value: Positive integer OR `browser.windows.WINDOW_ID_NONE` (-1, when focus lost to non-Firefox window)
  - Stored in: Runtime variable (not persisted - ephemeral)
  
**Lifecycle**:
- **Created**: On extension initialization (query current focused window)
- **Updated**: On `browser.windows.onFocusChanged` event (debounced by 50ms)
- **Destroyed**: Never (persists for extension lifetime)

**Validation Rules**:
- MUST be valid window ID OR `WINDOW_ID_NONE`
- Invalid window IDs (closed windows) gracefully handled by falling back to last known valid window or global count
- `WINDOW_ID_NONE` treated as "keep last known count" (user focused on non-browser app)

**Relationships**:
- **Used by** TabCount calculation when `badgeScopeOption === "current"`
- **Ignored when** `badgeScopeOption === "all"` (global count doesn't need window context)

---

### TabCount

**Description**: The number of tabs to display on the badge, calculated based on badge scope preference.

**Attributes**:
- `count`: Integer OR String literal `"N/A"`
  - Integer range: 0 to theoretical max (Firefox limit ~10,000+ tabs)
  - String literal: `"N/A"` (private window without permission)
  - Stored in: Transient (recalculated on every update, not persisted)

**Calculation Logic**:

```
IF badgeScopeOption === "all":
    count = TOTAL_TABS_ACROSS_ALL_WINDOWS
    
ELSE IF badgeScopeOption === "current":
    TRY:
        tabs = browser.tabs.query({ windowId: focusedWindowId })
        count = tabs.length
    CATCH PermissionError:
        count = "N/A"  // Private window without permission
        SET badge tooltip = "Private window - permission required"
```

**Display Rules**:
- If `count` is Integer:
  - Native badge: Display as string (e.g., "5", "127", "999")
  - SVG badge: Render dynamically (existing logic in `svgRenderBadge()`)
- If `count` is `"N/A"`:
  - Display text "N/A" on badge (native or SVG)
  - Set badge tooltip to "Private window - permission required"

**Lifecycle**:
- **Calculated**: On tab events (create, remove, discard), window focus changes, badge scope preference changes
- **Rendered**: Immediately after calculation (<100ms total latency requirement)
- **Not persisted**: Always recomputed from live browser state

**Relationships**:
- **Depends on** BadgeScopePreference (determines calculation method)
- **Depends on** WindowFocusState (for per-window calculations)
- **Affects** badge display (drives `browser.browserAction.setBadgeText()` or SVG rendering)

---

## State Transitions

### BadgeScopePreference State Diagram

```
┌─────────┐
│ UNSET   │ (fresh install OR existing user pre-v1.0.0)
└────┬────┘
     │
     │ On first read OR popup open
     ▼
┌─────────┐
│ "all"   │ (default, global tab count)
└────┬────┘
     │
     │ User selects "Current Window Only"
     ▼
┌─────────┐
│ "current" │ (per-window tab count)
└────┬────┘
     │
     │ User selects "All Windows"
     ▼
┌─────────┐
│ "all"   │ (back to global)
└─────────┘
```

**Trigger Events**:
- Popup radio button change → storage write → background script receives `storage.onChanged` event → recalculate badge
- Extension startup → read storage → initialize mode

---

### WindowFocusState State Diagram

```
┌────────────────┐
│ INITIALIZATION │ (extension startup)
└───────┬────────┘
        │
        │ Query browser.windows.getCurrent()
        ▼
┌─────────────────┐
│ FOCUSED_WINDOW  │ (valid window ID)
└────────┬────────┘
         │
         │ browser.windows.onFocusChanged(validWindowId)
         ▼
┌─────────────────┐
│ DEBOUNCE_WAIT   │ (50ms delay)
└────────┬────────┘
         │
         │ Timeout expires
         ▼
┌─────────────────┐
│ FOCUSED_WINDOW  │ (updated window ID, trigger badge update)
└────────┬────────┘
         │
         │ browser.windows.onFocusChanged(WINDOW_ID_NONE)
         ▼
┌─────────────────┐
│ FOCUS_LOST      │ (keep last known window count)
└────────┬────────┘
         │
         │ browser.windows.onFocusChanged(validWindowId)
         ▼
     [Back to DEBOUNCE_WAIT]
```

**Edge Cases**:
- Window closed while focused → next focus event triggers recalculation
- All windows closed → extension background persists, waits for new window
- Rapid focus changes → debounce coalesces updates (only final focus state triggers badge update)

---

### TabCount Calculation Flow

```
┌──────────────┐
│ TRIGGER EVENT│ (tab create/remove, window focus, scope change)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ CHECK SCOPE  │ (read badgeScopeOption from storage)
└──────┬───────┘
       │
       ├─ IF "all" ──────────────────────────┐
       │                                      │
       ▼                                      ▼
┌──────────────────┐               ┌─────────────────────┐
│ QUERY ALL TABS   │               │ QUERY WINDOW TABS   │
│ (global count)   │               │ (windowId: focused) │
└──────┬───────────┘               └─────────┬───────────┘
       │                                      │
       │                                      ├─ SUCCESS ─┐
       │                                      │           │
       │                                      ├─ PERMISSION ERROR (private window)
       │                                      │           │
       │                                      ▼           ▼
       │                           ┌─────────────┐  ┌────────────┐
       │                           │ count = N   │  │ count = "N/A" │
       │                           └─────┬───────┘  └────┬───────┘
       │                                 │               │
       │                                 │               ▼
       │                                 │        ┌─────────────────┐
       │                                 │        │ SET TOOLTIP     │
       │                                 │        │ "Private window │
       │                                 │        │ - permission    │
       │                                 │        │  required"      │
       │                                 │        └────┬────────────┘
       └─────────────────────────────────┴─────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │ UPDATE BADGE     │
                              │ (setBadgeText OR │
                              │  svgRenderBadge) │
                              └──────────────────┘
```

---

## Storage Schema

### browser.storage.local Structure

```json
{
  "displayOption": "switchToSVG",           // Existing (v0.9.9)
  "displayStyleOption": "oneLinePerWindow", // Existing (v0.9.9)
  "badgeScopeOption": "all"                 // NEW (v1.0.0) - default added
}
```

**Schema Version**: No explicit versioning required (additive change, backwards compatible)

**Migration Strategy**: None required - storage API provides defaults on missing keys

**Storage Access Patterns**:
- **Write**: On user preference change in popup (immediate, no batching)
- **Read**: On extension initialization, on `storage.onChanged` event
- **Default handling**: `browser.storage.local.get({ badgeScopeOption: "all" })`

---

## Runtime Variables (Ephemeral State)

### Background Script State

```javascript
// Global state in background.js
let currentFocusedWindowId = null;  // WindowFocusState
let focusDebounceTimer = null;      // Debounce timer handle
let cachedBadgeScopeOption = "all"; // Cached preference (updated on storage change)
```

**Rationale**:
- `currentFocusedWindowId`: Avoids redundant window queries, updated on focus events
- `focusDebounceTimer`: Tracks pending debounced update (cleared on rapid changes)
- `cachedBadgeScopeOption`: Reduces storage reads during frequent tab events

**Invalidation**:
- `currentFocusedWindowId`: Updated on `browser.windows.onFocusChanged`
- `focusDebounceTimer`: Cleared/reset on each new focus event within 50ms window
- `cachedBadgeScopeOption`: Updated on `browser.storage.onChanged` event

---

## Validation & Error Handling

### Input Validation

| Field | Validation Rule | Invalid Value Handling |
|-------|----------------|------------------------|
| `badgeScopeOption` | Must be `"all"` OR `"current"` | Default to `"all"` |
| `focusedWindowId` | Must be positive integer OR `WINDOW_ID_NONE` | Fallback to global count |
| Tab count | Must be non-negative integer OR `"N/A"` | Display "0" on error |

### Error Scenarios

| Error | Detection Method | Recovery Strategy |
|-------|------------------|------------------|
| Private window permission denied | `try-catch` on `browser.tabs.query()` | Display "N/A" with tooltip |
| Invalid window ID (closed window) | Query returns empty OR error | Fallback to global count |
| Storage read failure | `try-catch` on `browser.storage.local.get()` | Use default "all" |
| Rapid storage corruption | Validate value on read | Reset to default "all" |

---

## Performance Considerations

### Query Optimization

| Scope Mode | Query | Typical Size (10 windows, 1000 tabs) | Performance Impact |
|------------|-------|--------------------------------------|-------------------|
| "all" | `browser.tabs.query({})` | 1000 tabs | Baseline (existing v0.9.9 behavior) |
| "current" | `browser.tabs.query({ windowId })` | ~100 tabs | 10x fewer tabs to process |

**Caching Strategy**: None - queries are fast enough (<50ms target), caching adds complexity and stale data risk

### Debounce Effectiveness

- **Without debounce**: 10 rapid focus changes = 10 badge updates = ~500ms total (flickering visible)
- **With 50ms debounce**: 10 rapid focus changes = 1 badge update = ~50ms + query time (no flicker)
- **Overhead**: Single `setTimeout`/`clearTimeout` per focus event (~0.01ms negligible)

---

## Accessibility & Internationalization

### Tooltip Text

**Fixed English strings** (per constitution - i18n deferred):
- "Private window - permission required"

**Badge Text**:
- Numeric counts: Universal (no localization needed)
- "N/A" string: English only (future i18n will replace with localized equivalent)

**Screen Readers**:
- Badge tooltip (`browserAction.setTitle()`) is read by screen readers
- Radio button labels in popup.html use semantic HTML (`<label for="...">`)

---

## Summary

**New Entities**: 1 persistent (BadgeScopePreference), 1 ephemeral (WindowFocusState), 1 computed (TabCount)

**Storage Impact**: +1 key (`badgeScopeOption`), backwards compatible with v0.9.9

**State Complexity**: Low - simple enum preference, event-driven window tracking, stateless tab count calculation

**Performance**: Improved for per-window mode (scoped queries faster than global), negligible overhead for default "all" mode

Ready for Phase 1 contracts generation.
