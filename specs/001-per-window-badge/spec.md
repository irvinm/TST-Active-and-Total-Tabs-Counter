# Feature Specification: Per-Window Badge Counting

**Feature Branch**: `001-per-window-badge`  
**Created**: 2025-12-27  
**Status**: Draft  
**Input**: User description: "Allow the user to select an option to make the addon badge show the number of tabs for the individual windows rather than the total number of tabs"

## Clarifications

### Session 2026-01-02

- Q: What should happen when a private window has focus but the extension lacks private browsing permission? → A: Show "N/A" (indicate unavailable data)
- Q: How long should the system wait before updating the badge after a window focus change to balance responsiveness with flicker prevention? → A: 50ms
- Q: Should the extension provide a visual indicator or tooltip explaining the "N/A" state? → A: Show tooltip on hover explaining "Private window - permission required"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Window-Specific Tab Monitoring (Priority: P1)

A user with multiple browser windows open wants to see at a glance how many tabs are in their current window, rather than seeing a total count across all windows. They configure the badge to show per-window counts and switch between windows, seeing the badge update to reflect the active window's tab count.

**Why this priority**: This is the core feature request. Users working with multiple windows need contextual information about their current workspace, not aggregate data. This delivers immediate value as a standalone feature.

**Independent Test**: Can be fully tested by opening 2+ windows with different tab counts, enabling per-window mode, and verifying the badge shows the correct count for whichever window has focus. Delivers value even if other stories aren't implemented.

**Acceptance Scenarios**:

1. **Given** the extension is installed with default settings (showing total tabs), **When** the user opens the popup and selects "Current Window Only" badge scope, **Then** the badge displays only the tab count for the currently focused window
2. **Given** per-window mode is enabled with 5 tabs in Window A and 10 tabs in Window B, **When** the user switches focus from Window A to Window B, **Then** the badge updates from "5" to "10" within 100ms
3. **Given** per-window mode is enabled, **When** the user opens/closes tabs in the currently focused window, **Then** the badge count updates immediately to reflect the new tab count
4. **Given** per-window mode is enabled with multiple windows open, **When** the user opens/closes tabs in a non-focused background window, **Then** the badge count for the focused window remains unchanged

---

### User Story 2 - Preference Persistence (Priority: P2)

A user configures their preferred badge scope (per-window or all windows) and expects this choice to persist across browser restarts and window sessions.

**Why this priority**: Configuration persistence is essential for a professional user experience, but the feature can be tested without persistence first (would just reset to default on restart). This is a natural enhancement once core functionality works.

**Independent Test**: Can be tested by setting badge scope preference, restarting Firefox, and verifying the setting persists. Delivers value by preventing users from needing to reconfigure every session.

**Acceptance Scenarios**:

1. **Given** the user has selected "Current Window Only" mode, **When** they close and reopen Firefox, **Then** the badge scope remains set to "Current Window Only"
2. **Given** the user has selected "All Windows" mode (default), **When** they close and reopen Firefox, **Then** the badge scope remains set to "All Windows"
3. **Given** the extension is newly installed, **When** the user first opens the popup, **Then** the default badge scope is "All Windows" (backwards compatible with existing behavior)

---

### User Story 3 - Clear UI Labeling (Priority: P3)

A user opens the configuration popup and immediately understands the difference between badge scope options through clear, intuitive labeling and organization.

**Why this priority**: Good UX is important, but the feature is functional without perfect labels. This can be refined after core functionality works. Users can still discover and use the feature even with basic labeling.

**Independent Test**: Can be tested through usability testing - do users understand the options without external documentation? Delivers value by reducing support burden and improving discoverability.

**Acceptance Scenarios**:

1. **Given** the user opens the popup, **When** they view the badge scope section, **Then** they see clearly labeled radio button options: "All Windows" and "Current Window Only"
2. **Given** the user is viewing the badge scope options, **When** they read the section label, **Then** it clearly indicates this controls what the badge number represents (e.g., "Badge Scope" or "Badge Count Mode")
3. **Given** the user selects an option, **When** the badge updates, **Then** the change is immediate (no save button required)

---

### Edge Cases

- **What happens when the focused window has no tabs?** The badge should show "0" (edge case: Firefox generally requires at least one tab per window, but handle gracefully)
- **What happens when the user closes the last window while per-window mode is active?** The extension should continue running in the background; when a new window opens, it shows that window's count
- **How does the system handle rapid window focus changes?** Badge updates are debounced with a 50ms delay to prevent flickering and excessive computation while maintaining responsiveness
- **What happens when a private window has focus in per-window mode?** If the extension has private browsing permission, the badge shows the count for the private window. If permission is denied, the badge displays "N/A" with a tooltip on hover explaining "Private window - permission required"
- **What happens when the user switches modes while actively managing tabs?** The badge immediately reflects the new counting mode; no tabs are lost or miscounted during the transition
- **What happens when TST is updating/reorganizing tabs?** The badge count should remain accurate and reflect the current tab count regardless of TST's tree restructuring operations

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a user-selectable option to choose between "All Windows" (global tab count) and "Current Window Only" (per-window tab count) badge display modes
- **FR-002**: System MUST persist the user's badge scope preference across browser sessions using local storage
- **FR-003**: System MUST update the badge to show the correct tab count for the currently focused window when "Current Window Only" mode is active
- **FR-004**: System MUST detect window focus changes and update the badge within 100ms when in "Current Window Only" mode
- **FR-005**: System MUST maintain backwards compatibility by defaulting to "All Windows" mode for new installations and existing users who haven't configured the preference
- **FR-006**: System MUST apply the badge scope preference independently of other display preferences (native vs SVG badge rendering, one-line vs compact layout)
- **FR-007**: System MUST count tabs accurately regardless of whether they are active, inactive, pinned, or discarded when in "Current Window Only" mode
- **FR-008**: System MUST display "N/A" on the badge when a private window has focus in "Current Window Only" mode and the extension lacks private browsing permission
- **FR-009**: System MUST debounce window focus change events with a 50ms delay to prevent badge flickering while maintaining the 100ms total update requirement
- **FR-010**: UI MUST display the badge scope configuration in the popup interface with clear labels distinguishing between the two modes
- **FR-011**: UI MUST apply preference changes immediately without requiring a save button or browser restart
- **FR-012**: System MUST provide a tooltip on badge hover that explains "Private window - permission required" when displaying "N/A" due to lack of private browsing permission

### Key Entities

- **Badge Scope Preference**: A user setting that determines whether the badge shows global tab count (all windows) or focused window tab count (current window only). Values: `"all"` (default) or `"current"`. Stored persistently and applied immediately when changed.
- **Window Focus State**: The currently active browser window. The system must track which window has focus to query the correct tab set when in per-window mode.
- **Tab Count**: The number of tabs matching the badge scope criteria. In "all" mode, counts all tabs across all windows. In "current" mode, counts only tabs in the focused window.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can toggle between badge modes and see the badge update within 100ms of making the selection
- **SC-002**: Badge accuracy remains 100% correct across window focus changes in per-window mode (tested with 2-10 windows containing 1-100 tabs each)
- **SC-003**: Preference persistence works reliably - 100% of saved preferences are correctly restored after browser restart
- **SC-004**: Feature adds zero performance overhead when in default "All Windows" mode (no regression for users who don't use per-window counting)
- **SC-005**: Feature adds < 50ms overhead for window focus changes when in "Current Window Only" mode (measured across 1000+ focus change events)
- **SC-006**: UI configuration is discoverable - users can locate and understand the badge scope option within 30 seconds of opening the popup (usability testing metric)
- **SC-007**: Extension passes all platform security and policy validation checks without warnings

### Constitution Alignment

This feature specification aligns with project constitution principles (see [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0):

**✅ Principle I - Browser Extension Architecture**: Feature follows WebExtension standards:
- Badge scope preference stored in `browser.storage.local`
- Window focus tracking uses standard `browser.windows` API
- Configuration UI added to existing `popup.html`/`popup.js`
- Tab counting logic centralized in `background.js`

**✅ Principle II - TST Integration Contract**: No changes to TST integration:
- Feature operates independently of TST message protocol
- Tab counting remains compatible with TST's tree structure
- Badge rendering (native/SVG) continues to use existing TST CSS injection

**✅ Principle III - User Choice & Configurability**: Feature expands user configuration:
- Adds new `badgeScopeOption` storage key alongside existing `displayOption` and `displayStyleOption`
- Default value ("All Windows") preserves existing behavior
- Changes apply immediately without requiring restart
- Option is clearly presented in popup UI

**⚠️ Principle IV - Performance & Responsiveness**: Feature introduces performance considerations:
- Per-window mode requires listening to window focus events (new overhead)
- Tab queries must be scoped to specific windows (potentially more efficient than global queries)
- Rapid window switching could trigger frequent badge updates (mitigation: debouncing/throttling)
- **Performance requirement**: Badge updates complete within 100ms of window focus change
- **Stress test**: Must handle 10+ windows with 100+ tabs each without UI blocking

**✅ Principle V - Backwards Compatibility**: Feature maintains backwards compatibility:
- Default mode ("All Windows") preserves v0.9.9 behavior for existing users
- Storage schema adds new key without modifying existing keys
- No changes to TST protocol or existing display options
- Users who never configure badge scope see identical behavior to previous versions
