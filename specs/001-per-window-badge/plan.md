# Implementation Plan: Per-Window Badge Counting

**Branch**: `001-per-window-badge` | **Date**: 2026-01-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-per-window-badge/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add user-configurable badge scope option allowing users to choose between showing total tab count across all windows (default, current behavior) or tab count for the currently focused window only. The feature introduces a new storage preference (`badgeScopeOption`), window focus tracking, and debounced badge updates to maintain performance while providing contextual information for multi-window workflows.

## Technical Context

**Language/Version**: JavaScript ES6+ (Firefox WebExtension APIs)  
**Primary Dependencies**: Firefox 79+, Tree Style Tab extension (runtime dependency), WebExtension APIs (browser.tabs, browser.windows, browser.storage, browser.runtime)  
**Storage**: browser.storage.local (user preferences: displayOption, displayStyleOption, badgeScopeOption)  
**Testing**: Manual QA with test matrix {1, 2, 5, 10 windows} × {1, 50, 500, 1000 tabs} × {all/current badge scope}  
**Target Platform**: Firefox 79+ (per manifest.json strict_min_version)  
**Project Type**: Browser Extension (WebExtension Manifest V2)  
**Performance Goals**: Badge updates <100ms (window focus changes <50ms overhead, 50ms debounce)  
**Constraints**: No eval/inline scripts (CSP), offline-only, no external network, SVG badge 128x128px max  
**Scale/Scope**: 1000+ tabs across 10+ windows without UI blocking

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Initial Check (Pre-Research)**: ✅ PASSED

Verify compliance with `.specify/memory/constitution.md` (v1.0.0):

- [x] **Principle I (Browser Extension Architecture)**: Feature uses proper WebExtension structure (background.js for logic, popup.html/popup.js for UI, manifest.json for permissions, storage in browser.storage.local)
- [x] **Principle II (TST Integration Contract)**: No changes to TST messaging protocol - feature operates independently of TST communication, badge scope preference doesn't affect TST sidebar content
- [x] **Principle III (User Choice & Configurability)**: New badgeScopeOption stored in browser.storage.local alongside existing displayOption and displayStyleOption, default preserves current behavior, UI updated in popup.html
- [x] **Principle IV (Performance & Responsiveness)**: Badge updates target <100ms (50ms debounce + 50ms tab query/update), handles 1000+ tabs across 10+ windows, efficient scoped queries (per-window queries potentially faster than global)
- [x] **Principle V (Backwards Compatibility)**: Default "all" mode preserves v0.9.9 behavior, storage adds new key without modifying existing schema, no user intervention required, existing users see identical behavior until they configure the new option
- [x] **Technical Constraints**: Firefox 79+ compatible (uses standard browser.windows API), Manifest V2 compliant, no eval/inline scripts, offline-only operation, no external dependencies added
- [x] **Development Standards**: Manual test matrix expansion required (add badge scope dimension), ESLint verification needed, AMO validator will check for CSP compliance and API usage

**Post-Design Check**: ✅ PASSED

Re-verification after Phase 0 (Research) and Phase 1 (Design):

- [x] **Principle I**: Confirmed - All logic in background.js (window focus tracking, badge scope logic), UI in popup.html/popup.js (badge scope radio buttons), storage in browser.storage.local (badgeScopeOption key)
- [x] **Principle II**: Confirmed - TST integration unchanged, feature operates at badge level only, no TST protocol modifications
- [x] **Principle III**: Confirmed - Storage contract specifies badgeScopeOption key with default "all", popup UI adds radio button group, immediate preference application (no save button)
- [x] **Principle IV**: Confirmed - Research validates per-window queries faster than global queries, debounce strategy (50ms trailing-edge) prevents flicker, total latency budget <100ms achievable
- [x] **Principle V**: Confirmed - Storage schema is additive-only (no existing keys modified), default "all" preserves v0.9.9 behavior, graceful downgrade to v0.9.9 (unknown key ignored), no migration code required
- [x] **Technical Constraints**: Confirmed - No new permissions needed (existing "storage" sufficient), browser.windows API standard in Firefox 79+, no eval/inline scripts, offline operation maintained
- [x] **Development Standards**: Confirmed - Test matrix expanded in quickstart.md, ESLint compatibility maintained (no new linting violations), AMO validator requirements met (CSP compliant)

**Exceptions/Justifications**: None - feature fully compliant with all constitutional principles after design phase

## Project Structure

### Documentation (this feature)

```text
specs/001-per-window-badge/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   └── storage-schema.md
└── checklists/
    └── requirements.md  # Specification validation checklist (complete)
```

### Source Code (repository root)

```text
TST-Active-and-Total-Tabs-Counter/
├── manifest.json              # WebExtension manifest (permissions, metadata)
├── background.js              # Background script (tab counting, badge updates, window focus tracking)
├── popup.html                 # Configuration UI structure
├── popup.js                   # Configuration UI logic (load/save preferences)
├── popup.css                  # Configuration UI styling
├── images/                    # Extension icons and UI images
├── .specify/                  # Specification workflow artifacts
│   ├── memory/
│   │   └── constitution.md    # Project constitution (v1.0.0)
│   ├── scripts/
│   │   └── powershell/        # Workflow automation scripts
│   └── templates/             # Specification templates
└── specs/                     # Feature specifications directory
    └── 001-per-window-badge/  # This feature
```

**Structure Decision**: Single project structure (browser extension). All logic centralized in background.js per WebExtension architecture principles. Configuration UI in popup.html/popup.js follows existing pattern for displayOption and displayStyleOption. No new files required - modifications to existing files only.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - table not applicable. All constitutional principles satisfied without exceptions.
