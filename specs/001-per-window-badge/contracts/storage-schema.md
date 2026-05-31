# Storage Schema Contract

**Feature**: Per-Window Badge Counting  
**Version**: 1.0.0  
**Date**: 2026-01-02

## Overview

This contract defines the storage schema extension for the badge scope preference. The schema is **additive** - it adds a new key without modifying existing keys, ensuring backwards compatibility with v0.9.9.

## Storage Keys

### Existing Keys (v0.9.9 - Unchanged)

```typescript
interface ExistingStorage {
  displayOption: "switchToSVG" | "alwaysSVG";
  displayStyleOption: "oneLinePerWindow" | "compactView";
}
```

**Guarantees**:
- Existing keys are NOT modified by this feature
- Existing default values preserved
- Existing validation logic unchanged

---

### New Key (v1.0.0)

```typescript
interface BadgeScopeStorage {
  badgeScopeOption: "all" | "current";
}
```

**Key**: `badgeScopeOption`

**Type**: String enum

**Values**:
- `"all"` - Display total tab count across all windows (default, backwards compatible)
- `"current"` - Display tab count for currently focused window only

**Default**: `"all"`  
*Rationale*: Preserves v0.9.9 behavior for existing users and new installations

**Validation**:
- Invalid values (empty, null, undefined, other strings) → default to `"all"`
- Type coercion: Numbers, booleans, objects → default to `"all"`

---

## Complete Schema (v1.0.0)

```typescript
interface StorageSchema {
  // Existing (v0.9.9)
  displayOption: "switchToSVG" | "alwaysSVG";
  displayStyleOption: "oneLinePerWindow" | "compactView";
  
  // New (v1.0.0)
  badgeScopeOption: "all" | "current";
}
```

---

## API Contract

### Read Operation

**Function Signature** (conceptual):
```typescript
function getBadgeScopeOption(): Promise<"all" | "current">
```

**Implementation**:
```javascript
async function getBadgeScopeOption() {
  const { badgeScopeOption } = await browser.storage.local.get({
    badgeScopeOption: "all" // Default value
  });
  
  // Validate and normalize
  if (badgeScopeOption !== "all" && badgeScopeOption !== "current") {
    return "all"; // Fallback to default
  }
  
  return badgeScopeOption;
}
```

**Guarantees**:
- ALWAYS returns valid value (`"all"` or `"current"`)
- NEVER returns `undefined`, `null`, or invalid string
- Missing key returns default `"all"` (backwards compatible)
- Corrupt data returns default `"all"` (fault-tolerant)

---

### Write Operation

**Function Signature** (conceptual):
```typescript
function setBadgeScopeOption(value: "all" | "current"): Promise<void>
```

**Implementation**:
```javascript
async function setBadgeScopeOption(value) {
  // Validate input
  if (value !== "all" && value !== "current") {
    throw new Error(`Invalid badgeScopeOption: ${value}`);
  }
  
  // Write to storage
  await browser.storage.local.set({ badgeScopeOption: value });
}
```

**Guarantees**:
- ONLY accepts `"all"` or `"current"`
- Throws error on invalid input (fail-fast validation)
- Atomic write (no partial updates)
- Triggers `browser.storage.onChanged` event for listeners

---

### Storage Change Event

**Event Structure**:
```typescript
interface StorageChangeEvent {
  badgeScopeOption?: {
    oldValue?: "all" | "current";
    newValue: "all" | "current";
  }
}
```

**Listener Registration**:
```javascript
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  
  if (changes.badgeScopeOption) {
    const newValue = changes.badgeScopeOption.newValue;
    // Update cached value and recalculate badge
    cachedBadgeScopeOption = newValue;
    updateTabCount();
  }
});
```

**Guarantees**:
- Event fires immediately after storage write
- `newValue` guaranteed to be `"all"` or `"current"` (validated on write)
- `oldValue` may be `undefined` (first-time write)

---

## Migration Strategy

### v0.9.9 → v1.0.0 Upgrade Path

**Scenario 1: Existing User Upgrades to v1.0.0**
```
BEFORE (v0.9.9 storage):
{
  "displayOption": "switchToSVG",
  "displayStyleOption": "compactView"
}

AFTER (v1.0.0 first read):
{
  "displayOption": "switchToSVG",
  "displayStyleOption": "compactView",
  "badgeScopeOption": "all"  // Auto-initialized to default
}
```

**Behavior**:
- User sees identical badge behavior (global count)
- No popup UI changes until user opens it (badgeScopeOption section appears)
- No data loss, no corruption risk

---

**Scenario 2: Fresh Install (v1.0.0)**
```
INITIAL STATE (empty storage):
{}

AFTER FIRST READS:
{
  "displayOption": "switchToSVG",        // Existing default logic
  "displayStyleOption": "oneLinePerWindow", // Existing default logic
  "badgeScopeOption": "all"              // New default logic
}
```

**Behavior**:
- User sees default global badge count
- All preferences use backwards-compatible defaults

---

**Scenario 3: Downgrade v1.0.0 → v0.9.9 (Graceful Degradation)**
```
BEFORE (v1.0.0 storage):
{
  "displayOption": "alwaysSVG",
  "displayStyleOption": "oneLinePerWindow",
  "badgeScopeOption": "current"  // v0.9.9 doesn't know this key
}

AFTER (v0.9.9 reads storage):
{
  "displayOption": "alwaysSVG",
  "displayStyleOption": "oneLinePerWindow",
  "badgeScopeOption": "current"  // Ignored by v0.9.9 (unknown key)
}
```

**Behavior**:
- v0.9.9 ignores unknown `badgeScopeOption` key
- Badge reverts to global count (v0.9.9 behavior)
- No errors, no data corruption
- User experience: badge scope preference "lost" but recoverable on re-upgrade

---

## Backwards Compatibility Guarantees

1. **Additive-Only Change**: No existing keys modified or removed
2. **Default Preserves v0.9.9**: `badgeScopeOption="all"` matches global count behavior
3. **No Breaking Changes**: Users who never open popup see zero behavioral change
4. **Graceful Degradation**: Downgrade to v0.9.9 safe (unknown key ignored)
5. **No Migration Code**: Storage API defaults handle missing keys transparently

---

## Testing Scenarios

### Unit Test Cases

| Test Case | Input | Expected Output | Validation |
|-----------|-------|----------------|------------|
| Read default (missing key) | Storage: `{}` | `"all"` | Default applied |
| Read valid "all" | Storage: `{ badgeScopeOption: "all" }` | `"all"` | Direct read |
| Read valid "current" | Storage: `{ badgeScopeOption: "current" }` | `"current"` | Direct read |
| Read invalid string | Storage: `{ badgeScopeOption: "invalid" }` | `"all"` | Fallback to default |
| Read wrong type | Storage: `{ badgeScopeOption: 123 }` | `"all"` | Type validation |
| Write valid "current" | Input: `"current"` | Storage: `{ badgeScopeOption: "current" }` | Write success |
| Write invalid value | Input: `"invalid"` | Error thrown | Fail-fast validation |

---

### Integration Test Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Fresh install | 1. Install v1.0.0<br>2. Read storage | `badgeScopeOption === "all"`, global badge shown |
| Upgrade from v0.9.9 | 1. Start with v0.9.9 storage<br>2. Upgrade to v1.0.0<br>3. Read storage | `badgeScopeOption === "all"`, existing keys unchanged |
| User changes preference | 1. Open popup<br>2. Select "Current Window Only"<br>3. Verify storage | `badgeScopeOption === "current"` written |
| Storage change event | 1. Write `"current"`<br>2. Listen for change event<br>3. Verify `newValue` | Event fires with `newValue === "current"` |
| Corrupt data recovery | 1. Manually corrupt storage: `badgeScopeOption: null`<br>2. Read value | Returns `"all"` (default fallback) |

---

## API Stability Commitment

**Stable APIs** (will NOT change in v1.x releases):
- Storage key name: `badgeScopeOption`
- Value enum: `"all"` | `"current"`
- Default value: `"all"`

**Deprecation Policy**:
- If `badgeScopeOption` needs to change (e.g., adding new modes), follow 2-version deprecation notice per constitution
- Example future path: `"all" | "current" | "recent-window"` (additive, backwards compatible)

---

## Security Considerations

**Threat Model**:
- **Malicious Extension**: Could modify storage directly
- **User Tampering**: Could manually edit storage via `about:debugging`

**Mitigations**:
- **Input Validation**: All reads validate and sanitize (fallback to safe default)
- **Type Checking**: Reject non-string values
- **Enum Validation**: Only accept exact string matches (`"all"`, `"current"`)
- **No Eval/Code Injection**: Storage values never executed as code

**Non-Threats**:
- Storage quota exhaustion: Single short string (~10 bytes), negligible
- XSS/injection: Storage values only used as enum flags, never rendered as HTML

---

## Performance Characteristics

| Operation | Latency | Frequency | Impact |
|-----------|---------|-----------|--------|
| Read (initialization) | <5ms | Once per extension startup | Negligible |
| Read (storage.onChanged) | <1ms (cached) | Once per user preference change | Negligible |
| Write (user action) | <10ms | Rare (user config change) | Negligible |
| Validation | <0.1ms | Per read/write | Negligible |

**Total Storage Overhead**: ~10 bytes (string "badgeScopeOption" + value "current")

---

## Documentation Requirements

### Developer Checklist

- [x] Storage key documented in data-model.md
- [x] API contract specified (read/write signatures)
- [x] Migration strategy documented (v0.9.9 → v1.0.0)
- [x] Validation rules defined (enum + type checking)
- [x] Error handling specified (fallback to default)
- [x] Backwards compatibility guaranteed (additive change)
- [x] Test cases enumerated (unit + integration)

### Implementation Checklist

- [ ] Add `getBadgeScopeOption()` function in background.js
- [ ] Add validation logic (enum + type checking)
- [ ] Add storage.onChanged listener for badgeScopeOption
- [ ] Update popup.js to read/write badgeScopeOption
- [ ] Add radio buttons to popup.html
- [ ] Test fresh install behavior
- [ ] Test v0.9.9 upgrade path
- [ ] Verify manual QA with storage corruption scenarios

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-02 | Initial contract - added `badgeScopeOption` key |

---

**Contract Status**: ✅ Stable - Ready for implementation
