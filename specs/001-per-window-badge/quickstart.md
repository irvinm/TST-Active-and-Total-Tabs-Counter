# Quickstart: Per-Window Badge Counting Implementation

**Feature**: 001-per-window-badge  
**Target Audience**: Developers implementing this feature  
**Prerequisites**: Familiarity with Firefox WebExtensions, JavaScript ES6+, browser.* APIs

## 5-Minute Overview

**What**: Add user-configurable badge scope (all windows vs. current window only)  
**Why**: Users with multiple windows need contextual tab counts for their current workspace  
**How**: New storage preference + window focus tracking + conditional tab queries  
**Impact**: 4 files modified (manifest.json, background.js, popup.html, popup.js), no new files

---

## Implementation Steps

### Step 1: Add Window Focus Tracking (background.js)

**What to do**: Track currently focused window for per-window tab counting

**Code Changes**:
```javascript
// At top of background.js, add global state variables
let currentFocusedWindowId = null;
let focusDebounceTimer = null;
const FOCUS_DEBOUNCE_MS = 50;

// Add window focus listener during initialization
async function initializeWindowFocus() {
  // Get initially focused window
  const currentWindow = await browser.windows.getCurrent();
  currentFocusedWindowId = currentWindow.id;
  
  // Listen for window focus changes
  browser.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === browser.windows.WINDOW_ID_NONE) {
      return; // Ignore focus loss to non-browser windows
    }
    
    // Debounce rapid focus changes (50ms)
    if (focusDebounceTimer) {
      clearTimeout(focusDebounceTimer);
    }
    
    focusDebounceTimer = setTimeout(() => {
      currentFocusedWindowId = windowId;
      updateTabCount(); // Recalculate badge for new window
      focusDebounceTimer = null;
    }, FOCUS_DEBOUNCE_MS);
  });
}

// Call during extension startup (add to initializeAddon())
initializeWindowFocus();
```

**Testing**: Open multiple windows, switch between them, verify `currentFocusedWindowId` updates

---

### Step 2: Add Badge Scope Preference Storage (background.js)

**What to do**: Add function to read badge scope preference with default fallback

**Code Changes**:
```javascript
// Add alongside existing getDisplayOption() function
async function getBadgeScopeOption() {
  const { badgeScopeOption } = await browser.storage.local.get({
    badgeScopeOption: "all" // Default to "all" (global count)
  });
  
  // Validate (fallback to default if corrupt)
  if (badgeScopeOption !== "all" && badgeScopeOption !== "current") {
    return "all";
  }
  
  return badgeScopeOption;
}
```

**Testing**: Fresh install should return "all", setting preference should return saved value

---

### Step 3: Update Tab Counting Logic (background.js)

**What to do**: Modify `updateTabCount()` to conditionally query tabs based on badge scope

**Code Changes**:
```javascript
// BEFORE (existing code - queries all tabs globally):
const allTabs = await browser.tabs.query({});

// AFTER (add conditional logic):
const badgeScopeOption = await getBadgeScopeOption();
let allTabs;

if (badgeScopeOption === "current") {
  // Per-window mode: query tabs for focused window only
  try {
    allTabs = await browser.tabs.query({ windowId: currentFocusedWindowId });
  } catch (error) {
    // Handle private window permission denial
    if (error.message && (error.message.includes("incognito") || error.message.includes("private"))) {
      // Display "N/A" on badge with explanatory tooltip
      await browser.browserAction.setBadgeText({ text: "N/A" });
      await browser.browserAction.setTitle({ title: "Private window - permission required" });
      return; // Exit early - don't update TST sidebar
    }
    // Re-throw unexpected errors
    throw error;
  }
} else {
  // All windows mode (default): query all tabs globally
  allTabs = await browser.tabs.query({});
}

// Rest of existing updateTabCount() logic remains unchanged
const loadedTabsGlobal = allTabs.filter(tab => !tab.discarded).length;
const totalTabsGlobal = allTabs.length;
const tabCount = totalTabsGlobal.toString();
// ... (existing badge display logic)
```

**Testing**: 
- Mode "all" + 2 windows (5 tabs, 10 tabs) → badge shows "15"
- Mode "current" + focus window with 5 tabs → badge shows "5"
- Mode "current" + switch to window with 10 tabs → badge updates to "10"
- Mode "current" + private window without permission → badge shows "N/A"

---

### Step 4: Add Badge Scope UI (popup.html)

**What to do**: Add radio button group for badge scope selection

**Code Changes**:
```html
<!-- Add new section between existing "Badge Counter Options" and "Display Options" -->
<h2>Badge Scope Options</h2>
<form id="badgeScopeForm">
    <div class="option-group" data-option="badgeScopeAll">
        <input type="radio" id="badgeScopeAll" name="badgeScopeOption" value="all">
        <label for="badgeScopeAll">All Windows (show total tabs across all windows)</label><br>
    </div>
    <div class="option-group" data-option="badgeScopeCurrent">
        <input type="radio" id="badgeScopeCurrent" name="badgeScopeOption" value="current">
        <label for="badgeScopeCurrent">Current Window Only (show tabs in focused window)</label><br>
    </div>
</form>
```

**Testing**: Open popup, verify radio buttons appear with correct labels

---

### Step 5: Add Badge Scope Logic (popup.js)

**What to do**: Load badge scope preference on popup open, save on user change

**Code Changes**:
```javascript
// Add to DOMContentLoaded event listener (after existing displayOption logic)

// Load badge scope preference on popup open
try {
  const result = await browser.storage.local.get({ badgeScopeOption: "all" });
  const selectedScope = result.badgeScopeOption || "all";
  
  // Set corresponding radio button
  if (selectedScope === "current") {
    document.getElementById("badgeScopeCurrent").checked = true;
  } else {
    document.getElementById("badgeScopeAll").checked = true;
  }
} catch (error) {
  console.error('Error loading badge scope option:', error);
  // Default to "all" on error
  document.getElementById("badgeScopeAll").checked = true;
}

// Listen for badge scope changes
document.querySelectorAll('input[name="badgeScopeOption"]').forEach(radio => {
  radio.addEventListener('change', async function() {
    if (this.checked) {
      try {
        const newValue = this.value; // "all" or "current"
        
        // Save to storage
        await browser.storage.local.set({ badgeScopeOption: newValue });
        console.log('Badge scope saved:', newValue);
        
        // Show confirmation message
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = 'Badge scope saved!';
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
          messageDiv.textContent = '';
        }, 3000);
        
        // Trigger badge update in background script
        await browser.runtime.sendMessage({ action: "updateBadge" });
      } catch (error) {
        console.error('Error saving badge scope:', error);
      }
    }
  });
});
```

**Testing**: 
- Open popup, select "Current Window Only", close popup, reopen → selection persists
- Change preference → badge updates immediately

---

### Step 6: Listen for Storage Changes (background.js)

**What to do**: React to badge scope preference changes from popup

**Code Changes**:
```javascript
// Add storage change listener (near existing browser.runtime.onMessage listener)
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  
  if (changes.badgeScopeOption) {
    console.log('Badge scope changed:', changes.badgeScopeOption.newValue);
    // Recalculate badge with new scope
    updateTabCount();
  }
});
```

**Testing**: Open popup, change badge scope, verify badge updates without requiring page reload

---

## File Modification Summary

| File | Changes | Lines Added | Lines Modified |
|------|---------|-------------|----------------|
| background.js | Add window focus tracking, badge scope logic, storage listener | ~60 | ~10 |
| popup.html | Add badge scope radio buttons section | ~10 | 0 |
| popup.js | Add badge scope load/save logic | ~40 | 0 |
| manifest.json | No changes (existing "storage" permission sufficient) | 0 | 0 |

**Total Impact**: ~110 lines added, ~10 lines modified, 0 files created

---

## Testing Checklist

### Unit Tests (Manual QA)

- [ ] **Default behavior**: Fresh install shows "All Windows" selected, badge shows global count
- [ ] **Preference persistence**: Select "Current Window Only", restart browser, preference persists
- [ ] **Badge accuracy - mode "all"**: 2 windows (5 tabs, 10 tabs) → badge shows "15"
- [ ] **Badge accuracy - mode "current"**: Focus window with 5 tabs → badge shows "5"
- [ ] **Window focus tracking**: Switch between windows → badge updates within 100ms
- [ ] **Rapid focus changes**: Rapidly switch 5 times → badge updates only once (debounced)
- [ ] **Private window handling**: Focus private window without permission → badge shows "N/A"
- [ ] **Tooltip display**: Hover over "N/A" badge → tooltip shows "Private window - permission required"
- [ ] **Mode switching**: Change from "all" to "current" mid-session → badge updates immediately
- [ ] **Storage corruption**: Manually set `badgeScopeOption: null` → defaults to "all"

---

### Integration Tests (Test Matrix)

**Test Dimensions**: {Badge Scope} × {Window Count} × {Tab Count}

| Badge Scope | Windows | Tabs per Window | Expected Badge |
|-------------|---------|-----------------|----------------|
| All | 1 | 5 | "5" |
| All | 2 | 5, 10 | "15" |
| All | 10 | 100 each | "1000" |
| Current | 1 | 5 | "5" |
| Current | 2 (focus=A) | A:5, B:10 | "5" |
| Current | 2 (focus=B) | A:5, B:10 | "10" |
| Current | 10 (focus=any) | 100 each | "100" |
| Current | 1 (private, no perm) | N/A | "N/A" |

---

### Performance Tests

- [ ] **Badge update latency**: Window focus change → badge update < 100ms (target: <50ms overhead)
- [ ] **Query performance**: Per-window query (100 tabs) faster than global query (1000 tabs)
- [ ] **Debounce effectiveness**: 10 rapid focus changes → only 1 badge update (50ms debounce working)
- [ ] **Memory impact**: Monitor memory usage with 1000+ tabs → no leaks from focus tracking
- [ ] **CPU impact**: Badge updates don't block UI → extension remains responsive

---

## Common Pitfalls & Solutions

### Pitfall 1: Badge doesn't update on window focus
**Cause**: `browser.windows.onFocusChanged` listener not registered  
**Solution**: Ensure `initializeWindowFocus()` called during extension initialization

---

### Pitfall 2: Badge flickers during rapid window switching
**Cause**: Missing or incorrect debounce logic  
**Solution**: Verify `FOCUS_DEBOUNCE_MS = 50` and `clearTimeout()` called on each new event

---

### Pitfall 3: "N/A" badge doesn't show tooltip
**Cause**: Missing `browser.browserAction.setTitle()` call  
**Solution**: Set title immediately after setting badge text to "N/A"

---

### Pitfall 4: Badge shows "0" on private window instead of "N/A"
**Cause**: Permission error not caught, query returns empty array  
**Solution**: Wrap query in try-catch, check error message for "incognito"/"private" keywords

---

### Pitfall 5: Preference doesn't persist after browser restart
**Cause**: Storage write not awaited or error during save  
**Solution**: Ensure `await browser.storage.local.set()` and check for errors in console

---

## Debugging Tips

### Enable Verbose Logging
```javascript
// Add to background.js for debugging
const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log('[BadgeScope]', ...args);
}

// Use in code:
log('Window focus changed:', windowId);
log('Badge scope:', badgeScopeOption);
log('Tab count:', allTabs.length);
```

---

### Inspect Storage
```javascript
// Run in browser console (about:debugging → This Firefox → Inspect)
browser.storage.local.get().then(console.log);
```

---

### Monitor Window Focus Events
```javascript
// Add temporary listener for debugging
browser.windows.onFocusChanged.addListener((windowId) => {
  console.log('Focus changed to window:', windowId, 'at', new Date().toISOString());
});
```

---

### Verify Badge Update Timing
```javascript
// Add performance measurement to updateTabCount()
const startTime = performance.now();
// ... (existing updateTabCount logic)
const endTime = performance.now();
console.log(`Badge update took ${endTime - startTime}ms`);
```

---

## Next Steps After Implementation

1. **Manual QA**: Run through entire testing checklist with Firefox Developer Edition
2. **ESLint**: Run `eslint background.js popup.js` (ensure no new warnings)
3. **AMO Validator**: Run web-ext lint before submission
4. **Update manifest version**: Bump from `0.9.9` to `1.0.0` (MINOR version per constitution - new feature)
5. **Update README.md**: Document new badge scope feature
6. **Create release notes**: Describe new functionality for users
7. **Submit to AMO**: Upload updated XPI with release notes

---

## Estimated Implementation Time

| Task | Estimated Time | Confidence |
|------|----------------|------------|
| Step 1 (Window focus tracking) | 30 min | High |
| Step 2 (Storage preference) | 15 min | High |
| Step 3 (Tab counting logic) | 45 min | Medium (error handling complexity) |
| Step 4 (Popup HTML) | 10 min | High |
| Step 5 (Popup JS logic) | 30 min | High |
| Step 6 (Storage listener) | 15 min | High |
| Testing & debugging | 2 hours | Medium (depends on edge cases) |
| **Total** | **4-5 hours** | **Medium-High** |

---

## Success Criteria

Implementation is **complete** when:
- [ ] All testing checklist items pass
- [ ] ESLint shows zero new warnings
- [ ] AMO validator passes with no errors
- [ ] Manual QA confirms all functional requirements (FR-001 through FR-012) met
- [ ] Performance targets achieved (<100ms badge updates, <50ms window focus overhead)
- [ ] Backwards compatibility verified (existing users see no behavioral change until they configure preference)

---

## Support & Resources

- **Specification**: [spec.md](spec.md)
- **Data Model**: [data-model.md](data-model.md)
- **Storage Contract**: [contracts/storage-schema.md](contracts/storage-schema.md)
- **Research Findings**: [research.md](research.md)
- **WebExtension API Docs**: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions
- **Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)

---

**Document Status**: ✅ Ready for implementation - All technical decisions made
