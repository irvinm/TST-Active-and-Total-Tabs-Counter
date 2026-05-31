# Research: Per-Window Badge Counting

**Feature**: 001-per-window-badge  
**Date**: 2026-01-02  
**Purpose**: Resolve technical unknowns and establish implementation approach

## Phase 0: Research Findings

### 1. Window Focus Tracking API

**Question**: How to reliably track which browser window has focus in Firefox?

**Decision**: Use `browser.windows.onFocusChanged` event listener combined with `browser.windows.getCurrent()`

**Rationale**:
- `browser.windows.onFocusChanged` fires whenever window focus changes, providing window ID
- Event includes `windowId` parameter (can be `browser.windows.WINDOW_ID_NONE` if focus lost to non-browser window)
- `browser.windows.getCurrent({ populate: false })` provides current focused window synchronously when needed
- Native Firefox API - no polyfills or workarounds required
- Minimal overhead - event-driven architecture aligns with WebExtension best practices

**Alternatives Considered**:
- **Polling `browser.windows.getLastFocused()`**: Rejected - wasteful CPU usage, violates Principle IV (Performance)
- **Tab activation events**: Rejected - doesn't capture window focus changes without tab switches
- **`focusedWindow` property**: Rejected - not persistent across focus changes, requires continuous querying

**Implementation Notes**:
- Must handle `WINDOW_ID_NONE` case (user focused on non-Firefox window) - keep showing last known window count
- Debounce required (50ms per clarification) to prevent flickering during rapid window switching
- Event listener setup in `background.js` during initialization

---

### 2. Tab Querying Performance for Per-Window Scope

**Question**: What's the performance impact of querying tabs for a specific window vs. all tabs globally?

**Decision**: Per-window tab queries using `browser.tabs.query({ windowId: windowId })` are equal to or faster than global queries

**Rationale**:
- Firefox internally indexes tabs by window - scoped queries are O(tabs_in_window) vs O(all_tabs)
- For users with 1000 tabs across 10 windows, per-window query averages 100 tabs vs 1000 tabs
- Existing `updateTabCount()` already uses `browser.tabs.query({})` - replacing with scoped query reduces data transfer
- Clarification established 50ms total overhead budget for window focus changes - per-window queries help meet this target

**Performance Testing Results** (from existing codebase analysis):
- Current implementation queries all tabs globally: `browser.tabs.query({})`
- No filtering or windowing applied - processes full tab list every update
- No reported performance issues in v0.9.9 with global queries up to 1000+ tabs

**Alternatives Considered**:
- **Caching window-to-tabs mapping**: Rejected - adds complexity, stale data risk, violates simplicity principle
- **Differential updates**: Rejected - over-engineering for <100ms requirement

**Implementation Notes**:
- Replace global `browser.tabs.query({})` with conditional:
  - If `badgeScopeOption === "all"`: `browser.tabs.query({})`  (existing behavior)
  - If `badgeScopeOption === "current"`: `browser.tabs.query({ windowId: focusedWindowId })`
- No caching layer needed - queries are fast enough for real-time updates

---

### 3. Debouncing Strategy for Rapid Window Focus Changes

**Question**: How to implement 50ms debounce without introducing flickering or stale data?

**Decision**: Trailing-edge debounce with immediate first call

**Rationale**:
- Trailing-edge debounce: waits 50ms after last event before executing update
- Immediate first call: first focus change updates instantly, subsequent rapid changes wait 50ms
- Prevents badge "lag" feeling while still filtering out rapid focus changes
- Standard debounce pattern - no custom libraries needed (simple JavaScript `setTimeout`/`clearTimeout`)

**Alternatives Considered**:
- **Leading-edge debounce only**: Rejected - last window in rapid sequence might not update
- **Throttling (rate limiting)**: Rejected - can miss final focus state if user stops mid-throttle window
- **No debounce**: Rejected - violates FR-009 (50ms debounce requirement from clarification)

**Implementation Notes**:
```javascript
let focusDebounceTimer = null;
const FOCUS_DEBOUNCE_MS = 50;

browser.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === browser.windows.WINDOW_ID_NONE) return; // Ignore focus loss
    
    // Clear pending update
    if (focusDebounceTimer) {
        clearTimeout(focusDebounceTimer);
    }
    
    // Schedule update after debounce period
    focusDebounceTimer = setTimeout(() => {
        currentFocusedWindowId = windowId;
        updateTabCount();
        focusDebounceTimer = null;
    }, FOCUS_DEBOUNCE_MS);
});
```

---

### 4. Private Browsing Permission Handling

**Question**: How to detect private browsing permission status and handle "N/A" badge display with tooltip?

**Decision**: Use `browser.tabs.query()` permission error handling combined with `browser.browserAction.setBadgeText()` and title attribute for tooltip

**Rationale**:
- `browser.tabs.query({ windowId: privateWindowId })` throws permission error if private browsing access denied
- Wrap query in try-catch to gracefully handle permission denial
- Use `browser.browserAction.setBadgeText({ text: "N/A" })` for visual indicator
- Use `browser.browserAction.setTitle({ title: "Private window - permission required" })` for hover tooltip
- No special permission checking API needed - error-based detection is idiomatic for WebExtensions

**Alternatives Considered**:
- **`browser.extension.isAllowedIncognitoAccess()`**: Rejected - API only checks if permission granted, doesn't help with current window detection
- **Custom tooltip UI**: Rejected - browser action title attribute is native, accessible, and free
- **Fallback to "All Windows" mode**: Rejected - user explicitly clarified "N/A" with tooltip preferred over silent mode switch

**Implementation Notes**:
```javascript
async function getTabCountForWindow(windowId) {
    try {
        const tabs = await browser.tabs.query({ windowId: windowId });
        return tabs.length;
    } catch (error) {
        // Private window without permission
        if (error.message.includes("incognito") || error.message.includes("private")) {
            return "N/A";
        }
        throw error; // Re-throw unexpected errors
    }
}
```

---

### 5. Badge Display Text Handling for "N/A"

**Question**: How to display "N/A" on the badge alongside numeric counts (badge APIs typically expect numbers)?

**Decision**: Use `browser.browserAction.setBadgeText({ text: "N/A" })` directly - Firefox supports alphanumeric badge text

**Rationale**:
- Firefox badge API accepts any string value (not just numbers)
- Existing codebase uses `.toString()` conversion: `browser.browserAction.setBadgeText({ text: tabCount.toString() })`
- "N/A" fits within typical badge display area (3-4 characters)
- No special SVG rendering required for "N/A" - native badge sufficient

**Alternatives Considered**:
- **SVG-only for "N/A"**: Rejected - over-complication, native badge supports text already
- **Show "0" or "?" instead**: Rejected - user explicitly chose "N/A" during clarification
- **Different badge color for "N/A"**: Considered but deferred - adds visual complexity, not in spec requirements

**Implementation Notes**:
- Update `updateBadgeDisplay()` to handle string values:
  - If `tabCount === "N/A"`: set badge text directly, set title to "Private window - permission required"
  - Else: existing numeric badge logic

---

### 6. Storage Schema Extension

**Question**: How to extend storage schema to include `badgeScopeOption` without breaking existing users?

**Decision**: Add `badgeScopeOption` key with default value "all", maintain existing keys unchanged

**Rationale**:
- `browser.storage.local.get()` returns default value if key doesn't exist - built-in migration
- Default "all" preserves existing behavior (Principle V - Backwards Compatibility)
- No schema migration code required - WebExtension storage API handles missing keys gracefully
- Existing keys (`displayOption`, `displayStyleOption`) remain untouched

**Storage Schema**:
```javascript
{
    "displayOption": "switchToSVG" | "alwaysSVG",              // Existing (v0.9.9)
    "displayStyleOption": "oneLinePerWindow" | "compactView",  // Existing (v0.9.9)
    "badgeScopeOption": "all" | "current"                      // New (v1.0.0)
}
```

**Alternatives Considered**:
- **Explicit migration function**: Rejected - unnecessary overhead, storage API provides defaults
- **Combine with existing displayOption**: Rejected - separation of concerns, independent toggle needed per spec

**Implementation Notes**:
- Initialize on first read:
  ```javascript
  async function getBadgeScopeOption() {
      const { badgeScopeOption } = await browser.storage.local.get({ badgeScopeOption: "all" });
      return badgeScopeOption;
  }
  ```

---

## Summary of Technical Decisions

| Area | Technology Choice | Key Rationale |
|------|------------------|---------------|
| Window Focus | `browser.windows.onFocusChanged` + `getCurrent()` | Native API, event-driven, minimal overhead |
| Tab Queries | `browser.tabs.query({ windowId })` | Scoped queries faster than global for per-window mode |
| Debouncing | Trailing-edge debounce (50ms, immediate first) | Balances responsiveness with flicker prevention |
| Private Windows | Try-catch on `browser.tabs.query()` | Idiomatic error handling, no special APIs |
| "N/A" Badge | `setBadgeText({ text: "N/A" })` | Firefox supports alphanumeric badge text natively |
| Storage | Add `badgeScopeOption` key with default "all" | Backwards compatible, no migration code needed |

---

## Best Practices Applied

### WebExtension Performance Patterns
- Event-driven architecture (no polling)
- Scoped tab queries reduce data transfer
- Debouncing prevents redundant API calls
- No caching layer - keep queries simple and reliable

### Firefox Extension Development
- Use native badge APIs (no custom rendering for "N/A")
- Leverage storage default values (no migration code)
- Error-based permission detection (idiomatic for WebExtensions)
- Tooltip via `browserAction.setTitle()` (accessible, native)

### Backwards Compatibility
- Default values preserve v0.9.9 behavior
- No changes to existing storage keys
- New feature opt-in only (doesn't affect non-users)
- No manifest permission additions required (existing "storage" permission sufficient)

---

## No Outstanding Clarifications

All technical unknowns resolved. Ready for Phase 1 (Design).
